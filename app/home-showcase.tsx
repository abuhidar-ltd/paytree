"use client"

import { motion } from "framer-motion"
import { PhoneMockup } from "./home-phone-mockup"

export function HomeShowcase() {
  return (
    <section className="py-16 sm:py-32 bg-white/[0.01] border-y border-white/[0.05]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-16">
        {/* Headline */}
        <motion.div
          className="text-center mb-10 sm:mb-16"
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#f0f0f0] mb-3 sm:mb-4">
            Your page. Your identity.
          </h2>
          <p className="text-[#888] text-base sm:text-lg max-w-xl mx-auto">
            <span className="hidden sm:inline">Classic or Cinematic — your page </span>
            <span className="sm:hidden">Your page </span>
            always looks like a million dollars.
          </p>
        </motion.div>

        {/* Mobile shows only Cinematic (Classic + "vs" hidden) — stacking two
            phones on a 375px screen made the section absurdly tall without
            adding signal. Desktop keeps the side-by-side comparison. */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16">
          {/* Classic — desktop only */}
          <motion.div
            className="hidden sm:flex flex-col items-center gap-4"
            initial={{ opacity: 1, x: -60 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <PhoneMockup variant="classic" />
            </motion.div>
            <span className="text-xs font-mono text-[#777]">Classic</span>
          </motion.div>

          {/* vs — desktop only */}
          <motion.span
            className="text-[#666] font-mono text-sm hidden sm:block"
            initial={false}
            whileInView={{ }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            vs
          </motion.span>

          {/* Cinematic — always shown */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 1, x: 60 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <PhoneMockup variant="cinematic" />
            </motion.div>
            <span className="text-xs font-mono text-[#777]">Cinematic</span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
