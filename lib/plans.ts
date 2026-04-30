/**
 * PayTree Plan Definitions & Feature Gating
 *
 * Plans:
 *  - free:    No subscription (default)
 *  - starter: $4.99/mo  or $39.99/yr
 *  - pro:     $29/mo    or $249/yr
 *
 * Subscription intervals: "monthly" | "yearly"
 *
 * Env vars (set in .env):
 *  STRIPE_STARTER_MONTHLY_PRICE_ID
 *  STRIPE_STARTER_YEARLY_PRICE_ID
 *  STRIPE_PRO_MONTHLY_PRICE_ID
 *  STRIPE_PRO_YEARLY_PRICE_ID
 */

export type PlanId = "free" | "starter" | "pro"
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
  hasAnalytics: boolean
  hasAdvancedAnalytics: boolean
  hasAiFeatures: boolean
  hasScheduling: boolean
  hasLockedLinks: boolean
  hasEmailExport: boolean
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    features: [
      "Up to 5 links",
      "Basic profile page",
      "3 modules",
    ],
    limits: {
      links: 5,
      modules: 3,
      products: 0,
      folders: 1,
      vaultItems: 0,
    },
    canPublish: false,
    hasAnalytics: false,
    hasAdvancedAnalytics: false,
    hasAiFeatures: false,
    hasScheduling: false,
    hasLockedLinks: false,
    hasEmailExport: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    monthly: 499,   // $4.99
    yearly: 3999,    // $39.99 ($3.33/mo)
    features: [
      "Publish your live terminal",
      "Unlimited links",
      "Unlimited modules",
      "Deep Portals (nested folders)",
      "Live Broadcast Mode",
      "Authority Stats counters",
      "Basic analytics (views, clicks, CTR)",
      "1 shop product",
      "Link scheduling",
      "Locked links (email capture)",
      "Audience email export",
    ],
    limits: {
      links: -1,
      modules: -1,
      products: 1,
      folders: -1,
      vaultItems: 5,
    },
    canPublish: true,
    hasAnalytics: true,
    hasAdvancedAnalytics: false,
    hasAiFeatures: false,
    hasScheduling: true,
    hasLockedLinks: true,
    hasEmailExport: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthly: 2900,   // $29
    yearly: 24900,    // $249 ($20.75/mo)
    features: [
      "Everything in Starter",
      "Unlimited shop products",
      "Unlimited vault items",
      "Advanced analytics + referrals",
      "AI Link Optimizer",
      "AI Bio Generator",
      "AI Insights Dashboard",
      "Email follow-ups",
      "Crypto Vault (tips in BTC/ETH/SOL)",
      "Custom Obsidian themes",
      "Priority support",
    ],
    limits: {
      links: -1,
      modules: -1,
      products: -1,
      folders: -1,
      vaultItems: -1,
    },
    canPublish: true,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasAiFeatures: true,
    hasScheduling: true,
    hasLockedLinks: true,
    hasEmailExport: true,
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
    // Check if canceled but still within grace period
    if (status === "canceled" && user.subscriptionEndsAt) {
      if (new Date() < new Date(user.subscriptionEndsAt)) {
        return (user.subscriptionPlan as PlanId) || "starter"
      }
    }
    return "free"
  }

  if (status === "trial") {
    if (user.trialEndsAt && new Date() > new Date(user.trialEndsAt)) {
      return "free"
    }
    return (user.subscriptionPlan as PlanId) || "starter"
  }

  if (status === "active" || status === "canceling") {
    return (user.subscriptionPlan as PlanId) || "starter"
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
