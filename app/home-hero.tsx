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
    <section className="min-h-[min(calc(100svh-64px),720px)] flex items-start pt-16 sm:pt-20 lg:pt-24 pb-16 relative overflow-hidden">
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

            {/* Headline — attack-mode. Direct math angle (MARKETING.md angle #1).
                Two-line break on mobile keeps "Linktree 9%" on its own line for
                maximum visual impact and scannability in a TikTok WebView. */}
            <h1
              className="mt-5 sm:mt-8 text-[34px] leading-[1.05] sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f0f0f0]"
              style={{ animation: "slideUp 0.5s ease 0.1s both" }}
            >
              Stop giving{" "}
              <span className="text-[#00ff88]">Linktree 9%</span>{" "}
              of your money.
            </h1>

            <p
              className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-[#aaa] max-w-lg leading-snug"
              style={{ animation: "slideUp 0.5s ease 0.14s both" }}
            >
              Same bio link. Half the price.
              <span className="block mt-1 text-[#d8d8d8]">
                AI agent that closes sales 24/7.
              </span>
            </p>

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
                    Take your money back →
                  </Link>
                  <p className="mt-2.5 text-[11px] font-mono text-[#00ff88] font-semibold text-center">
                    Free · No card · 0% forever
                  </p>
                </>
              )}
            </div>

            {/* Savings callout — three-line math proof. Sits below the CTA so
                it does not push the button off the first viewport on mobile.
                Mono-spaced numbers + strikethrough on the Linktree line make
                the comparison instantly scannable. */}
            <div
              className="mt-7 sm:mt-8 border-t border-white/[0.06] pt-5 max-w-md"
              style={{ animation: "fadeIn 0.5s ease 0.32s both" }}
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-2">
                Sell $10k →
              </div>
              <div className="flex items-baseline justify-between text-sm font-mono">
                <span className="text-[#888]">Linktree keeps</span>
                <span className="text-red-400 line-through">$900</span>
              </div>
              <div className="flex items-baseline justify-between text-sm font-mono mt-1.5">
                <span className="text-[#d8d8d8]">You keep</span>
                <span className="text-[#00ff88] font-bold">$10,000</span>
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
      `}</style>
    </section>
  )
}
