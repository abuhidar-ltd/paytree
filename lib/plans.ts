/**
 * Paytree Plan Definitions & Feature Gating
 *
 * Tiers (canonical):
 *  - free: $0
 *  - pro:  $4.99/mo or $29.99/yr
 *  - ultra: $14.99/mo or $99.99/yr
 *
 * Legacy DB compat:
 *  Existing users may have `subscriptionPlan = "starter"` from the previous
 *  pricing structure. Those users are treated as Pro — normalizePlanId maps
 *  "starter" → "pro" so downstream code only ever sees PlanId.
 *
 * Subscription intervals: "monthly" | "yearly"
 *
 * Env vars (Vercel — names kept as STARTER to avoid breaking the deployment):
 *  STRIPE_STARTER_MONTHLY_PRICE_ID   (referenced by "pro" plan internally)
 *  STRIPE_STARTER_YEARLY_PRICE_ID    (referenced by "pro" plan internally)
 *  STRIPE_ULTRA_MONTHLY_PRICE_ID
 *  STRIPE_ULTRA_YEARLY_PRICE_ID
 */

export type PlanId = "free" | "pro" | "ultra"
export type BillingInterval = "monthly" | "yearly"

export interface PlanDefinition {
  id: PlanId
  name: string
  monthly: number  // cents
  yearly: number   // cents (total for year)
  features: string[]
  limits: {
    links: number       // -1 = unlimited
    modules: number     // -1 = unlimited
    products: number    // -1 = unlimited
    folders: number     // -1 = unlimited
    vaultItems: number  // -1 = unlimited
  }
  canPublish: boolean
  platformFeePercent: number
  hasAnalytics: boolean          // basic views + clicks
  hasAdvancedAnalytics: boolean  // globe + country breakdown
  hasAiFeatures: boolean         // AI sales agent
  hasScheduling: boolean
  hasLockedLinks: boolean        // vault / payment / password gates
  hasEmailExport: boolean
  hasDrops: boolean              // countdown / drop cards
  hasCustomStyle: boolean        // cinematic hero + premium themes
  removeBranding: boolean
}

const UNLIMITED = {
  links: -1,
  modules: -1,
  products: -1,
  vaultItems: -1,
  folders: -1,
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    features: [
      "Unlimited link cards",
      "Product cards (sell anything)",
      "Stripe Connect (receive payments)",
      "0% platform fees",
      "Basic analytics (views + clicks)",
      "Custom accent color",
      "Classic hero style",
    ],
    limits: UNLIMITED,
    canPublish: true,
    platformFeePercent: 0,
    hasAnalytics: true,
    hasAdvancedAnalytics: false,
    hasAiFeatures: false,
    hasScheduling: false,
    hasLockedLinks: false,
    hasEmailExport: false,
    hasDrops: false,
    hasCustomStyle: false,
    removeBranding: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthly: 499,    // $4.99
    yearly: 2999,    // $29.99 (~$2.50/mo)
    features: [
      "Everything in Free",
      "Countdown / drop cards",
      "Vault cards (email gating)",
      "Globe analytics",
      "Cinematic hero style",
      "Full analytics dashboard",
      "Email list export",
      "Remove Paytree branding",
    ],
    limits: UNLIMITED,
    canPublish: true,
    platformFeePercent: 0,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasAiFeatures: false,
    hasScheduling: true,
    hasLockedLinks: true,
    hasEmailExport: true,
    hasDrops: true,
    hasCustomStyle: true,
    removeBranding: true,
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    monthly: 1499,   // $14.99
    yearly: 9999,    // $99.99 (~$8.33/mo)
    features: [
      "Everything in Pro",
      "AI sales agent on your page",
      "Priority support",
      "Early access to new features",
    ],
    limits: UNLIMITED,
    canPublish: true,
    platformFeePercent: 0,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasAiFeatures: true,
    hasScheduling: true,
    hasLockedLinks: true,
    hasEmailExport: true,
    hasDrops: true,
    hasCustomStyle: true,
    removeBranding: true,
  },
}

// Backward-compat alias — existing imports of `starter` continue to work
// and now resolve to the Pro plan definition.
export const starter = PLANS.pro

/**
 * Stripe price ID mapping.
 * "pro" intentionally points at STRIPE_STARTER_* env vars — the Vercel
 * env-var names are kept stable to avoid breaking the live deployment.
 */
export function getStripePriceId(plan: PlanId, interval: BillingInterval): string | null {
  const envPlan = plan === "pro" ? "STARTER" : plan.toUpperCase()
  const key = `STRIPE_${envPlan}_${interval.toUpperCase()}_PRICE_ID`
  return process.env[key] || null
}

/**
 * Map legacy DB values to the current PlanId.
 * "starter" was the previous name for the paid base tier and is treated as Pro.
 */
function normalizePlanId(raw: string | null | undefined): PlanId {
  if (!raw || raw === "free") return "free"
  if (raw === "starter") return "pro"
  if (raw === "pro") return "pro"
  if (raw === "ultra") return "ultra"
  return "free"
}

/**
 * Resolve a user's effective plan from their subscription data.
 * Returns "free" if no active subscription.
 *
 * Comped plans (admin-granted, no Stripe subscription) ride the normal
 * status="active" path. The one extra rule: an EXPIRED comp resolves to
 * "free" even while the DB row still says "active" — lib/get-user.ts
 * reverts the row itself on the user's next authenticated read.
 * Callers that don't select the comped fields simply skip this check.
 */
export function resolveUserPlan(user: {
  subscriptionStatus?: string | null
  subscriptionPlan?: string | null
  trialEndsAt?: Date | null
  subscriptionEndsAt?: Date | null
  isComped?: boolean | null
  compedExpiresAt?: Date | null
}): PlanId {
  if (user.isComped && user.compedExpiresAt && new Date() > new Date(user.compedExpiresAt)) {
    return "free"
  }

  const status = user.subscriptionStatus
  if (!status || status === "free" || status === "canceled") {
    if (status === "canceled" && user.subscriptionEndsAt) {
      if (new Date() < new Date(user.subscriptionEndsAt)) {
        return normalizePlanId(user.subscriptionPlan) || "pro"
      }
    }
    return "free"
  }

  if (status === "trial") {
    if (user.trialEndsAt && new Date() > new Date(user.trialEndsAt)) {
      return "free"
    }
    return normalizePlanId(user.subscriptionPlan) || "pro"
  }

  if (status === "active" || status === "canceling") {
    return normalizePlanId(user.subscriptionPlan) || "pro"
  }

  return "free"
}

/**
 * Get the feature set for a user.
 */
export function getUserFeatures(user: {
  subscriptionStatus?: string | null
  subscriptionPlan?: string | null
  trialEndsAt?: Date | null
  subscriptionEndsAt?: Date | null
  isComped?: boolean | null
  compedExpiresAt?: Date | null
}): PlanDefinition {
  const planId = resolveUserPlan(user)
  return PLANS[planId]
}

/**
 * Check if a user's subscription is active (paid or trial).
 */
export function isSubscriptionActive(user: {
  subscriptionStatus?: string | null
  trialEndsAt?: Date | null
  subscriptionEndsAt?: Date | null
  isComped?: boolean | null
  compedExpiresAt?: Date | null
}): boolean {
  const plan = resolveUserPlan(user)
  return plan !== "free"
}

/**
 * Check if a limit is reached.
 * Returns true if the user has hit the limit (cannot add more).
 */
export function isLimitReached(
  currentCount: number,
  limitValue: number
): boolean {
  if (limitValue === -1) return false // unlimited
  return currentCount >= limitValue
}
