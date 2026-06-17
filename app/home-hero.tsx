"use client"

import { PhoneMockup } from "./home-phone-mockup"
import { trackEvent } from "@/lib/analytics"

interface HomeHeroProps {
  isLoggedIn: boolean
}

// All hero animations are CSS keyframes (declared in globals.css) — no
// framer-motion imports here. Hero is the first-paint chunk, and shipping
// framer-motion + motion.div wrappers for desktop-only floats was adding
// ~50KB of JS that mobile users (and TikTok WebView users) never needed.
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
              <span className="block text-[#f0f0f0]">Sell physical and digital products,</span>
              <span className="block text-[#f0f0f0]">services, and content from one page.</span>
              <span className="block font-mono text-[#00ff88] text-lg sm:text-xl lg:text-2xl mt-2">0% platform fees. AI agent that sells for you 24/7.</span>
            </h1>

            {/* Feature bullets — sit right under the headline */}
            <ul
              className="mt-6 space-y-2.5 max-w-md"
              style={{ animation: "slideUp 0.5s ease 0.18s both" }}
            >
              {[
                { icon: "🌍", text: "Globe analytics — see every fan, country & city" },
                { icon: "🔒", text: "Vault — gate any card behind email or payment" },
                { icon: "⏱️", text: "Countdown cards — limited-time drops that sell out" },
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
                  onClick={() => trackEvent("hero_cta_click", { variant: "dashboard" })}
                  className="flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-xl text-base shadow-[0_0_40px_rgba(0,255,136,0.35)] items-center justify-center"
                >
                  Go to dashboard →
                </a>
              ) : (
                <>
                  <a
                    href="/join"
                    onClick={() => trackEvent("hero_cta_click", { variant: "join" })}
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

          {/* Right column — Phone, hidden on mobile so users reach the comparison faster */}
          <div className="hidden lg:flex flex-[2] relative justify-center">
            <div
              className="max-w-[240px] mx-auto lg:max-w-none"
              style={{ animation: "heroPhoneFloat 4s ease-in-out infinite, heroPhoneIn 0.6s 0.3s ease both" }}
            >
              <PhoneMockup />
            </div>

            {/* Floating stat cards — desktop only, CSS animations */}
            <div
              className="absolute -top-4 -left-8 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 backdrop-blur-sm"
              style={{ animation: "fadeIn 0.5s 1.2s ease both, floatA 5s 1.2s ease-in-out infinite" }}
            >
              <span className="text-xs font-mono text-[#e0e0e0]">🌍 47 countries</span>
            </div>

            <div
              className="absolute -bottom-4 -right-4 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 backdrop-blur-sm"
              style={{ animation: "fadeIn 0.5s 1.5s ease both, floatB 6s 1.5s ease-in-out infinite" }}
            >
              <span className="text-xs font-mono text-[#e0e0e0]">💰 $2,840 this month</span>
            </div>

            <div
              className="absolute top-8 -right-12 bg-[#00ff88]/[0.06] border border-[#00ff88]/[0.15] rounded-xl px-3 py-2"
              style={{ animation: "slideInRight 0.5s 2s ease both" }}
            >
              <span className="text-xs font-mono text-[#00ff88]">🤖 AI just made a sale</span>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes heroPhoneIn {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes heroPhoneFloat {
          0%, 100% { transform: translateY(-6px); }
          50%      { transform: translateY(6px); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(8px); }
        }
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </section>
  )
}
