/**
 * Conversion event tracking — the single entry point for ALL product events.
 *
 * Every event name follows the verb_noun taxonomy and must be listed in
 * EventName below; TypeScript rejects anything off-taxonomy. Do not call
 * @vercel/analytics track() directly anywhere else in the codebase.
 *
 * Wraps @vercel/analytics `track()` and attaches the context that matters:
 * UTM params, referrer source, and whether we're in a known WebView.
 *
 * Client-side only. Server-side money events (complete_upgrade,
 * receive_payment, publish_page) fire from lib/analytics-server.ts.
 */

import { track as vercelTrack } from "@vercel/analytics"
import { detectInAppBrowser } from "./iab"

/**
 * The complete event taxonomy. verb_noun, lowercase, snake_case.
 * If you're adding an event, add it here first — the union is the registry.
 */
export type EventName =
  // Homepage / acquisition
  | "view_home"          // homepage viewed
  | "scroll_hero"        // scrolled past the hero
  | "click_cta"          // any signup CTA; { source: hero|header|sticky|section, variant? }
  | "click_signin"       // header sign-in link
  // Signup
  | "view_signup"
  | "start_signup"       // first focus of any signup field (fires once)
  | "submit_signup"
  | "create_account"     // Better Auth confirmed the account
  | "error_signup"       // { reason: network|<code>, ... }
  | "click_google_signup"
  | "complete_google_signup"
  | "error_google_signup"
  // Login
  | "view_login"
  | "start_login"        // first focus of any login field (fires once)
  | "submit_login"
  | "complete_login"
  | "error_login"        // { reason: invalid_credentials|<code>|network }
  | "click_google_login"
  | "complete_google_login"
  | "error_google_login"
  // Onboarding
  | "start_onboarding"
  | "complete_onboarding_step" // { step }
  | "skip_onboarding"
  | "complete_onboarding"
  // Dashboard / cards
  | "view_dashboard"
  | "first_dashboard"    // first dashboard visit ever (per browser)
  | "open_card_picker"
  | "add_card"           // { type }
  | "delete_card"
  | "reorder_cards"
  | "click_empty_suggestion"
  | "hit_plan_gate"      // { feature }
  // Design studio
  | "view_design"
  | "change_hero_style"
  | "change_accent"
  | "change_button_style"
  | "open_ai_bio"
  | "apply_ai_bio"
  // Analytics / payments pages
  | "view_analytics"
  | "view_payments"
  | "connect_stripe"     // { status }
  | "click_stripe_connect"
  | "export_email_list"
  // Pricing / upgrade
  | "view_pricing"
  | "select_plan"        // { plan }
  | "start_checkout"     // { plan }
  | "error_checkout"     // { plan, reason }
  | "view_upgrade"
  | "activate_upgrade"   // client detected the paid plan became active; NOT the money metric
  // Public profile
  | "view_profile"
  | "open_vault"
  | "submit_vault_email"
  | "unlock_vault"
  | "open_ai_agent"
  // Email verification — send/verify fire SERVER-SIDE: send from lib/email.ts
  // (signup hook AND resends), verify from Better Auth's
  // afterEmailVerification hook in lib/auth.ts. The gate events are CLIENT-
  // side: view/resend/complete fire from /verify-pending (and the dashboard
  // safety-net banner). complete_verification = the gate let the user
  // through; verify_email = the token click itself.
  | "send_verification_email"
  | "verify_email"
  | "view_verify_pending"
  | "click_resend_verification"
  | "complete_verification"
  // Money metrics — fired SERVER-SIDE (lib/analytics-server.ts); listed here
  // so the taxonomy has one registry.
  | "publish_page"
  | "complete_upgrade"   // { plan } — Stripe webhook, checkout.session.completed
  | "receive_payment"    // { amount } — Stripe Connect webhook

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const
type UtmKey = typeof UTM_KEYS[number]

// Paid-click identifiers. Each ad network stamps its click ID as a URL param
// on the landing URL; without capturing them we can never reconcile revenue
// to the ad click that produced it. Keep the parameter names verbatim — the
// networks look them up on their side to match server-side conversion events.
//   twclid    — X (Twitter) Ads
//   fbclid    — Meta (Facebook/Instagram) Ads
//   gclid     — Google Ads (web)
//   gbraid    — Google Ads iOS (SKAdNetwork, replaces gclid)
//   wbraid    — Google Ads iOS (web-to-app, replaces gclid)
//   msclkid   — Microsoft Advertising / Bing Ads
//   ttclid    — TikTok Ads
//   li_fat_id — LinkedIn Ads
//   rdt_cid   — Reddit Ads
const CLICK_ID_KEYS = [
  "twclid",
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "ttclid",
  "li_fat_id",
  "rdt_cid",
] as const
type ClickIdKey = typeof CLICK_ID_KEYS[number]

