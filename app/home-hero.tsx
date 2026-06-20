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
  // svh (static viewport height) so the hero does not resize when the mobile
  // URL bar shows/hides on scroll — dvh was a Clarity-confirmed CLS source.
  // Clamping to 720px keeps the social-proof row inside the first viewport
  // on tall devices.
  return (
    <section className="min-h-[min(calc(100svh-64px),720px)] flex items-start pt-24 sm:pt-28 lg:pt-32 pb-16 relative overflow-hidden">
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
              ✦ 0% fees · Linktree alternative
            </span>

            {/* Headline — two-part. White lead is the dominant headline (the
                product promise). Green payoff sits below as a supporting line
                at a smaller weight — eye lands on white first, gets reinforced
                by green. Subhead removed; the green line replaces it. */}
            <h1
              className="mt-5 sm:mt-8 font-bold tracking-tight"
              style={{ animation: "slideUp 0.5s ease 0.1s both" }}
            >
              <span className="block text-[34px] leading-[1.05] sm:text-5xl lg:text-6xl text-[#f0f0f0]">
                Sell your physical &amp; digital products, and content.
              </span>
              <span className="block mt-3 sm:mt-4 text-lg sm:text-2xl lg:text-3xl text-[#00ff88] font-semibold leading-snug">
                0% commission. AI that sells for you 24/7.
              </span>
            </h1>

            {/* CTA — visible above the fold on mobile. Lives at ~360px from top
                so the entire button + microcopy is inside the first viewport
                even on the smallest supported device (iPhone SE, 667px). */}
            <div
              className="mt-7 sm:mt-8 w-full max-w-sm"
              style={{ animation: "slideUp 0.5s ease 0.2s both" }}
            >
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => {
                    trackEvent("homepage_hero_cta_clicked", { variant: "dashboard" })
                  }}
                  className="flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-xl text-base shadow-[0_0_40px_rgba(0,255,136,0.35)] items-center justify-center"
                  style={{ minHeight: 56 }}
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
                      trackEvent("homepage_hero_cta_clicked", { variant: "start" })
                    }}
                    className="flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-xl text-base shadow-[0_0_40px_rgba(0,255,136,0.35)] items-center justify-center gap-2"
                    style={{ minHeight: 56 }}
                  >
                    Start free now →
                  </Link>
                  <p className="mt-2.5 text-[11px] font-mono text-[#00ff88] font-semibold text-center">
                    Free · No card · 0% forever
                  </p>
                </>
              )}
            </div>

            {/* Savings callout — proportional bar comparison. The Linktree bar
                is literally 9% wide (their fee), the Paytree bar is full width.
                The visual asymmetry sells harder than three lines of mono text.
                Bars use scaleX keyframe so they grow in after the headline. */}
            <div
              className="mt-7 sm:mt-8 max-w-md"
              style={{ animation: "fadeIn 0.5s ease 0.32s both" }}
            >
              {/* Header strip */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#666]">
                  Proof · on a $10k sale
                </span>
                <span className="text-[10px] font-mono text-[#00ff88] flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"
                    style={{ boxShadow: "0 0 6px rgba(0,255,136,0.8)" }}
                  />
                  Live math
                </span>
              </div>

              {/* Linktree row — thin red fee bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-mono text-[#888] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400/60" />
                    Linktree fee (9%)
                  </span>
                  <span className="text-sm sm:text-base font-mono font-bold tabular-nums text-red-400 line-through decoration-[1.5px]">
                    −$900
                  </span>
                </div>
                <div className="relative h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full origin-left"
                    style={{
                      width: "9%",
                      background: "linear-gradient(90deg, rgba(248,113,113,0.85), rgba(248,113,113,0.4))",
                      boxShadow: "0 0 10px rgba(248,113,113,0.4)",
                      animation: "barGrow 0.9s cubic-bezier(0.22,1,0.36,1) 0.6s both",
                    }}
                  />
                </div>
                <p className="text-[10px] font-mono text-[#555] mt-1.5">
                  lost to platform fees · every sale
                </p>
              </div>

              {/* Paytree row — full green keep bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-mono text-[#d8d8d8] flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full bg-[#00ff88]"
                      style={{ boxShadow: "0 0 6px rgba(0,255,136,0.6)" }}
                    />
                    You keep (100%)
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold tabular-nums text-[#00ff88]">
                    $10,000
                  </span>
                </div>
                <div className="relative h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full origin-left"
                    style={{
                      width: "100%",
                      background: "linear-gradient(90deg, #00ff88, rgba(0,255,136,0.7))",
                      boxShadow: "0 0 14px rgba(0,255,136,0.5)",
                      animation: "barGrow 1.1s cubic-bezier(0.22,1,0.36,1) 0.85s both",
                    }}
                  />
                </div>
                <p className="text-[10px] font-mono text-[#00ff88]/80 mt-1.5">
                  every dollar stays in your pocket
                </p>
              </div>

              {/* Conclusion banner — the punch line */}
              <div
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#00ff88]/[0.05] border border-[#00ff88]/[0.18]"
                style={{
                  animation: "fadeIn 0.5s ease 1.4s both",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00ff88]/[0.12] border border-[#00ff88]/[0.3] flex items-center justify-center"
                  style={{ boxShadow: "0 0 12px rgba(0,255,136,0.25)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-[#e8e8e8] leading-tight">
                    <span className="text-[#00ff88] font-bold font-mono">+$900</span> more in your pocket
                  </p>
                  <p className="text-[10px] font-mono text-[#666] mt-0.5">
                    per every $10k sold · forever
                  </p>
                </div>
              </div>
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
        @keyframes barGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </section>
  )
}
