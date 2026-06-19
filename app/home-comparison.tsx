"use client"

import { motion } from "framer-motion"

type Cell = string | boolean

const ROWS: Array<{ feature: string; linktree: Cell; paytree: Cell; highlight?: boolean }> = [
  { feature: "Transaction fees on creator sales", linktree: "9%", paytree: "0%", highlight: true },
  { feature: "AI sales agent on your page", linktree: false, paytree: true },
  { feature: "Countdown drop cards", linktree: false, paytree: true },
  { feature: "Vault — gate any card by email/payment", linktree: false, paytree: true },
  { feature: "Globe analytics — country & city map", linktree: false, paytree: true },
  { feature: "Top tier monthly price", linktree: "$35", paytree: "$19", highlight: true },
]

function Mark({ value }: { value: Cell }) {
  if (typeof value === "string") {
    return <span className="font-mono text-sm sm:text-base">{value}</span>
  }
  if (value) {
    return (
      <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function HomeComparison() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-[#888] text-xs font-mono px-3 py-1.5 rounded-full">
            Head to head
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#f0f0f0] mb-3"
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 20 }}
        >
          Paytree <span className="text-[#00ff88]">vs</span> Linktree
        </motion.h2>

        <motion.p
          className="text-[#888] text-lg mb-8"
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.15, type: "spring", stiffness: 120, damping: 20 }}
        >
          Same idea. Better product. Half the price.
        </motion.p>

        {/* Vs table */}
        <motion.div
          className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden"
          initial={{ opacity: 1, y: 24 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 22 }}
        >
          {/* Reflection */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)" }}
          />

          {/* Header row */}
          <div className="grid grid-cols-[1fr_88px_88px] sm:grid-cols-[1fr_140px_140px] items-center gap-2 px-4 sm:px-6 py-4 border-b border-white/[0.06]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#444]">Feature</div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#444]" />
              <span className="text-xs sm:text-sm font-mono text-[#888]">Linktree</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.6)]" />
              <span className="text-xs sm:text-sm font-mono text-[#00ff88]">Paytree</span>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <motion.div
              key={i}
              className={`grid grid-cols-[1fr_88px_88px] sm:grid-cols-[1fr_140px_140px] items-center gap-2 px-4 sm:px-6 py-4 ${
                i < ROWS.length - 1 ? "border-b border-white/[0.04]" : ""
              } ${row.highlight ? "bg-[#00ff88]/[0.015]" : ""}`}
              initial={{ opacity: 1, y: 6 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 24 }}
            >
              <span className="text-sm text-[#d8d8d8]">{row.feature}</span>
              <div className="flex justify-center">
                <span className={typeof row.linktree === "string" ? "font-mono text-sm text-red-400/90 line-through" : ""}>
                  <Mark value={row.linktree} />
                </span>
              </div>
              <div className="flex justify-center">
                <span className={typeof row.paytree === "string" ? "font-mono text-sm text-[#00ff88]" : ""}>
                  <Mark value={row.paytree} />
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Savings callout */}
        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center"
          initial={{ opacity: 1, y: 12 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.3, type: "spring", stiffness: 160, damping: 22 }}
        >
          <span className="text-sm font-mono text-[#999]">Sell $10k →</span>
          <span className="text-sm font-mono text-red-400 line-through">Linktree keeps $900</span>
          <span className="text-sm font-mono text-[#666]">·</span>
          <span className="text-sm font-mono text-[#00ff88]">You keep all of it</span>
        </motion.div>
      </div>
    </section>
  )
}
