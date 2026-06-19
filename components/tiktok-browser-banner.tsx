"use client"

import { useEffect, useState } from "react"
import { detectInAppBrowser, openInBrowserInstructions, detectPlatform } from "@/lib/in-app-browser"

export function TikTokBrowserBanner() {
  const [show, setShow] = useState(false)
  const [instructions, setInstructions] = useState("")

  useEffect(() => {
    const source = detectInAppBrowser()
    if (source !== "tiktok") return
    const dismissed = sessionStorage.getItem("tiktok_banner_dismissed")
    if (dismissed) return
    const platform = detectPlatform()
    setInstructions(openInBrowserInstructions(source, platform))
    setShow(true)
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 9999,
      background: "#0a0a0a",
      border: "0.5px solid rgba(0,255,136,0.3)",
      borderTop: "none",
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      boxShadow: "0 4px 24px rgba(0,0,0,0.6)"
    }}>
      <div>
        <div style={{
          color: "#00ff88",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "monospace"
        }}>
          Open in Safari for best experience
        </div>
        <div style={{
          color: "#888",
          fontSize: 11,
          marginTop: 2
        }}>
          {instructions || 'Tap ⋯ at the top right → "Open in browser"'}
        </div>
      </div>
      <button
        onClick={() => {
          sessionStorage.setItem("tiktok_banner_dismissed", "1")
          setShow(false)
        }}
        style={{
          background: "rgba(0,255,136,0.1)",
          border: "0.5px solid rgba(0,255,136,0.3)",
          borderRadius: 8,
          color: "#00ff88",
          fontSize: 12,
          padding: "6px 12px",
          cursor: "pointer",
          fontFamily: "monospace",
          whiteSpace: "nowrap"
        }}
      >
        Got it
      </button>
    </div>
  )
}
