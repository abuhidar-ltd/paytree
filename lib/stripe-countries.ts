/**
 * Stripe Connect (Express) supported payout countries.
 *
 * Why this exists: `stripe.accounts.create()` without a `country` defaults the
 * connected account to the PLATFORM's country (Paytree is a US LLC), which
 * silently blocks any non-US creator from attaching a real bank account. We
 * force the creator to pick their country up front — but Stripe only supports
 * Express payouts in a fixed set of countries, so we offer that set here and
 * treat Stripe's own API error as the final backstop for anything stale.
 *
 * ⚠️ MENA reality: of the whole region, only the UAE (AE) is reliably supported
 * for Stripe Connect payouts today. Creators in Jordan, Egypt, Saudi, etc.
 * cannot onboard payouts through Stripe — a separate payout rail is a
 * product decision, tracked outside this fix.
 *
 * This list is intentionally conservative (long-standing supported countries).
 * If Stripe adds more, add them here; the graceful `country_unsupported`
 * handling in the connect route covers the gap until then.
 */
export interface StripeCountry {
  code: string // ISO 3166-1 alpha-2, uppercase
  name: string
  flag: string
}

export const STRIPE_COUNTRIES: StripeCountry[] = [
  // Primary English-speaking markets
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  // MENA (Stripe-supported)
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  // Europe (EEA + CH)
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  // Asia-Pacific
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  // Latin America
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
]

const SUPPORTED = new Set(STRIPE_COUNTRIES.map((c) => c.code))

/** True if `code` (any case) is a Stripe Connect payout country we support. */
export function isStripeSupportedCountry(code: string | null | undefined): boolean {
  if (!code) return false
  return SUPPORTED.has(code.toUpperCase())
}

/** Human-readable name for a country code, or the raw code if unknown. */
export function stripeCountryName(code: string | null | undefined): string {
  if (!code) return ""
  return STRIPE_COUNTRIES.find((c) => c.code === code.toUpperCase())?.name ?? code
}
