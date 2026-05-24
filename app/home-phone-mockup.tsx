"use client"

import { useEffect, useState } from "react"

interface PhoneMockupProps {
  variant?: "default" | "classic" | "cinematic"
  className?: string
}

export function PhoneMockup({ variant = "default", className = "" }: PhoneMockupProps) {
  const [seconds, setSeconds] = useState(47)

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 59)), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`w-[220px] h-[440px] rounded-[2.5rem] border border-white/[0.12] bg-[#0a0a0a] overflow-hidden relative shadow-[0_0_60px_rgba(0,0,0,0.8)] ${className}`}>
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[22px] bg-black rounded-b-2xl z-10" />

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-2 text-[8px] text-white/50 font-mono relative z-10">
        <span>9:41</span>
        <span className="flex gap-0.5">
          <span className="w-3 h-1.5 rounded-sm bg-white/30" />
          <span className="w-1 h-1.5 rounded-sm bg-white/30" />
        </span>
      </div>

      {variant === "default" && <DefaultContent seconds={seconds} />}
      {variant === "classic" && <ClassicContent />}
      {variant === "cinematic" && <CinematicContent />}
    </div>
  )
}

function DefaultContent({ seconds }: { seconds: number }) {
  return (
    <div className="px-3 pt-5 h-full flex flex-col gap-2">
      {/* Cinematic hero area */}
      <div className="relative h-[100px] rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/60 via-amber-800/30 to-[#0a0a0a]" />
        <div className="absolute bottom-2 left-3">
          <p className="text-white text-[11px] font-semibold">Alex Chen</p>
          <p className="text-white/50 text-[8px]">Trading &amp; Finance Creator</p>
        </div>
      </div>

      {/* Drop countdown card */}
      <div className="bg-[#00ff88]/[0.08] border border-[#00ff88]/[0.2] rounded-xl px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] text-[#00ff88] font-mono uppercase tracking-wider">Drop Live</p>
            <p className="text-[10px] text-white font-semibold">Pro Signals Course</p>
          </div>
          <div className="text-[11px] font-mono text-[#00ff88] font-bold tabular-nums">
            02:14:{seconds.toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* YouTube card */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2 flex items-center gap-2">
        <div className="w-8 h-6 rounded bg-red-500/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div>
          <p className="text-[9px] text-white font-medium">Morning Market Analysis</p>
          <p className="text-[7px] text-white/40">YouTube · 12K views</p>
        </div>
      </div>

      {/* Vault card */}
      <div className="bg-amber-500/[0.05] border border-amber-500/[0.15] rounded-xl px-3 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <span className="text-[10px]">🔒</span>
        </div>
        <div>
          <p className="text-[9px] text-white font-medium">VIP Trading Signals</p>
          <p className="text-[7px] text-white/40">Unlock with email</p>
        </div>
      </div>

      {/* AI agent bubble */}
      <div className="mt-auto mb-4 mx-auto">
        <div className="bg-[#00ff88]/[0.1] border border-[#00ff88]/[0.2] rounded-full px-3 py-1.5 flex items-center gap-1.5 animate-pulse">
          <span className="text-[9px]">🤖</span>
          <span className="text-[8px] text-[#00ff88] font-mono">Ask AI</span>
        </div>
      </div>
    </div>
  )
}

function ClassicContent() {
  return (
    <div className="px-4 pt-8 h-full flex flex-col items-center gap-3">
      {/* Circular avatar */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00ff88]/30 to-[#00ff88]/5 border border-[#00ff88]/20 flex items-center justify-center">
        <span className="text-lg font-bold text-[#00ff88]">A</span>
      </div>
      <div className="text-center">
        <p className="text-white text-[11px] font-semibold">Alex Chen</p>
        <p className="text-white/40 text-[8px]">@alexchen</p>
      </div>

      {/* Link cards */}
      <div className="w-full space-y-2 mt-2">
        {["Pro Signals Course", "Free Trading Guide", "Join Discord"].map((title, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-center">
            <p className="text-[9px] text-white font-medium">{title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CinematicContent() {
  return (
    <div className="h-full relative">
      {/* Full-bleed hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-800/50 via-amber-900/30 to-[#0a0a0a]" />

      {/* Name overlaid large */}
      <div className="absolute top-[120px] left-0 right-0 px-4 text-center">
        <p className="text-white text-[16px] font-bold tracking-tight">Alex Chen</p>
        <p className="text-white/50 text-[9px] mt-0.5">Trading &amp; Finance Creator</p>
      </div>

      {/* Cards below */}
      <div className="absolute bottom-6 left-3 right-3 space-y-2">
        {["Pro Signals Course", "Free Trading Guide"].map((title, i) => (
          <div key={i} className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl px-3 py-2.5 text-center">
            <p className="text-[9px] text-white font-medium">{title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
