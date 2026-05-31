"use client"

import { useEffect, useState } from "react"

interface PhoneMockupProps {
  variant?: "default" | "classic" | "cinematic"
  className?: string
}

export function PhoneMockup({ className = "" }: PhoneMockupProps) {
  const [time, setTime] = useState({ d: 2, h: 14, m: 37, s: 29 })

  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { d, h, m, s } = t
        s--
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) { h = 23; d-- }
        if (d < 0) { d = 0; h = 0; m = 0; s = 0 }
        return { d, h, m, s }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const countdown = [
    { value: time.d, label: "DAY" },
    { value: time.h, label: "HRS" },
    { value: time.m, label: "MIN" },
    { value: time.s, label: "SEC" },
  ]

  return (
    <div
      className={className}
      style={{
        width: 280,
        height: 560,
        borderRadius: 40,
        background: "#080808",
        border: "1.5px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        position: "relative",
      }}
    >
      {/* Notch bar */}
      <div style={{ height: 24, background: "#080808", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 72, height: 5, borderRadius: 3, background: "#111" }} />
      </div>

      {/* Cinematic hero */}
      <div style={{
        height: 180,
        position: "relative",
        background: "linear-gradient(180deg, rgba(160,80,20,0.45) 0%, rgba(100,50,10,0.25) 50%, #080808 100%)",
      }}>
        <div style={{
          position: "absolute",
          bottom: 12,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(0,255,136,0.12)",
            border: "1.5px solid rgba(0,255,136,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color: "#00ff88",
            fontFamily: "monospace",
          }}>
            A
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>Alex Chen</div>
            <div style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 10, marginTop: 2 }}>@alexchen</div>
          </div>
        </div>
      </div>

      {/* Drop card */}
      <div style={{
        margin: "8px 12px 0",
        background: "rgba(0,255,136,0.04)",
        border: "0.5px solid rgba(0,255,136,0.2)",
        borderRadius: 12,
        padding: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
          <PulsingDot />
          <span style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 8, fontWeight: 600, letterSpacing: "0.05em" }}>
            DROP · LIVE
          </span>
        </div>
        <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          Pro Signals Course
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {countdown.map((unit) => (
            <div key={unit.label} style={{
              flex: 1,
              background: "rgba(0,0,0,0.5)",
              borderRadius: 6,
              padding: "6px 0",
              textAlign: "center",
            }}>
              <div style={{
                color: "#00ff88",
                fontFamily: "monospace",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1,
              }}>
                {unit.value.toString().padStart(2, "0")}
              </div>
              <div style={{
                color: "#333",
                fontFamily: "monospace",
                fontSize: 6,
                marginTop: 3,
                letterSpacing: "0.05em",
              }}>
                {unit.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* YouTube card */}
      <div style={{
        margin: "8px 12px 0",
        height: 70,
        background: "#0d0d0d",
        border: "0.5px solid rgba(255,60,60,0.2)",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
      }}>
        {/* Thumbnail */}
        <div style={{
          width: 70,
          height: 70,
          flexShrink: 0,
          background: "linear-gradient(135deg, #1a0808, #0d0404)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at center, rgba(255,60,60,0.15) 0%, transparent 70%)",
          }} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ position: "relative", zIndex: 1 }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        {/* Content */}
        <div style={{ padding: 8, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
          <div style={{ color: "rgba(255,60,60,0.7)", fontFamily: "monospace", fontSize: 7, marginBottom: 4, letterSpacing: "0.03em" }}>
            NEW · 2H AGO
          </div>
          <div style={{ color: "#fff", fontSize: 10, fontWeight: 500, lineHeight: 1.3, marginBottom: 3 }}>
            Morning Market Analysis
          </div>
          <div style={{ color: "#555", fontFamily: "monospace", fontSize: 8 }}>
            436K views
          </div>
        </div>
      </div>

      {/* Vault card */}
      <div style={{
        margin: "8px 12px 0",
        background: "rgba(255,200,0,0.02)",
        border: "0.5px solid rgba(255,200,0,0.12)",
        borderRadius: 12,
        padding: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(255,200,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,180,0,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <div style={{ color: "#fff", fontSize: 11, fontWeight: 500 }}>Free Trading Toolkit</div>
          <div style={{ color: "rgba(255,180,0,0.6)", fontFamily: "monospace", fontSize: 9, marginTop: 1 }}>Unlock with email</div>
        </div>
      </div>

      {/* AI button */}
      <div style={{
        margin: "8px 12px 0",
        background: "rgba(0,255,136,0.05)",
        border: "0.5px solid rgba(0,255,136,0.18)",
        borderRadius: 12,
        padding: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <GlowOrb />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 11, fontWeight: 600 }}>Ask Alex&apos;s AI</div>
          <div style={{ color: "#444", fontSize: 9, marginTop: 1 }}>Find the right course</div>
        </div>
        <span style={{ color: "rgba(0,255,136,0.4)", fontSize: 14 }}>→</span>
      </div>
    </div>
  )
}

function PulsingDot() {
  return (
    <span style={{ position: "relative", width: 6, height: 6 }}>
      <span style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: "#00ff88",
        animation: "mockup-pulse 1.5s ease-in-out infinite",
      }} />
      <span style={{
        position: "absolute",
        inset: -2,
        borderRadius: "50%",
        background: "rgba(0,255,136,0.3)",
        animation: "mockup-pulse 1.5s ease-in-out infinite",
      }} />
      <style>{`@keyframes mockup-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </span>
  )
}

function GlowOrb() {
  return (
    <div style={{
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: "rgba(0,255,136,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      position: "relative",
    }}>
      <span style={{
        position: "absolute",
        inset: -3,
        borderRadius: "50%",
        background: "rgba(0,255,136,0.06)",
        animation: "mockup-glow 2s ease-in-out infinite",
      }} />
      <span style={{ color: "#00ff88", fontSize: 14, position: "relative", zIndex: 1 }}>✦</span>
      <style>{`@keyframes mockup-glow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.15); } }`}</style>
    </div>
  )
}

export default PhoneMockup
