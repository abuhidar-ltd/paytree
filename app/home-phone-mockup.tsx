"use client"

import { useEffect, useState } from "react"

interface PhoneMockupProps {
  variant?: "default" | "classic" | "cinematic"
  className?: string
}

export function PhoneMockup({ variant = "cinematic", className = "" }: PhoneMockupProps) {
  const [time, setTime] = useState({ h: 14, m: 37, s: 29 })

  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t
        s--
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) { h = 0; m = 0; s = 0 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  if (variant === "classic") {
    return <CinematicPhone className={className} time={time} />
  }

  return <CinematicPhone className={className} time={time} />
}

function GlassCard({ children, accent, noPad }: { children: React.ReactNode; accent?: string; noPad?: boolean }) {
  return (
    <div style={{
      position: "relative",
      background: "rgba(255,255,255,0.03)",
      border: `0.5px solid ${accent || "rgba(255,255,255,0.08)"}`,
      borderRadius: 14,
      padding: noPad ? 0 : "10px 12px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 10, right: 10, height: 1, pointerEvents: "none",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent)",
      }} />
      {children}
    </div>
  )
}

function PulsingDot({ color = "#00ff88" }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 6, height: 6, flexShrink: 0 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%", background: color,
        animation: "mpulse 1.5s ease-in-out infinite",
      }} />
      <span style={{
        position: "absolute", inset: -2, borderRadius: "50%", background: `${color}44`,
        animation: "mpulse 1.5s ease-in-out infinite",
      }} />
      <style>{`@keyframes mpulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </span>
  )
}

const PERSON_PHOTO = "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80"

const AI_STEPS = [
  { type: "user", text: "How much is the course?" },
  { type: "ai",   text: "Pro Signals is $49 — includes 6 modules + lifetime updates." },
  { type: "user", text: "Is it worth it?" },
  { type: "ai",   text: "3,000+ students. Avg 40% ROI in week one. 🚀" },
  { type: "sale", text: "✓ Sale closed · $49" },
]

function CinematicPhone({ className, time }: { className: string; time: { h: number; m: number; s: number } }) {
  const [chatStep, setChatStep] = useState(-1)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    // Delays between steps: 1.5s, 1.5s, 2s, 1.2s, 1.5s, then hold 3s, reset
    const delays = [1500, 1500, 2000, 1200, 1500, 3000]
    let step = -1
    let cancelled = false

    function advance() {
      if (cancelled) return
      step++
      if (step >= AI_STEPS.length) {
        // reset after hold
        setTimeout(() => {
          if (!cancelled) {
            step = -1
            setChatStep(-1)
            setTyping(false)
            setTimeout(advance, 800)
          }
        }, delays[delays.length - 1])
        return
      }
      const isAi = AI_STEPS[step].type === "ai"
      if (isAi) {
        setTyping(true)
        setTimeout(() => {
          if (!cancelled) {
            setTyping(false)
            setChatStep(step)
            setTimeout(advance, delays[step])
          }
        }, 900)
      } else {
        setChatStep(step)
        setTimeout(advance, delays[step])
      }
    }

    const init = setTimeout(advance, 1000)
    return () => {
      cancelled = true
      clearTimeout(init)
    }
  }, [])

  const pad = (n: number) => n.toString().padStart(2, "0")
  const visibleMessages = AI_STEPS.slice(0, chatStep + 1)

  return (
    <div
      className={className}
      style={{
        width: 280,
        height: 580,
        borderRadius: 42,
        background: "#030303",
        border: "1.5px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Dynamic island */}
      <div style={{ height: 28, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, position: "relative", zIndex: 4 }}>
        <div style={{ width: 90, height: 22, borderRadius: 14, background: "#000", border: "0.5px solid rgba(255,255,255,0.08)" }} />
      </div>

      {/* Hero image — person photo */}
      <div style={{ height: 215, position: "relative", marginTop: -28, flexShrink: 0, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PERSON_PHOTO}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 8%", zIndex: 1 }}
        />
        {/* Cinematic overlay — light at top so face is clear, fades to black at bottom */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2,
          background: "linear-gradient(180deg, rgba(3,3,3,0.08) 0%, rgba(3,3,3,0.0) 35%, rgba(3,3,3,0.55) 80%, #030303 100%)",
        }} />
        {/* Name + handle */}
        <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, zIndex: 3, textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", fontFamily: "Inter, sans-serif", textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>
            Ava Morgan
          </div>
          <div style={{ color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 10, marginTop: 2 }}>
            @avamorgan
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: "8px 10px 0", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {/* Product — paid course */}
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(0,255,136,0.04) 100%)",
              border: "0.5px solid rgba(0,255,136,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#e0e0e0", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Pro Signals Course</div>
              <div style={{ color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 9, marginTop: 1 }}>$49 · One-time</div>
            </div>
            <div style={{ background: "#00ff88", color: "#000", fontSize: 9, fontWeight: 700, fontFamily: "'Space Mono', monospace", borderRadius: 6, padding: "3px 7px", flexShrink: 0 }}>BUY</div>
          </div>
        </GlassCard>

        {/* Drop — countdown */}
        <GlassCard accent="rgba(0,255,136,0.2)">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <PulsingDot />
            <span style={{ color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 8, fontWeight: 700, letterSpacing: "0.08em" }}>DROP · LIVE IN</span>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "stretch" }}>
            {[{ v: time.h, l: "HRS" }, { v: time.m, l: "MIN" }, { v: time.s, l: "SEC" }].map((u) => (
              <div key={u.l} style={{ flex: 1, background: "rgba(0,0,0,0.5)", border: "0.5px solid rgba(0,255,136,0.12)", borderRadius: 5, padding: "3px 0", textAlign: "center" }}>
                <div style={{ color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{pad(u.v)}</div>
                <div style={{ color: "#333", fontFamily: "'Space Mono', monospace", fontSize: 6, marginTop: 1, letterSpacing: "0.04em" }}>{u.l}</div>
              </div>
            ))}
          </div>
          <div style={{ color: "#ccc", fontSize: 10, fontWeight: 500, marginTop: 5, fontFamily: "Inter, sans-serif" }}>VIP Group Launch · $99/mo</div>
        </GlassCard>

        {/* Vault — email gate */}
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: "rgba(245,158,11,0.08)", border: "0.5px solid rgba(245,158,11,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#d8d8d8", fontSize: 11, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>Free Trading PDF</div>
              <div style={{ color: "rgba(245,158,11,0.7)", fontFamily: "'Space Mono', monospace", fontSize: 8, marginTop: 1 }}>🔒 Unlock with email</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* AI Chat section */}
      <div style={{ flex: 1, margin: "8px 10px 10px", minHeight: 0 }}>
        <div style={{
          height: "100%",
          background: "rgba(0,255,136,0.02)",
          border: "0.5px solid rgba(0,255,136,0.12)",
          borderRadius: 14,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 10px 6px",
            borderBottom: "0.5px solid rgba(0,255,136,0.08)",
            background: "rgba(0,255,136,0.03)",
            flexShrink: 0,
          }}>
            <PulsingDot />
            <span style={{ color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 8, fontWeight: 700, letterSpacing: "0.06em" }}>
              AI AGENT · ONLINE
            </span>
            <span style={{ marginLeft: "auto", color: "#333", fontFamily: "'Space Mono', monospace", fontSize: 7 }}>24/7</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: "8px 8px 6px", display: "flex", flexDirection: "column", gap: 5, justifyContent: "flex-end", overflow: "hidden" }}>
            {visibleMessages.map((msg, i) => {
              if (msg.type === "sale") {
                return (
                  <div key={i} style={{ textAlign: "center", animation: "fadeUp 0.35s ease forwards" }}>
                    <span style={{
                      display: "inline-block",
                      background: "rgba(0,255,136,0.12)", border: "0.5px solid rgba(0,255,136,0.3)",
                      color: "#00ff88", fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700,
                      borderRadius: 20, padding: "4px 10px",
                      animation: "salePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
                    }}>
                      {msg.text}
                    </span>
                  </div>
                )
              }
              const isUser = msg.type === "user"
              return (
                <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", animation: "fadeUp 0.3s ease forwards" }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "5px 9px",
                    borderRadius: isUser ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                    background: isUser ? "rgba(255,255,255,0.06)" : "rgba(0,255,136,0.07)",
                    border: `0.5px solid ${isUser ? "rgba(255,255,255,0.08)" : "rgba(0,255,136,0.15)"}`,
                    fontSize: 9,
                    fontFamily: "Inter, sans-serif",
                    color: isUser ? "#aaa" : "#d0d0d0",
                    lineHeight: 1.4,
                  }}>
                    {msg.text}
                  </div>
                </div>
              )
            })}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start", animation: "fadeUp 0.3s ease forwards" }}>
                <div style={{
                  padding: "6px 10px", borderRadius: "10px 10px 10px 2px",
                  background: "rgba(0,255,136,0.06)", border: "0.5px solid rgba(0,255,136,0.12)",
                }}>
                  <div style={{ display: "flex", gap: 3, alignItems: "center", height: 10 }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{
                        width: 4, height: 4, borderRadius: "50%", background: "#00ff88",
                        display: "inline-block",
                        animation: `typingDot 1.1s ease-in-out ${i * 0.18}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes salePop { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        @keyframes typingDot { 0%,60%,100% { opacity: 0.25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
      `}</style>
    </div>
  )
}

export default PhoneMockup