const STORAGE_KEY = "paytree_attribution"

type Attribution = Partial<Record<UtmKey, string>> &
  Partial<Record<ClickIdKey, string>> & {
    referrer?: string
    source_guess?: string
    landing_path?: string
    captured_at?: string
  }

/**
 * Map a document.referrer hostname to the ad network it belongs to. Social
 * apps proxy shared links through their own short domains (X uses t.co,
 * Meta uses l.facebook.com / l.instagram.com / lm.facebook.com) so raw
 * referrer strings in attribution reports read as noise instead of the
 * platform the click actually came from.
 */
function guessSource(referrer: string | undefined): string | undefined {
  if (!referrer) return undefined
  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return undefined
  }
  if (host === "t.co" || host.endsWith(".x.com") || host === "x.com" || host.endsWith(".twitter.com") || host === "twitter.com") return "x"
  if (host === "lm.facebook.com" || host === "l.facebook.com" || host === "m.facebook.com" || host === "facebook.com" || host.endsWith(".facebook.com")) return "facebook"
  if (host === "l.instagram.com" || host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram"
  if (host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "lnkd.in") return "linkedin"
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "youtube"
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok"
  if (host === "google.com" || host.endsWith(".google.com") || host === "google.co.uk") return "google"
  if (host === "bing.com" || host.endsWith(".bing.com")) return "bing"
  if (host === "reddit.com" || host.endsWith(".reddit.com")) return "reddit"
  return undefined
}

/**
 * Capture attribution on first landing. Call once from a top-level client component.
 * Persists for 30 days; further visits keep the original touch.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) {
      const parsed = JSON.parse(existing) as Attribution & { _exp?: number }
      if (parsed._exp && parsed._exp > Date.now()) return
    }

    const params = new URLSearchParams(window.location.search)
    const referrer = document.referrer || undefined
    const attribution: Attribution & { _exp: number } = {
      _exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
      referrer,
      source_guess: guessSource(referrer),
      landing_path: window.location.pathname,
      captured_at: new Date().toISOString(),
    }

    for (const key of UTM_KEYS) {
      const v = params.get(key)
      if (v) attribution[key] = v
    }
    for (const key of CLICK_ID_KEYS) {
      const v = params.get(key)
      if (v) attribution[key] = v
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
  } catch {
    // localStorage can be blocked in WebViews and private mode — fail silent.
  }
}

function readAttribution(): Attribution {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const { _exp, ...rest } = JSON.parse(raw) as Attribution & { _exp?: number }
    void _exp
    return rest
  } catch {
    return {}
  }
}

type AllowedValue = string | number | boolean | null
export type Props = Record<string, AllowedValue>

/**
 * Track a product event with UTM + WebView context auto-attached.
 *
 * Deferred to the next idle frame so it cannot block click responsiveness —
 * Clarity was reporting INP > 1s, and synchronous enrichment + track() on
 * every CTA was a measurable chunk of that. Fire-and-forget is correct here:
 * the user has already navigated away by the time the event posts.
 *
 * opts.urgent skips the idle deferral: use it for events fired immediately
 * before a hard navigation (create_account, complete_login) — a deferred
 * callback dies with the document and the event is silently lost, which is
 * exactly how the funnel's success events went missing in July 2026.
 */
export function track(name: EventName, props: Props = {}, opts: { urgent?: boolean } = {}): void {
  if (typeof window === "undefined") return

  // Internal-traffic exclusion: devices that ever visited /admin are branded
  // with pt_internal (components/analytics-loader.tsx) and never counted.
  try {
    if (window.localStorage.getItem("pt_internal") === "1") return
  } catch {
    // localStorage blocked — count the event.
  }

  const run = () => {
    const inApp = detectInAppBrowser()
    const attribution = readAttribution()

    const enriched: Props = {
      ...props,
      in_app_browser: inApp ?? "no",
      ...Object.fromEntries(
        Object.entries(attribution).filter(([, v]) => typeof v === "string") as [string, string][]
      ),
    }

    try {
      vercelTrack(name, enriched)
    } catch {
      // Analytics disabled / blocked — don't break the user flow.
    }
  }

  if (opts.urgent) {
    run()
    return
  }

  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
  if (typeof ric === "function") {
    ric(run, { timeout: 2000 })
  } else {
    setTimeout(run, 0)
  }
}
