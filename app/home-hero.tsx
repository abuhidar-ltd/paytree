"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { PhoneMockup } from "./home-phone-mockup"

interface HomeHeroProps {
  isLoggedIn: boolean
}

export function HomeHero({ isLoggedIn }: HomeHeroProps) {
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        opacity: 0.1 + Math.random() * 0.3,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 4,
      })),
    []
  )

  const claimHref = isLoggedIn
    ? "/dashboard"
    : username
    ? `/register?username=${username}`
    : "/register"

  return (
    <section className="min-h-[calc(100vh-64px)] flex items-start pt-16 sm:pt-20 lg:pt-24 pb-16 relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(0,255,136,0.05) 0%, transparent 65%)",
        }}
      />

      {/* Particles */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-px h-px rounded-full bg-white"
              style={{
                top: p.top,
                left: p.left,
                opacity: p.opacity,
                animation: `twinkle ${p.duration}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left column */}
          <div className="flex-[3] max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
            >
              <span className="inline-flex items-center gap-2 bg-[#00ff88]/[0.08] border border-[#00ff88]/[0.15] text-[#00ff88] text-xs font-mono px-3 py-1.5 rounded-full">
                ✦ The bio link built for selling
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="mt-8 text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08]">
              <motion.span
                className="block text-[#f0f0f0]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 25 }}
              >
                One link to
              </motion.span>
              <motion.span
                className="block text-[#f0f0f0]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 25 }}
              >
                everything you sell.
              </motion.span>
              <motion.span
                className="block font-mono text-[#00ff88]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, type: "spring", stiffness: 200, damping: 25 }}
              >
                0% commission.
              </motion.span>
            </h1>

            {/* Subheadline */}
            <motion.p
              className="mt-6 text-base sm:text-lg text-[#555] max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 120, damping: 20 }}
            >
              Linktree takes 9% of every sale you make.{" "}
              <span className="text-[#888]">We take 0%. Keep every dollar, forever.</span>
            </motion.p>

            {/* Username claim input */}
            <motion.div
              className="mt-8 w-full max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68, type: "spring", stiffness: 120, damping: 20 }}
            >
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="flex w-full bg-[#00ff88] text-black font-mono font-semibold px-6 py-3.5 rounded-xl text-sm hover:scale-[1.02] hover:brightness-105 transition-all shadow-[0_0_30px_rgba(0,255,136,0.3)] items-center justify-center min-h-[52px]"
                >
                  Go to dashboard →
                </Link>
              ) : (
                <div
                  className="flex items-center gap-0 rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "0.5px solid rgba(255,255,255,0.12)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 0 rgba(0,255,136,0)",
                  }}
                >
                  <span className="pl-4 pr-1 text-[#444] font-mono text-sm whitespace-nowrap flex-shrink-0">
                    paytree.to/
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    placeholder="yourname"
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#00ff88] font-mono text-sm py-3.5 placeholder:text-[#333]"
                  />
                  <Link
                    href={claimHref}
                    className="flex-shrink-0 bg-[#00ff88] text-black font-mono font-semibold px-4 py-3.5 text-sm hover:brightness-110 transition-all min-h-[52px] flex items-center"
                  >
                    Claim →
                  </Link>
                </div>
              )}
              <p className="mt-2.5 text-[11px] text-[#333] font-mono">
                Free forever — no credit card required
              </p>
            </motion.div>

            {/* Social proof */}
            <motion.div
              className="mt-7 flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
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
              <span className="text-xs text-[#444] font-mono">
                Creators saving $900+ /yr vs Linktree
              </span>
            </motion.div>
          </div>

          {/* Right column — Phone */}
          <div className="flex-[2] relative flex justify-center">
            <div className="max-w-[240px] mx-auto lg:max-w-none">
              <motion.div
                initial={{ opacity: 0, x: 80 }}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: [0, -6, 0] }}
                transition={{ delay: 1.2, duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-xs font-mono text-[#e0e0e0]">🌍 47 countries</span>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -right-4 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 backdrop-blur-sm"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{ delay: 1.5, duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-xs font-mono text-[#e0e0e0]">💰 $2,840 this month</span>
              </motion.div>

              <motion.div
                className="absolute top-8 -right-12 bg-[#00ff88]/[0.06] border border-[#00ff88]/[0.15] rounded-xl px-3 py-2"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2, type: "spring", stiffness: 120, damping: 20 }}
              >
                <span className="text-xs font-mono text-[#00ff88]">🤖 AI just made a sale</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for particle twinkle */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  )
}
