import { prisma } from "@/lib/prisma"
import type { PlanId } from "@/lib/plans"

/**
 * Comped (admin-granted) plans — the single home for grant / revoke / expiry.
 *
 * A comp sets the normal subscription columns (status="active" + plan) so
 * every existing feature gate unlocks through resolveUserPlan with zero
 * special-casing, plus the isComped* columns so revenue math can exclude it.
 * No Stripe objects are ever created. Every state change writes PlanGrantLog.
 *
 * Interactions with real money, in one place:
 *  - GRANT refuses users who have a live Stripe subscription (paying
 *    customers must never be silently converted into non-paying ones).
 *  - The Stripe webhook clears the comped columns when a real subscription
 *    activates (see clearCompOnRealSubscription) — an upgraded friend
 *    becomes a normal paying customer and re-enters MRR.
 *  - EXPIRY is check-on-read: resolveUserPlan already treats an expired comp
 *    as free instantly; expireCompIfDue() makes the DB row match on the
 *    user's next authenticated request.
 */

export type CompPlan = Extract<PlanId, "pro" | "ultra">
export type CompDuration = "1m" | "3m" | "6m" | "12m" | "lifetime"

export const COMP_PLANS: CompPlan[] = ["pro", "ultra"]

export const COMP_DURATIONS: { id: CompDuration; label: string; months: number | null }[] = [
  { id: "1m", label: "1 month", months: 1 },
  { id: "3m", label: "3 months", months: 3 },
  { id: "6m", label: "6 months", months: 6 },
  { id: "12m", label: "1 year", months: 12 },
  { id: "lifetime", label: "Lifetime", months: null },
]

export function compExpiryDate(duration: CompDuration, from: Date = new Date()): Date | null {
  const def = COMP_DURATIONS.find((d) => d.id === duration)
  if (!def || def.months === null) return null
  // Clamp to the target month's last day — a bare setMonth overflows short
  // months (Jan 31 + 1m would land on Mar 3, silently gifting extra days).
  const expires = new Date(from)
  const day = expires.getDate()
  expires.setDate(1)
  expires.setMonth(expires.getMonth() + def.months)
  const lastDay = new Date(expires.getFullYear(), expires.getMonth() + 1, 0).getDate()
  expires.setDate(Math.min(day, lastDay))
  return expires
}

export type GrantResult = { ok: true } | { ok: false; error: string }

/**
 * Grant a comped plan. Overwrites any previous comp (the old grant-log row is
 * closed first, so history stays truthful). Refuses paying customers.
 */
export async function grantComp(opts: {
  userId: string
  plan: CompPlan
  duration: CompDuration
  reason: string
  grantedBy: string
}): Promise<GrantResult> {
  const { userId, plan, duration, grantedBy } = opts
  const reason = opts.reason.trim()
  if (!reason) return { ok: false, error: "A reason is required." }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      stripeSubscriptionId: true,
      isComped: true,
    },
  })
  if (!user) return { ok: false, error: "User not found." }

  // Live Stripe subscription → this is a paying customer. Comping them would
  // desync the DB from Stripe and hide real revenue. Handle in Stripe instead.
  // "canceled" with a future subscriptionEndsAt is included: dunning maps to
  // "canceled" in our DB, and a canceled-mid-term subscriber still has paid
  // time that a comp overwrite (and its later revoke/expiry) would destroy.
  const hasLiveStatus = ["active", "trial", "canceling"].includes(user.subscriptionStatus ?? "")
  const hasPaidGraceTime =
    user.subscriptionStatus === "canceled" &&
    !user.isComped &&
    !!user.subscriptionEndsAt &&
    new Date(user.subscriptionEndsAt) > new Date()
  if (user.stripeSubscriptionId && (hasLiveStatus || hasPaidGraceTime)) {
    return {
      ok: false,
      error: hasPaidGraceTime
        ? "User still has paid Stripe time left — wait until it lapses or handle it in Stripe."
        : "User has a live Stripe subscription — manage it in Stripe, not via a comp.",
    }
  }

  const now = new Date()
  const compedExpiresAt = compExpiryDate(duration, now)

  await prisma.$transaction([
    // Close any still-open grant rows (re-granting replaces the old comp).
    prisma.planGrantLog.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    }),
    prisma.planGrantLog.create({
      data: { userId, plan, duration, reason, grantedBy },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionInterval: null,
        subscriptionEndsAt: compedExpiresAt,
        isComped: true,
        compedReason: reason,
        compedBy: grantedBy,
        compedExpiresAt,
        compedSource: "manual",
        promoCodeId: null,
      },
    }),
  ])
  return { ok: true }
}

/** Revert a comped user to Free and stamp the open grant-log rows. */
export async function revokeComp(userId: string): Promise<GrantResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isComped: true },
  })
  if (!user) return { ok: false, error: "User not found." }
  if (!user.isComped) return { ok: false, error: "User has no comped plan to revoke." }

  await revertCompToFree(userId, new Date())
  return { ok: true }
}

/**
 * Check-on-read expiry: if the comp's end date has passed, revert the row to
 * Free. Called from getCurrentUser on every authenticated read — it only ever
 * fires once per expired comp because it clears isComped. Returns true if a
 * revert happened (caller should re-read the user).
 */
export async function expireCompIfDue(user: {
  id: string
  isComped: boolean
  compedExpiresAt: Date | null
}): Promise<boolean> {
  if (!user.isComped || !user.compedExpiresAt) return false
  if (new Date() <= new Date(user.compedExpiresAt)) return false
  // Stamp the log with the scheduled expiry, not "now" — the comp ended when
  // it was supposed to, we're just recording it late.
  await revertCompToFree(user.id, new Date(user.compedExpiresAt))
  return true
}

async function revertCompToFree(userId: string, revokedAt: Date): Promise<void> {
  await prisma.$transaction([
    prisma.planGrantLog.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: null,
        subscriptionStatus: "free",
        subscriptionInterval: null,
        subscriptionEndsAt: null,
        isComped: false,
        compedReason: null,
        compedBy: null,
        compedExpiresAt: null,
        compedSource: null,
        promoCodeId: null,
      },
    }),
  ])
}

/**
 * For the Stripe webhook: when a real subscription activates for a user who
 * was comped, the comp is over — clear the flags (so they count in MRR) and
 * close the grant-log rows. Returns the update fragment to merge into the
 * webhook's own prisma.user.update, plus performs the log stamp.
 */
export async function closeCompGrantLogs(userId: string): Promise<void> {
  await prisma.planGrantLog.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

/** Data fragment that clears comp state — spread into user.update calls. */
export const CLEAR_COMP_FIELDS = {
  isComped: false,
  compedReason: null,
  compedBy: null,
  compedExpiresAt: null,
  compedSource: null,
  promoCodeId: null,
} as const
