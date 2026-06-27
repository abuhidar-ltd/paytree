"use client"

import { useEffect } from "react"
import { captureAttribution, trackEvent } from "@/lib/analytics"

// Module-level guard so a rerender or React strict-mode double-invoke cannot
// fire homepage_view twice within a single page load.
let fired = false

/**
 * Fires `homepage_view` once when the marketing homepage loads.
 * Render-only — no UI, no layout impact.
 */
export function HomePageView() {
  useEffect(() => {
    if (fired) return
    fired = true
    // Persist first-touch UTM/referrer before the (deferred) event reads it,
    // so the whole funnel is attributable from the very first homepage view.
    captureAttribution()
    trackEvent("homepage_view")
  }, [])
  return null
}
