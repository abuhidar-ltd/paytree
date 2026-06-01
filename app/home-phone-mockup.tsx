"use client"

import { useEffect, useState } from "react"

interface PhoneMockupProps {
  variant?: "default" | "classic" | "cinematic"
  className?: string
}

export function PhoneMockup({ variant = "cinematic", className = "" }: PhoneMockupProps) {
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

  if (variant === "classic") {
    return <ClassicPhone className={className} />
  }

  return <CinematicPhone className={className} countdown={countdown} />
}

function ClassicPhone({ className }: { className: string }) {
  const links = ["Trading Masterclass →", "Free Signals Telegram →", "Morning Analysis →"]

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
      {/* Notch */}
      <div style={{ height: 24, background: "#080808", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 72, height: 5, borderRadius: 3, background: "#111" }} />
      </div>

      {/* Classic hero — plain dark, avatar + name centered */}
      <div style={{ paddingTop: 32, paddingBottom: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(0,255,136,0.1)",
          border: "2px solid rgba(0,255,136,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 700,
          color: "#00ff88",
          fontFamily: "monospace",
        }}>
          A
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>Alex Chen</div>
          <div style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 10, marginTop: 3 }}>@alexchen</div>
          <div style={{ color: "#555", fontSize: 10, marginTop: 6, maxWidth: 200, lineHeight: 1.4 }}>
            Trading educator & market analyst
          </div>
        </div>
      </div>

      {/* 3 link cards */}
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((title) => (
          <div
            key={title}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#e0e0e0", fontSize: 12, fontWeight: 500 }}>{title}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        ))}
      </div>

      {/* Social icons row */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
        {["X", "YT", "TG"].map((label) => (
          <div
            key={label}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#555",
              fontSize: 9,
              fontFamily: "monospace",
              fontWeight: 600,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Branding */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <span style={{ color: "#222", fontFamily: "monospace", fontSize: 8 }}>paytree.to</span>
      </div>
    </div>
  )
}

function CinematicPhone({ className, countdown }: { className: string; countdown: { value: number; label: string }[] }) {
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
      {/* Notch */}
      <div style={{ height: 24, background: "transparent", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", zIndex: 2 }}>
        <div style={{ width: 72, height: 5, borderRadius: 3, background: "rgba(0,0,0,0.5)" }} />
      </div>

      {/* Cinematic hero — warm gradient with name overlaid large */}
      <div style={{
        height: 240,
        position: "relative",
        background: "linear-gradient(180deg, rgba(180,100,40,0.6) 0%, rgba(120,60,20,0.3) 40%, #080808 100%)",
        marginTop: -24,
        paddingTop: 24,
      }}>
        <div style={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.02em" }}>Alex Chen</div>
          <div style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 11, marginTop: 2 }}>@alexchen</div>
        </div>
      </div>

      {/* Drop card */}
      <div style={{
        margin: "10px 12px 0",
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
