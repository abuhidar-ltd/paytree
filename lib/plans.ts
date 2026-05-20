/**
 * PayTree Plan Definitions & Feature Gating
 *
 * Plans:
 *  - free:    No subscription (default)
 *  - starter: $7/mo or $59/yr
 *  - ultra:   $19/mo or $159/yr
 *
 * Subscription intervals: "monthly" | "yearly"
 *
 * Env vars (set in .env):
 *  STRIPE_STARTER_MONTHLY_PRICE_ID
 *  STRIPE_STARTER_YEARLY_PRICE_ID
 *  STRIPE_ULTRA_MONTHLY_PRICE_ID
 *  STRIPE_ULTRA_YEARLY_PRICE_ID
 */

export type PlanId = "free" | "starter" | "ultra"
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
  hasAnalytics: boolean
  hasAdvancedAnalytics: boolean
  hasAiFeatures: boolean
  hasScheduling: boolean
  hasLockedLinks: boolean
  hasEmailExport: boolean
  hasDrops: boolean
  hasCustomStyle: boolean
  removeBranding: boolean
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    features: [
      "Unlimited links and blocks",
      "All block types (YouTube, Vault, Drop, etc.)",
      "Full customization",
      "Cinematic hero mode",
    ],
    limits: {
      links: -1,
      modules: -1,
      products: -1,
      vaultItems: -1,
      folders: -1,
    },
    canPublish: false,
    platformFeePercent: 0,
    hasAnalytics: false,
    hasAdvancedAnalytics: false,
    hasAiFeatures: false,
    hasScheduling: true,
    hasLockedLinks: true,
    hasEmailExport: false,
    hasDrops: true,
    hasCustomStyle: true,
    removeBranding: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    monthly: 700,    // $7
    yearly: 5900,    // $59 (~$4.92/mo)
    features: [
      "Everything in Free",
      "Publish your page",
      "Analytics dashboard",
      "Email audience export",
      "5% transaction fee on sales",
    ],
    limits: {
      links: -1,
      modules: -1,
      products: -1,
      vaultItems: -1,
      folders: -1,
    },
    canPublish: true,
    platformFeePercent: 5,
    hasAnalytics: true,
    hasAdvancedAnalytics: false,
    hasAiFeatures: false,
    hasScheduling: true,
    hasLockedLinks: true,
    hasEmailExport: true,
    hasDrops: true,
    hasCustomStyle: true,
    removeBranding: false,
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    monthly: 1900,   // $19
    yearly: 15900,   // $159 (~$13.25/mo)
    features: [
      "Everything in Starter",
      "0% transaction fees",
      "AI sales agent on your page",
      "Globe analytics + advanced insights",
      "Remove Paytree branding",
      "Priority support",
    ],
    limits: {
      links: -1,
      modules: -1,
      products: -1,
      vaultItems: -1,
      folders: -1,
    },
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

/**
 * Stripe price ID mapping
 * Set these in your .env file after creating prices in Stripe Dashboard
 */
export function getStripePriceId(plan: PlanId, interval: BillingInterval): string | null {
  const key = `STRIPE_${plan.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID`
  return process.env[key] || null
}

/**
 * Map legacy DB values (e.g. "pro") to current PlanId.
 */
function normalizePlanId(raw: string | null | undefined): PlanId {
  if (!raw || raw === "free") return "free"
  if (raw === "pro") return "ultra"
  if (raw === "ultra") return "ultra"
  if (raw === "starter") return "starter"
  return "free"
}

/**
 * Resolve a user's effective plan from their subscription data.
 * Returns "free" if no active subscription.
 */
export function resolveUserPlan(user: {
  subscriptionStatus?: string | null
  subscriptionPlan?: string | null
  trialEndsAt?: Date | null
  subscriptionEndsAt?: Date | null
}): PlanId {
  const status = user.subscriptionStatus
  if (!status || status === "free" || status === "canceled") {
    if (status === "canceled" && user.subscriptionEndsAt) {
      if (new Date() < new Date(user.subscriptionEndsAt)) {
        return normalizePlanId(user.subscriptionPlan) || "starter"
      }
    }
    return "free"
  }

  if (status === "trial") {
    if (user.trialEndsAt && new Date() > new Date(user.trialEndsAt)) {
      return "free"
    }
    return normalizePlanId(user.subscriptionPlan) || "starter"
  }

  if (status === "active" || status === "canceling") {
    return normalizePlanId(user.subscriptionPlan) || "starter"
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
}): boolean {
  const plan = resolveUserPlan(user as any)
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
