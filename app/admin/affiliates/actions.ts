"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdminAction } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import {
  AFFILIATE_SLUG_RE,
  generateStatsToken,
  slugifyName,
  slugWithEntropy,
} from "@/lib/affiliate-server"
import { Prisma } from "@prisma/client"

/**
 * Admin mutations for the partner-affiliate system. Server Actions are
 * directly invokable POST endpoints, so every action re-checks the
 * ADMIN_EMAILS allowlist itself — page-level gating alone is not a defense.
 */

export type AffiliateActionState = { ok: boolean; message: string } | null

function parseCommission(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim()
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  if (n < 0 || n > 100) return null
  return Math.round(n * 100) / 100 // 2dp
}

async function nextAvailableSlug(base: string): Promise<string> {
  const clean = slugifyName(base)
  const seen = await prisma.affiliate.findMany({
    where: { slug: { startsWith: clean } },
    select: { slug: true },
  })
  const taken = new Set(seen.map((s) => s.slug))
  if (!taken.has(clean)) return clean
  for (let i = 2; i <= 50; i++) {
    const candidate = `${clean}-${i}`.slice(0, 40)
    if (!taken.has(candidate)) return candidate
  }
  // 50 collisions on the same base is essentially "typo'd my seed name" — fall
  // through to a hex-entropy suffix so the admin isn't stuck retrying.
  return slugWithEntropy(base)
}

async function logAudit(
  affiliateId: string,
  action: string,
  changes: Prisma.InputJsonValue | null,
  performedBy: string
): Promise<void> {
  try {
    await prisma.affiliateAuditLog.create({
      data: {
        affiliateId,
        action,
        changes: changes ?? Prisma.JsonNull,
        performedBy,
      },
    })
  } catch (err) {
    // Audit-log write failure should not roll back the mutation — but it must
    // be loud in logs so a partial audit trail is investigatable.
    console.error(
      `[admin:affiliate] audit-log FAILED affiliate=${affiliateId} action=${action} by=${performedBy}:`,
      err
    )
  }
}

export async function createAffiliateAction(
  _prev: AffiliateActionState,
  formData: FormData
): Promise<AffiliateActionState> {
  const admin = await requireAdminAction()

  const name = String(formData.get("name") ?? "").trim()
  const slugRaw = String(formData.get("slug") ?? "").trim().toLowerCase()
  const commission = parseCommission(formData.get("commissionPercent"))

  if (name.length < 2 || name.length > 80) {
    return { ok: false, message: "Name must be 2–80 characters." }
  }
  if (commission === null) {
    return { ok: false, message: "Commission must be a number between 0 and 100." }
  }

  const slug = slugRaw
    ? slugifyName(slugRaw) // still sanitise admin input — no whitespace, no case
    : await nextAvailableSlug(name)

  if (!AFFILIATE_SLUG_RE.test(slug)) {
    return { ok: false, message: "Slug must be 1–40 chars: lowercase letters, digits, dashes." }
  }

  try {
    const created = await prisma.affiliate.create({
      data: {
        name,
        slug,
        statsToken: generateStatsToken(),
        commissionPercent: commission,
      },
      select: { id: true, slug: true },
    })
    await logAudit(created.id, "create", { name, slug: created.slug, commissionPercent: commission }, admin.email)
    console.log(`[admin:affiliate] create id=${created.id} slug=${created.slug} by=${admin.email}`)
    revalidatePath("/admin/affiliates")
    redirect(`/admin/affiliates/${created.id}?created=1`)
  } catch (err) {
    // Redirect() throws — that's expected control flow, not an error.
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err
    if ((err as { code?: string })?.code === "P2002") {
      return { ok: false, message: `Slug "${slug}" is already taken — pick another.` }
    }
    console.error("[admin:affiliate] create failed:", err)
    return { ok: false, message: "Create failed — check server logs." }
  }
}

export async function updateAffiliateAction(
  _prev: AffiliateActionState,
  formData: FormData
): Promise<AffiliateActionState> {
  const admin = await requireAdminAction()

  const id = String(formData.get("id") ?? "")
  const commission = parseCommission(formData.get("commissionPercent"))
  const active = formData.get("active") === "on"

  if (!id) return { ok: false, message: "Missing affiliate id." }
  if (commission === null) {
    return { ok: false, message: "Commission must be a number between 0 and 100." }
  }

  const before = await prisma.affiliate.findUnique({
    where: { id },
    select: { commissionPercent: true, active: true },
  })
  if (!before) return { ok: false, message: "Affiliate not found." }

  await prisma.affiliate.update({
    where: { id },
    data: { commissionPercent: commission, active },
  })
  const changes: Prisma.InputJsonValue = {
    commissionPercent: { from: before.commissionPercent.toString(), to: commission },
    active: { from: before.active, to: active },
  }
  await logAudit(id, "update", changes, admin.email)
  console.log(
    `[admin:affiliate] update id=${id} commission=${commission} active=${active} by=${admin.email}`
  )
  revalidatePath("/admin/affiliates")
  revalidatePath(`/admin/affiliates/${id}`)
  return { ok: true, message: "Saved." }
}

// Slug change is intentionally a separate, one-shot action with its own
// destructive-warning UI — regenerating breaks every existing shareable
// referral URL, so this cannot be muxed with the ordinary "save" action.
export async function regenerateAffiliateSlugAction(
  _prev: AffiliateActionState,
  formData: FormData
): Promise<AffiliateActionState> {
  const admin = await requireAdminAction()

  const id = String(formData.get("id") ?? "")
  const requested = String(formData.get("newSlug") ?? "").trim().toLowerCase()
  if (!id) return { ok: false, message: "Missing affiliate id." }
  if (!requested) return { ok: false, message: "New slug required." }

  const current = await prisma.affiliate.findUnique({ where: { id }, select: { slug: true, name: true } })
  if (!current) return { ok: false, message: "Affiliate not found." }

  const newSlug = slugifyName(requested)
  if (!AFFILIATE_SLUG_RE.test(newSlug)) {
    return { ok: false, message: "Slug must be 1–40 chars: lowercase letters, digits, dashes." }
  }
  if (newSlug === current.slug) {
    return { ok: false, message: "Slug is already that value." }
  }

  try {
    await prisma.affiliate.update({ where: { id }, data: { slug: newSlug } })
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return { ok: false, message: `Slug "${newSlug}" is already taken.` }
    }
    throw err
  }
  await logAudit(id, "regenerate_slug", { from: current.slug, to: newSlug }, admin.email)
  console.log(`[admin:affiliate] slug change id=${id} from=${current.slug} to=${newSlug} by=${admin.email}`)
  revalidatePath("/admin/affiliates")
  revalidatePath(`/admin/affiliates/${id}`)
  return { ok: true, message: `Slug is now ${newSlug}. Old referral links no longer work.` }
}
