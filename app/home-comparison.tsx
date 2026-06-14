"use client"

import { motion } from "framer-motion"

const LINKTREE_ITEMS = [
  "9% transaction fees on creator sales",
  "No AI sales agent",
  "No drop countdown cards",
  "No vault / email gate on any block",
  "No crypto payment support",
  "$35/mo for equivalent feature tier",
]

const PAYTREE_ITEMS = [
  "0% fees on all paid plans — keep every dollar",
  "AI sales agent — answers questions, closes sales",
  "Drop countdown cards built in (Starter+)",
  "Vault: gate any card behind email or payment (Starter+)",
  "Native crypto payment support",
  "$19/mo Ultra vs $35/mo for the equivalent tier",
]

export function HomeComparison() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-[#888] text-xs font-mono px-3 py-1.5 rounded-full">
            Why creators switch
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
          Everything Linktree can&apos;t do.
        </motion.h2>

        <motion.p
          className="text-[#888] text-lg mb-6"
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.15, type: "spring", stiffness: 120, damping: 20 }}
        >
          We built everything they said wasn&apos;t possible.
        </motion.p>

        {/* Fee math callout */}
        <motion.div
          className="mb-12 inline-flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3"
          initial={{ opacity: 1, y: 12 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.22, type: "spring", stiffness: 160, damping: 22 }}
        >
          <span className="text-sm font-mono text-[#999]">Selling $10k?</span>
          <span className="text-sm font-mono text-red-400 line-through">Linktree takes $900</span>
          <span className="text-sm font-mono text-[#666]">·</span>
          <span className="text-sm font-mono text-[#00ff88]">Paytree takes $0</span>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Linktree */}
          <motion.div
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8"
            initial={{ opacity: 1, x: -50 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-[#444]" />
              <span className="text-sm font-mono text-[#888]">Linktree</span>
            </div>
            <ul className="space-y-3">
              {LINKTREE_ITEMS.map((item, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 1, y: 8 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 24 }}
                >
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm text-[#999]">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Paytree */}
          <motion.div
            className="bg-[#00ff88]/[0.03] border border-[#00ff88]/[0.2] rounded-2xl p-6 sm:p-8"
            initial={{ opacity: 1, x: 50 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88]" />
              <span className="text-sm font-mono text-[#00ff88]">Paytree</span>
              <span className="ml-2 text-[10px] font-mono bg-[#00ff88]/[0.1] border border-[#00ff88]/[0.2] text-[#00ff88] px-2 py-0.5 rounded-full">
                ✦ Better
              </span>
            </div>
            <ul className="space-y-3">
              {PAYTREE_ITEMS.map((item, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 1, y: 8 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 24 }}
                >
                  <svg className="w-4 h-4 text-[#00ff88] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-[#ccc]">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
