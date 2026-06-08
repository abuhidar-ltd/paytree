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

// Glass card with the top reflection line — matches the real Paytree card recipe
function GlassCard({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        position: "relative",
        background: "rgba(255,255,255,0.03)",
        border: `0.5px solid ${accent || "rgba(255,255,255,0.08)"}`,
        borderRadius: 16,
        padding: "12px 14px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 12,
        right: 12,
        height: 1,
        pointerEvents: "none",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
      }} />
      {children}
    </div>
  )
}

function ClassicPhone({ className }: { className: string }) {
  return (
    <div
      className={className}
      style={{
        width: 280,
        height: 560,
        borderRadius: 40,
        background: "#030303",
        border: "1.5px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        position: "relative",
      }}
    >
      {/* Notch */}
      <div style={{ height: 24, background: "#030303", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 72, height: 5, borderRadius: 3, background: "#111" }} />
      </div>

      {/* Classic hero — circular avatar with green glow ring */}
      <div style={{ paddingTop: 28, paddingBottom: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00ff88 0%, #0a0a0a 100%)",
          border: "2px solid rgba(0,255,136,0.3)",
          boxShadow: "0 0 0 4px rgba(0,255,136,0.06), inset 0 1px 0 rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 800,
          color: "#000",
          fontFamily: "Inter, sans-serif",
        }}>
          A
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#f0f0f0", fontWeight: 700, fontSize: 16, lineHeight: 1.2, fontFamily: "Inter, sans-serif" }}>Alex Chen</div>
          <div style={{ color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 10, marginTop: 4 }}>@alexchen</div>
        </div>
      </div>

      {/* 3 glass cards — link, vault, drop */}
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Card 1 — link with chain icon */}
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d8d8d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span style={{ flex: 1, color: "#d8d8d8", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>Watch My Masterclass</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </div>
        </GlassCard>

        {/* Card 2 — vault with amber lock */}
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(245,158,11,0.08)",
              border: "0.5px solid rgba(245,158,11,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#d8d8d8", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>Free Trading Toolkit</div>
              <div style={{ color: "rgba(245,158,11,0.7)", fontFamily: "'Space Mono', monospace", fontSize: 9, marginTop: 1 }}>Unlock with email</div>
            </div>
          </div>
        </GlassCard>

        {/* Card 3 — drop with green pulse + countdown text */}
        <GlassCard accent="rgba(0,255,136,0.25)">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PulsingDot />
            <span style={{ flex: 1, color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>
              DROP · 2D 14H
            </span>
          </div>
          <div style={{ color: "#f0f0f0", fontSize: 12, fontWeight: 600, marginTop: 4, fontFamily: "Inter, sans-serif" }}>
            Pro Signals Launch
          </div>
        </GlassCard>
      </div>

      {/* Social icons row */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 18 }}>
        {["X", "YT", "TG"].map((label) => (
          <div
            key={label}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
              fontSize: 9,
              fontFamily: "'Space Mono', monospace",
              fontWeight: 600,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Branding */}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <span style={{ color: "#222", fontFamily: "'Space Mono', monospace", fontSize: 8 }}>paytree.to</span>
      </div>
    </div>
  )
}

const CINEMATIC_HERO_IMAGE = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"

function CinematicPhone({ className, countdown }: { className: string; countdown: { value: number; label: string }[] }) {
  return (
    <div
      className={className}
      style={{
        width: 280,
        height: 560,
        borderRadius: 40,
        background: "#030303",
        border: "1.5px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        position: "relative",
      }}
    >
      {/* Notch (sits over the hero image) */}
      <div style={{ height: 24, background: "transparent", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", zIndex: 3 }}>
        <div style={{ width: 72, height: 5, borderRadius: 3, background: "rgba(0,0,0,0.5)" }} />
      </div>

      {/* Cinematic hero — full-bleed trading image + warm gradient overlay */}
      <div style={{
        height: 220,
        position: "relative",
        marginTop: -24,
        overflow: "hidden",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CINEMATIC_HERO_IMAGE}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 35%",
            zIndex: 1,
          }}
        />
        {/* Warm gradient + fade to dark */}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: [
            "linear-gradient(180deg, rgba(180,100,40,0.35) 0%, rgba(20,10,5,0.1) 30%, rgba(3,3,3,0.6) 70%, #030303 100%)",
            "linear-gradient(to right, rgba(3,3,3,0.3) 0%, transparent 20%, transparent 80%, rgba(3,3,3,0.3) 100%)",
          ].join(", "),
        }} />
        {/* Creator name overlaid at bottom */}
        <div style={{
          position: "absolute",
          bottom: 14,
          left: 0,
          right: 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}>
          <div style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: 26,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontFamily: "Inter, sans-serif",
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}>
            Alex Chen
          </div>
          <div style={{
            color: "#00ff88",
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            marginTop: 2,
            textShadow: "0 1px 8px rgba(0,0,0,0.7)",
          }}>
            @alexchen
          </div>
        </div>
      </div>

      {/* Card 1 — Pro Signals Course (link with chain icon) */}
      <div style={{ margin: "10px 12px 0" }}>
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d8d8d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span style={{ flex: 1, color: "#d8d8d8", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>Pro Signals Course</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </div>
        </GlassCard>
      </div>

      {/* Card 2 — VIP Trading Group (vault with amber lock) */}
      <div style={{ margin: "8px 12px 0" }}>
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(245,158,11,0.08)",
              border: "0.5px solid rgba(245,158,11,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#d8d8d8", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>VIP Trading Group</div>
              <div style={{ color: "rgba(245,158,11,0.7)", fontFamily: "'Space Mono', monospace", fontSize: 9, marginTop: 1 }}>Paid · $49/mo</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Drop card with countdown */}
      <div style={{ margin: "8px 12px 0" }}>
        <GlassCard accent="rgba(0,255,136,0.25)">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <PulsingDot />
            <span style={{ color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>
              DROP · LIVE
            </span>
          </div>
          <div style={{ color: "#f0f0f0", fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>
            Launch in
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {countdown.map((unit) => (
              <div key={unit.label} style={{
                flex: 1,
                background: "rgba(0,0,0,0.4)",
                border: "0.5px solid rgba(0,255,136,0.12)",
                borderRadius: 6,
                padding: "4px 0",
                textAlign: "center",
              }}>
                <div style={{ color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>
                  {unit.value.toString().padStart(2, "0")}
                </div>
                <div style={{ color: "#444", fontFamily: "'Space Mono', monospace", fontSize: 6, marginTop: 2, letterSpacing: "0.05em" }}>
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
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

export default PhoneMockup
