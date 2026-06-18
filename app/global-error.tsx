"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app/global-error] caught:", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#030303",
          color: "#f0f0f0",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              margin: "0 auto 24px",
              borderRadius: 12,
              background: "rgba(255,85,85,0.08)",
              border: "1px solid rgba(255,85,85,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            ⚠
          </div>
          <div
            style={{
              color: "#ff5555",
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Fatal error
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              margin: "0 0 12px",
            }}
          >
            Paytree couldn&apos;t load.
          </h1>
          <p style={{ color: "#888", fontSize: 14, lineHeight: 1.5, margin: "0 0 24px" }}>
            Refresh and try again.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#444",
                fontFamily: "monospace",
                fontSize: 10,
                margin: "0 0 16px",
              }}
            >
              ref · {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#00ff88",
              color: "#000",
              border: "none",
              borderRadius: 12,
              padding: "12px 20px",
              fontFamily: "monospace",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
