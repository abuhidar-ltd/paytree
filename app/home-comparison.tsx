"use client"

import { motion } from "framer-motion"

type Cell = string | boolean

const ROWS: Array<{ feature: string; linktree: Cell; paytree: Cell; highlight?: boolean }> = [
  { feature: "Transaction fees on creator sales", linktree: "9%", paytree: "0%", highlight: true },
  { feature: "AI sales agent on your page", linktree: false, paytree: true },
  { feature: "Countdown drop cards", linktree: false, paytree: true },
  { feature: "Vault — gate any card by email/payment", linktree: false, paytree: true },
  { feature: "Globe analytics — country & city map", linktree: false, paytree: true },
  { feature: "Top tier monthly price", linktree: "$35", paytree: "$14.99", highlight: true },
]

function Mark({ value }: { value: Cell }) {
  if (typeof value === "string") {
    return <span className="font-mono text-sm sm:text-base">{value}</span>
  }
  if (value) {
    return (
      <svg className="w-6 h-6 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  return (
    <svg className="w-6 h-6 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function HomeComparison() {
  return (
    <section className="-mt-6 sm:-mt-4 pb-16 sm:pb-28 relative">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-16">
        {/* Badge — above the headline, true yellow (not amber/orange) to
            stand apart from the green brand accent used everywhere else. */}
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 bg-[#FAF11B]/[0.1] text-[#FAF11B] text-base sm:text-lg font-mono px-3 py-1.5 rounded-full">
            Why choose Paytree?
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#f0f0f0] mb-3"
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 20 }}
        >
          Paytree <span className="text-[#00ff88]">vs</span> Linktree
        </motion.h2>

        <motion.p
          className="text-white text-base sm:text-lg mb-8"
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.15, type: "spring", stiffness: 120, damping: 20 }}
        >
          Same idea. Better product. Half the price.
        </motion.p>

        {/* Rows — split by the same green accent line used in the hero and
            features section (10% thicker here), instead of a bordered table. */}
        <div>
          {/* Header row */}
          <div className="grid grid-cols-[1fr_70px_70px] sm:grid-cols-[1fr_140px_140px] items-center gap-2 py-3">
            <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-white">Feature</div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#666]" />
              <span className="text-sm sm:text-base font-mono text-white">Linktree</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.6)]" />
              <span className="text-sm sm:text-base font-mono text-[#00ff88]">Paytree</span>
            </div>
          </div>

          <div
            aria-hidden
            className="w-full"
            style={{ height: "1.1px", background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.6), transparent)" }}
          />

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div key={i}>
              <motion.div
                className={`grid grid-cols-[1fr_70px_70px] sm:grid-cols-[1fr_140px_140px] items-center gap-2 py-4 ${
                  row.highlight ? "bg-[#00ff88]/[0.02]" : ""
                }`}
                initial={{ opacity: 1, y: 6 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 24 }}
              >
                <span className="text-sm sm:text-base text-[#d8d8d8] leading-snug">{row.feature}</span>
                <div className="flex justify-center">
                  <span className={typeof row.linktree === "string" ? "font-mono text-base sm:text-lg text-red-400/90 line-through" : ""}>
                    <Mark value={row.linktree} />
                  </span>
                </div>
                <div className="flex justify-center">
                  <span className={typeof row.paytree === "string" ? "font-mono text-base sm:text-lg text-[#00ff88]" : ""}>
                    <Mark value={row.paytree} />
                  </span>
                </div>
              </motion.div>
              {i < ROWS.length - 1 && (
                <div
                  aria-hidden
                  className="w-full"
                  style={{ height: "1.1px", background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.6), transparent)" }}
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
