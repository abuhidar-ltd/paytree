"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export interface Drop {
  id: string
  title: string
  description?: string
  dropAt: string
  revealUrl?: string
  revealText?: string
  status: string
  limitedSpots?: number
  spotsLeft?: number
}

export function DropCard({ drop }: { drop: Drop }) {
  const target = new Date(drop.dropAt).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = Math.max(0, target - now)
  const isLive = remaining === 0
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((remaining / (1000 * 60)) % 60)
  const seconds = Math.floor((remaining / 1000) % 60)

  const statusLabel = isLive
    ? drop.revealUrl || drop.revealText
      ? "LIVE"
      : "ENDED"
    : "SCHEDULED"

  const soldOut = drop.spotsLeft !== undefined && drop.spotsLeft <= 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[rgba(0,255,136,0.03)] border border-[rgba(0,255,136,0.12)] p-5">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,255,136,0.3), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="flex items-center justify-between mb-3">
        <div className="text-[#00ff88]/60 text-xs font-mono uppercase tracking-widest">
          DROP · {statusLabel}
        </div>
        {drop.limitedSpots !== undefined && drop.spotsLeft !== undefined && (
          <div
            className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
              soldOut
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            {soldOut ? "Sold out" : `${drop.spotsLeft} spots left`}
          </div>
        )}
      </div>

      <div className="text-xl font-semibold text-white mb-1">{drop.title}</div>
      {drop.description && (
        <div className="text-sm text-[#888] mb-4">{drop.description}</div>
      )}

      {!isLive ? (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Days", value: days },
            { label: "Hours", value: hours },
            { label: "Min", value: minutes },
            { label: "Sec", value: seconds },
          ].map((unit) => (
            <div
              key={unit.label}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl py-3 text-center"
            >
              <motion.div
                key={unit.value}
                className="text-2xl font-mono font-semibold text-white tabular-nums"
                initial={{ scale: 1.08, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {unit.value.toString().padStart(2, "0")}
              </motion.div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mt-1">
                {unit.label}
              </div>
            </div>
          ))}
        </div>
      ) : soldOut ? (
        <div className="mt-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-[#888] font-mono text-center">
          This drop has sold out
        </div>
      ) : drop.revealUrl ? (
        <a
          href={drop.revealUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center justify-center w-full px-4 py-3 rounded-xl bg-[#00ff88] text-black font-mono font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Access now →
        </a>
      ) : drop.revealText ? (
        <div className="mt-2 px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/[0.06] text-sm text-[#e0e0e0] font-mono whitespace-pre-wrap">
          {drop.revealText}
        </div>
      ) : (
        <div className="mt-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-[#888] font-mono text-center">
          Drop ended
        </div>
      )}
    </div>
  )
}
