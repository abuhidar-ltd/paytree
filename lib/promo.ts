import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { resolveUserPlan } from "@/lib/plans"
import type { CompPlan } from "@/lib/comped"

/**
 * Promo codes — self-serve comped plans.
 *
 * Redemption is the promo twin of lib/comped.ts grantComp: it sets the same
 * subscription + isComped columns (so every feature gate, MRR exclusion, and
 * check-on-read expiry works unchanged) and writes the same PlanGrantLog
 * audit rows with grantedBy="promo:CODE" — one unified free-access history.
 *
 * Every failure except "you already have a plan" returns the same generic
 * message so the endpoint can't be used to enumerate which codes exist.
 */

export const PROMO_GENERIC_ERROR = "Invalid or expired code"
export const PROMO_ALREADY_PLAN_ERROR =
  "You already have an active plan. Contact support if you'd like to redeem this code."

export const PROMO_PLANS: CompPlan[] = ["pro", "ultra"]

export const PROMO_DURATIONS: { id: string; label: string; days: number | null }[] = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
  { id: "180", label: "180 days", days: 180 },
  { id: "365", label: "365 days", days: 365 },
  { id: "lifetime", label: "Lifetime", days: null },
]

// Uppercase letters + digits, dashes allowed inside. 4–40 chars.
export const PROMO_CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,38}[A-Z0-9]$/

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase()
}

/** Suggest a code like PAYTREE-7F3K. Unambiguous alphabet (no 0/O, 1/I/L). */
export function generatePromoCode(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
  const bytes = randomBytes(4)
  let suffix = ""
  for (let i = 0; i < 4; i++) suffix += alphabet[bytes[i] % alphabet.length]
  return `PAYTREE-${suffix}`
}

export type RedeemResult =
  | { ok: true; plan: CompPlan; expiresAt: Date | null }
  | { ok: false; error: string }

/**
 * Validate + redeem a promo code for a user. The redemption slot is claimed
 * with a conditional increment inside the transaction, so two simultaneous
 * requests can never oversubscribe maxRedemptions.
 */
export async function redeemPromoCode(userId: string, rawCode: string): Promise<RedeemResult> {
  const codeStr = normalizePromoCode(rawCode)
  if (!PROMO_CODE_RE.test(codeStr)) return { ok: false, error: PROMO_GENERIC_ERROR }

  const now = new Date()

  const promo = await prisma.promoCode.findUnique({ where: { code: codeStr } })
  if (!promo || !promo.active) return { ok: false, error: PROMO_GENERIC_ERROR }
  if (promo.expiresAt && now > promo.expiresAt) return { ok: false, error: PROMO_GENERIC_ERROR }
  if (promo.maxRedemptions !== null && promo.timesRedeemed >= promo.maxRedemptions) {
    return { ok: false, error: PROMO_GENERIC_ERROR }
  }
  if (!PROMO_PLANS.includes(promo.plan as CompPlan)) {
    // Defensive: a mis-seeded plan value must never be written onto a user.
    console.error(`[promo] code ${codeStr} has invalid plan "${promo.plan}"`)
    return { ok: false, error: PROMO_GENERIC_ERROR }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      isComped: true,
      compedExpiresAt: true,
    },
  })
  if (!user) return { ok: false, error: PROMO_GENERIC_ERROR }

  // Anyone whose plan currently resolves above Free — paid, trialing, or
  // already comped — is blocked. No stacking/upgrade logic by design.
  if (resolveUserPlan(user) !== "free") {
    return { ok: false, error: PROMO_ALREADY_PLAN_ERROR }
  }

  const plan = promo.plan as CompPlan
  const expiresAt =
    promo.durationDays !== null
      ? new Date(now.getTime() + promo.durationDays * 24 * 60 * 60 * 1000)
      : null

  const claimed = await prisma.$transaction(async (tx) => {
    // Claim a redemption slot atomically — the WHERE re-checks active +
    // remaining capacity so concurrent redemptions can't exceed the cap.
    const claim = await tx.promoCode.updateMany({
      where: {
        id: promo.id,
        active: true,
        ...(promo.maxRedemptions !== null
          ? { timesRedeemed: { lt: promo.maxRedemptions } }
          : {}),
      },
      data: { timesRedeemed: { increment: 1 } },
    })
    if (claim.count === 0) return false

    await tx.promoRedemption.create({
      data: { promoCodeId: promo.id, userId, planGranted: plan, expiresAt },
    })
    // Same audit trail as manual admin grants — close any stale open rows
    // first so re-grants stay truthful, mirroring grantComp.
    await tx.planGrantLog.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    })
    await tx.planGrantLog.create({
      data: {
        userId,
        plan,
        duration: promo.durationDays !== null ? `${promo.durationDays}d` : "lifetime",
        reason: `Promo code: ${codeStr}`,
        grantedBy: `promo:${codeStr}`,
      },
    })
    await tx.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionInterval: null,
        subscriptionEndsAt: expiresAt,
        isComped: true,
        compedReason: `Promo code: ${codeStr}`,
        compedBy: null,
        compedExpiresAt: expiresAt,
        compedSource: "promo",
        promoCodeId: promo.id,
      },
    })
    return true
  })

  if (!claimed) return { ok: false, error: PROMO_GENERIC_ERROR }

  console.log(`[promo] redeemed code=${codeStr} user=${userId} plan=${plan} until=${expiresAt?.toISOString() ?? "lifetime"}`)
  return { ok: true, plan, expiresAt }
}
