import { randomUUID, randomBytes } from "crypto"
import { PLANS, resolveUserPlan } from "@/lib/plans"

/**
 * Server-only helpers for the affiliate/partner admin.
 * (Don't import into client bundles — pulls in Node crypto + full plan config.)
 */

// URL-safe slug from an arbitrary name. Strips diacritics, collapses non-alnum
// to single dashes, trims edges, clamps to 40 chars. Empty input → "partner"
// so create never proposes an invalid slug even for weird inputs.
export function slugifyName(name: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return s || "partner"
}

// Same shape validation the proxy uses when reading the cookie back.
export const AFFILIATE_SLUG_RE = /^[a-z0-9-]{1,40}$/

// Unguessable stats-URL token. UUIDv4 (36 chars w/ dashes) is easier to eyeball
// than base64; url-safe by construction; ~122 bits of entropy is plenty for a
// "share the link with your partner and don't post it publicly" secret.
export function generateStatsToken(): string {
  return randomUUID()
}

// Fallback slug generator for the vanishingly rare case where a proposed slug
// AND every "-2, -3, …" suffix up to a small cap collide. Length-8 hex on top
// of the base practically guarantees uniqueness without asking the admin to
// invent another one.
export function slugWithEntropy(base: string): string {
  return `${slugifyName(base).slice(0, 32)}-${randomBytes(4).toString("hex")}`
}

/**
 * Referred-user payout math.
 *
 * MRR contribution per user =
 *   monthly plan   → PLANS[plan].monthly
 *   yearly plan    → PLANS[plan].yearly / 12
 * Commission (cents) = mrr_cents × commission_percent / 100
 *
 * We compute against CURRENT prices (not a snapshot at signup) so a plan
 * price change flows to future commission runs; this matches how Stripe MRR
 * itself moves. Only paid users count — free/trial/canceled contribute 0.
 */
export interface ReferredUserForPayout {
  subscriptionStatus?: string | null
  subscriptionPlan?: string | null
  subscriptionInterval?: string | null
  trialEndsAt?: Date | null
  subscriptionEndsAt?: Date | null
  isComped?: boolean | null
  compedExpiresAt?: Date | null
}

export interface AffiliateStats {
  total: number
  free: number
  paid: number
  monthlyCommissionCents: number
}

export function computeAffiliateStats(
  users: ReferredUserForPayout[],
  commissionPercent: number
): AffiliateStats {
  let paid = 0
  let mrrCents = 0
  for (const u of users) {
    const plan = resolveUserPlan(u)
    if (plan === "free") continue
    // Comped users pay $0 — count them under paid for reporting but don't
    // pump payout math; the platform earned $0 from them.
    paid += 1
    if (u.isComped) continue
    const def = PLANS[plan]
    if (u.subscriptionInterval === "yearly") {
      mrrCents += Math.round(def.yearly / 12)
    } else {
      mrrCents += def.monthly
    }
  }
  const monthlyCommissionCents = Math.round((mrrCents * commissionPercent) / 100)
  return {
    total: users.length,
    free: users.length - paid,
    paid,
    monthlyCommissionCents,
  }
}

// Where the shareable stats URL lives. Callers usually format their own href;
// this is the single place the path is defined so /partners/[token] and the
// admin display never drift.
export function statsPath(statsToken: string): string {
  return `/partners/${statsToken}`
}

export function referralPath(slug: string): string {
  return `/?ref=${slug}`
}
