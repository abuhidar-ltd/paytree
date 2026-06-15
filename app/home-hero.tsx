"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { PhoneMockup } from "./home-phone-mockup"

interface HomeHeroProps {
  isLoggedIn: boolean
}

export function HomeHero({ isLoggedIn }: HomeHeroProps) {
  return (
    <section className="min-h-[calc(100dvh-64px)] flex items-start pt-16 sm:pt-20 lg:pt-24 pb-16 relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(0,255,136,0.05) 0%, transparent 65%)",
        }}
      />

      <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* Left column — CSS animated, no JS dependency */}
          <div className="flex-[3] max-w-2xl">

            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 bg-[#00ff88]/[0.08] border border-[#00ff88]/[0.15] text-[#00ff88] text-xs font-mono px-3 py-1.5 rounded-full"
              style={{ animation: "fadeIn 0.4s ease 0.05s both" }}
            >
              ✦ The bio link built for selling
            </span>

            {/* Headline — visible immediately, CSS animation only */}
            <h1
              className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08]"
              style={{ animation: "slideUp 0.5s ease 0.1s both" }}
            >
              <span className="block text-[#f0f0f0]">One page for your</span>
              <span className="block text-[#f0f0f0]">entire business.</span>
              <span className="block font-mono text-[#00ff88] text-3xl sm:text-4xl lg:text-5xl">Keep 100% of your sales.</span>
            </h1>

            {/* Feature bullets — sit right under the headline */}
            <ul
              className="mt-6 space-y-2.5 max-w-md"
              style={{ animation: "slideUp 0.5s ease 0.18s both" }}
            >
              {[
                { icon: "🤖", text: "AI agent that sells for you 24/7" },
                { icon: "🔒", text: "Vault & countdown drop cards" },
                { icon: "💰", text: "Sell products, services & content with 0% fees" },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm sm:text-base text-[#d8d8d8]">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#00ff88]/[0.08] border border-[#00ff88]/[0.15] flex items-center justify-center text-sm"
                    aria-hidden="true"
                  >
                    {f.icon}
                  </span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>

            {/* CTA — visible immediately */}
            <div
              className="mt-8 w-full max-w-sm"
              style={{ animation: "slideUp 0.5s ease 0.26s both" }}
            >
              {isLoggedIn ? (
                <a
                  href="/dashboard"
                  className="flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-xl text-base shadow-[0_0_40px_rgba(0,255,136,0.35)] items-center justify-center"
                >
                  Go to dashboard →
                </a>
              ) : (
                <>
                  <a
                    href="/register"
                    className="flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-xl text-base shadow-[0_0_40px_rgba(0,255,136,0.35)] items-center justify-center gap-2"
                  >
                    Create your page for free →
                  </a>
                  <p className="mt-2.5 text-[11px] font-mono text-[#00ff88] font-semibold text-center">
                    Free — no credit card required
                  </p>
                </>
              )}
            </div>

            {/* Social proof */}
            <div
              className="mt-6 flex items-center gap-3"
              style={{ animation: "fadeIn 0.5s ease 0.4s both" }}
            >
              <div className="flex -space-x-2">
                {["#00ff88", "#ff6b6b", "#6b8aff", "#ffb86b", "#a855f7"].map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {["A", "M", "K", "R", "S"][i]}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[#888] font-mono">
                Creators saving $900+ /yr vs Linktree
              </span>
            </div>
          </div>

          {/* Right column — Phone, hidden on mobile so users reach the Linktree comparison faster */}
          <div className="hidden lg:flex flex-[2] relative justify-center">
            <div className="max-w-[240px] mx-auto lg:max-w-none">
              <motion.div
                initial={{ x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 20 }}
              >
                <motion.div
                  animate={{ y: [-6, 6, -6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PhoneMockup />
                </motion.div>
              </motion.div>
            </div>

            {/* Floating stat cards — desktop only */}
            <div className="hidden lg:block">
              <motion.div
                className="absolute -top-4 -left-8 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 backdrop-blur-sm"
                initial={{ y: 20 }}
                animate={{ opacity: 1, y: [0, -6, 0] }}
                transition={{ delay: 1.2, duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-xs font-mono text-[#e0e0e0]">🌍 47 countries</span>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -right-4 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 backdrop-blur-sm"
                initial={{ y: -20 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{ delay: 1.5, duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-xs font-mono text-[#e0e0e0]">💰 $2,840 this month</span>
              </motion.div>

              <motion.div
                className="absolute top-8 -right-12 bg-[#00ff88]/[0.06] border border-[#00ff88]/[0.15] rounded-xl px-3 py-2"
                initial={{ x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2, type: "spring", stiffness: 120, damping: 20 }}
              >
                <span className="text-xs font-mono text-[#00ff88]">🤖 AI just made a sale</span>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
