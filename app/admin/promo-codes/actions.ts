"use server"

import { revalidatePath } from "next/cache"
import { requireAdminAction } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import {
  PROMO_CODE_RE,
  PROMO_DURATIONS,
  PROMO_PLANS,
  normalizePromoCode,
} from "@/lib/promo"
import type { CompPlan } from "@/lib/comped"

/**
 * Admin mutations for promo codes. Server Actions are directly invokable POST
 * endpoints, so every action re-checks the ADMIN_EMAILS allowlist itself —
 * page-level gating alone is not a defense.
 */

export type PromoActionState = { ok: boolean; message: string } | null

export async function createPromoCodeAction(
  _prev: PromoActionState,
  formData: FormData
): Promise<PromoActionState> {
  const admin = await requireAdminAction()

  const code = normalizePromoCode(String(formData.get("code") ?? ""))
  const plan = String(formData.get("plan") ?? "")
  const duration = String(formData.get("duration") ?? "")
  const maxRaw = String(formData.get("maxRedemptions") ?? "").trim()
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()

  if (!PROMO_CODE_RE.test(code)) {
    return { ok: false, message: "Code must be 4–40 chars: letters, digits, dashes." }
  }
  if (!PROMO_PLANS.includes(plan as CompPlan)) {
    return { ok: false, message: "Pick a plan: Pro or Ultra." }
  }
  const durationDef = PROMO_DURATIONS.find((d) => d.id === duration)
  if (!durationDef) return { ok: false, message: "Pick a duration." }

  let maxRedemptions: number | null = null
  if (maxRaw) {
    const n = Number(maxRaw)
    if (!Number.isInteger(n) || n < 1 || n > 1_000_000) {
      return { ok: false, message: "Max redemptions must be a whole number ≥ 1 (or blank for unlimited)." }
    }
    maxRedemptions = n
  }

  let expiresAt: Date | null = null
  if (expiresRaw) {
    // <input type="date"> gives YYYY-MM-DD — make the code valid THROUGH that
    // day (end of day UTC), not until its first millisecond.
    const parsed = new Date(`${expiresRaw}T23:59:59.999Z`)
    if (Number.isNaN(parsed.getTime())) return { ok: false, message: "Invalid expiry date." }
    if (parsed <= new Date()) return { ok: false, message: "Expiry date is already in the past." }
    expiresAt = parsed
  }

  if (note.length > 500) return { ok: false, message: "Note too long (500 chars max)." }

  try {
    await prisma.promoCode.create({
      data: {
        code,
        plan,
        durationDays: durationDef.days,
        maxRedemptions,
        expiresAt,
        note: note || null,
        createdBy: admin.email,
      },
    })
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return { ok: false, message: `Code "${code}" already exists — pick another.` }
    }
    console.error("[admin:promo] create failed:", err)
    return { ok: false, message: "Create failed — check server logs." }
  }

  console.log(`[admin:promo] create code=${code} plan=${plan} duration=${durationDef.id} max=${maxRedemptions ?? "∞"} by=${admin.email}`)
  revalidatePath("/admin/promo-codes")
  return { ok: true, message: `Created ${code}.` }
}

export async function setPromoCodeActiveAction(formData: FormData): Promise<void> {
  const admin = await requireAdminAction()

  const id = String(formData.get("id") ?? "")
  const active = String(formData.get("active") ?? "") === "true"
  if (!id) return

  await prisma.promoCode.update({ where: { id }, data: { active } })
  console.log(`[admin:promo] ${active ? "reactivate" : "deactivate"} id=${id} by=${admin.email}`)
  revalidatePath("/admin/promo-codes")
}
