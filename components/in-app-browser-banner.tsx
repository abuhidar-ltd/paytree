"use client"

import { useEffect, useState } from "react"
import {
  buildChromeIntentUrl,
  detectInAppBrowser,
  detectPlatform,
  openInBrowserInstructions,
  sourceLabel,
  type InAppBrowserSource,
  type Platform,
} from "@/lib/in-app-browser"
import { captureAttribution, trackEvent } from "@/lib/analytics"

const DISMISS_KEY = "paytree_iab_banner_dismissed"

// Routes that REQUIRE the banner. On the landing page we still capture
// attribution (so we know they came from TikTok) but render the banner only
// on auth flows, where the cost of NOT showing it is total funnel death.
const REQUIRED_PATHS = ["/join", "/login", "/onboarding"]

function isAuthPath(path: string): boolean {
  return REQUIRED_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
}

export function InAppBrowserBanner() {
  const [source, setSource] = useState<InAppBrowserSource>(null)
  const [platform, setPlatform] = useState<Platform>("other")
  const [dismissed, setDismissed] = useState(true) // start hidden — only show after mount
  const [isRequiredPath, setIsRequiredPath] = useState(false)

  useEffect(() => {
    captureAttribution()

    const detected = detectInAppBrowser()
    if (!detected) return

    let alreadyDismissed = false
    try {
      alreadyDismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1"
    } catch {
      // sessionStorage can throw in some WebViews — assume not dismissed.
    }

    const path = window.location.pathname
    setSource(detected)
    setPlatform(detectPlatform())
    setDismissed(alreadyDismissed)
    setIsRequiredPath(isAuthPath(path))

    if (!alreadyDismissed && isAuthPath(path)) {
      trackEvent("in_app_browser_banner_shown", { source: detected, path })
    }
  }, [])

  function handleDismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // ignore
    }
    setDismissed(true)
    trackEvent("in_app_browser_banner_dismissed", { source: source ?? "unknown" })
  }

  async function handleCopy() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      await navigator.clipboard.writeText(url)
      trackEvent("in_app_browser_link_copied", { source: source ?? "unknown" })
    } catch {
      // Some WebViews block clipboard write — fall back to a manual selection prompt
      window.prompt("Long-press to copy this link, then open it in your browser:", url)
    }
  }

  function handleOpenAndroidChrome() {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const intent = buildChromeIntentUrl(url)
    if (!intent) return
    trackEvent("in_app_browser_chrome_intent_clicked", { source: source ?? "unknown" })
    window.location.href = intent
  }

  if (!source || dismissed || !isRequiredPath) return null

  const label = sourceLabel(source)
  const instructions = openInBrowserInstructions(source, platform)
  const showAndroidButton = platform === "android"

  return (
    <div
      role="dialog"
      aria-label="Open in browser recommendation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "linear-gradient(180deg, rgba(0,255,136,0.12) 0%, rgba(0,0,0,0.96) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "0.5px solid rgba(0,255,136,0.28)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        padding: "10px 14px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(0,255,136,0.12)",
            border: "0.5px solid rgba(0,255,136,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          ⚠️
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#f0f0f0", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
            Open in your real browser to sign up
          </div>
          <div style={{ color: "#888", fontSize: 11, marginTop: 1, lineHeight: 1.3 }}>
            {label}&apos;s browser blocks sign-up. {instructions}.
          </div>
        </div>

        {showAndroidButton ? (
          <button
            type="button"
            onClick={handleOpenAndroidChrome}
            style={{
              flexShrink: 0,
              background: "#00ff88",
              color: "#000",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              padding: "7px 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Open Chrome
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCopy}
            style={{
              flexShrink: 0,
              background: "#00ff88",
              color: "#000",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              padding: "7px 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Copy link
          </button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            background: "transparent",
            color: "#666",
            border: "none",
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
