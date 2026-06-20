/**
 * Conversion event tracking.
 *
 * Wraps @vercel/analytics `track()` and attaches the context that matters:
 * UTM params, referrer source, and whether we're in a known WebView.
 * Without this, page views are all we'd ever see.
 *
 * Client-side only.
 */

import { track } from "@vercel/analytics"
import { detectInAppBrowser } from "./in-app-browser"

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const
type UtmKey = typeof UTM_KEYS[number]

const STORAGE_KEY = "paytree_attribution"

type Attribution = Partial<Record<UtmKey, string>> & {
  referrer?: string
  landing_path?: string
  captured_at?: string
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
    const attribution: Attribution & { _exp: number } = {
      _exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
      referrer: document.referrer || undefined,
      landing_path: window.location.pathname,
      captured_at: new Date().toISOString(),
    }

    for (const key of UTM_KEYS) {
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
type Props = Record<string, AllowedValue>

/**
 * Track a conversion event with UTM + WebView context auto-attached.
 *
 * Event names use snake_case. Vercel Analytics dedupes by name, so be specific:
 * `hero_cta_click` not `cta_click`.
 *
 * Deferred to the next idle frame so it cannot block click responsiveness —
 * Clarity was reporting INP > 1s, and synchronous enrichment + track() on
 * every CTA was a measurable chunk of that. Fire-and-forget is correct here:
 * the user has already navigated away by the time the event posts.
 */
export function trackEvent(name: string, props: Props = {}): void {
  if (typeof window === "undefined") return

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
      track(name, enriched)
    } catch {
      // Analytics disabled / blocked — don't break the user flow.
    }
  }

  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
  if (typeof ric === "function") {
    ric(run, { timeout: 2000 })
  } else {
    setTimeout(run, 0)
  }
}
