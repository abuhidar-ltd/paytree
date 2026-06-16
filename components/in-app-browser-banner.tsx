"use client"

import { useEffect, useState } from "react"
import {
  detectInAppBrowser,
  openInBrowserInstructions,
  sourceLabel,
  type InAppBrowserSource,
} from "@/lib/in-app-browser"
import { captureAttribution, trackEvent } from "@/lib/analytics"

const DISMISS_KEY = "paytree_iab_banner_dismissed"

export function InAppBrowserBanner() {
  const [source, setSource] = useState<InAppBrowserSource>(null)
  const [dismissed, setDismissed] = useState(true) // start hidden — only show after mount

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

    setSource(detected)
    setDismissed(alreadyDismissed)

    if (!alreadyDismissed) {
      trackEvent("in_app_browser_banner_shown", { source: detected })
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
      window.prompt("Copy this link", url)
    }
  }

  if (!source || dismissed) return null

  const label = sourceLabel(source)
  const instructions = openInBrowserInstructions(source)

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
        background: "linear-gradient(180deg, rgba(0,255,136,0.10) 0%, rgba(0,0,0,0.95) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "0.5px solid rgba(0,255,136,0.25)",
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
            You&apos;re viewing in {label}&apos;s browser
          </div>
          <div style={{ color: "#888", fontSize: 11, marginTop: 1, lineHeight: 1.3 }}>
            Sign-up may fail. {instructions}.
          </div>
        </div>

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
