"use client"

import { motion } from "framer-motion"
import { PricingCards } from "@/app/pricing/pricing-cards"

interface HomePricingSectionProps {
  isLoggedIn: boolean
}

export function HomePricingSection({ isLoggedIn }: HomePricingSectionProps) {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-[#888] text-xs font-mono px-3 py-1.5 rounded-full">
            Pricing
          </span>
        </motion.div>

        <motion.h2
          className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#f0f0f0] mb-4"
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 20 }}
        >
          Start free. Scale when ready.
        </motion.h2>

        <motion.p
          className="text-[#888] text-lg mb-12"
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.15, type: "spring", stiffness: 120, damping: 20 }}
        >
          Build, publish, and grow for free. Upgrade when you&apos;re ready to monetize.
        </motion.p>

        <PricingCards
          isLoggedIn={isLoggedIn}
          isActive={false}
          currentPlan="free"
        />
      </div>
    </section>
  )
}
