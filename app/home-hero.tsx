"use client"

import Link from "next/link"
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
              ✦ Linktree replacement · 0% fees
            </span>

            {/* Headline — punchy, benefit-led. Math angle (highest converting per
                MARKETING.md). Avoids product descriptors; promises an outcome. */}
            <h1
              className="mt-6 sm:mt-8 text-[40px] leading-[1.05] sm:text-5xl lg:text-6xl font-semibold tracking-tight"
              style={{ animation: "slideUp 0.5s ease 0.1s both" }}
            >
              <span className="block text-[#f0f0f0]">Sell physical and digital products, services and content from 1 page.</span>
              <span className="block text-[#00ff88] text-[28px] sm:text-[34px] lg:text-[40px] mt-2">0% platform fees and an AI that sells for you 24/7.</span>
            </h1>
            <p
              className="mt-3 text-base sm:text-lg lg:text-xl text-[#aaa] max-w-lg leading-snug"
              style={{ animation: "slideUp 0.5s ease 0.14s both" }}
            >
              0% fees. AI agent that closes deals 24/7. Drop countdowns that sell out.
              <span className="block mt-1 text-[#666] text-sm sm:text-base font-mono">
                Linktree takes 9%. We take 0%.
              </span>
            </p>

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
                <Link
                  href="/dashboard"
                  onClick={() => {
                    trackEvent("hero_cta_click", { variant: "dashboard" })
                    trackEvent("cta_clicked", { location: "hero", variant: "dashboard" })
                  }}
                  className="flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-xl text-base shadow-[0_0_40px_rgba(0,255,136,0.35)] items-center justify-center"
                >
                  Go to dashboard →
                </Link>
              ) : (
                <>
                  {/*
                    Soft navigation via next/link is required here: TikTok's
                    in-app browser intercepts hard <a> navigations to auth
                    keywords (join, signup, register) and shows its safety
                    interstitial. Soft nav (History API) is invisible to it.
                    We route through /start for the same reason — /join is
                    a recognized auth-keyword on TikTok's URL blocklist.
                  */}
                  <Link
                    href="/start"
                    onClick={() => {
                      trackEvent("hero_cta_click", { variant: "start" })
                      trackEvent("cta_clicked", { location: "hero", variant: "start" })
                    }}
                    className="flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-xl text-base shadow-[0_0_40px_rgba(0,255,136,0.35)] items-center justify-center gap-2"
                  >
                    Create your page for free →
                  </Link>
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
