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

            {/* Headline — rhetorical hook above, value-prop resolution below. */}
            <h1
              className="mt-5 sm:mt-8 font-bold tracking-tight"
              style={{ animation: "slideUp 0.5s ease 0.1s both" }}
            >
              <span className="block text-[34px] leading-[1.05] sm:text-5xl lg:text-6xl text-[#f0f0f0]">
                why give up 9% of your sales to platforms
              </span>
              <span className="block mt-3 sm:mt-4 text-xl sm:text-3xl lg:text-4xl font-semibold leading-snug">
                <span className="text-[#00ff88]">with paytree you sell, share all your links &amp; get paid from your professional page</span>{" "}
                <span className="text-white">with 0% platform fees</span>
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
                    Create your free page →
                  </Link>
                  <p className="mt-2.5 text-sm font-mono text-[#00ff88] font-semibold text-center">
                    No Credit Card Required
                  </p>
                </>
              )}
            </div>

            {/* Fee comparison — visual only, no dollar amounts */}
            <div
              className="mt-7 sm:mt-8 max-w-md"
              style={{ animation: "fadeIn 0.5s ease 0.32s both" }}
            >
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#555] mb-3">
                Platform fee on every sale
              </p>

              {/* Two stacked pill bars */}
              <div className="space-y-2.5">

                {/* Linktree — fee shown as a red bite out of the bar */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                    <span className="text-sm font-mono text-[#666]">Linktree</span>
                  </div>
                  <div className="relative h-6 rounded-lg overflow-hidden bg-white/[0.04] flex">
                    {/* The portion you keep */}
                    <div
                      className="h-full flex items-center"
                      style={{
                        width: "91%",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    />
                    {/* The platform's cut — glows red */}
                    <div
                      className="h-full flex items-center justify-center relative"
                      style={{
                        width: "9%",
                        background: "rgba(248,113,113,0.22)",
                        animation: "barGrow 0.9s cubic-bezier(0.22,1,0.36,1) 0.6s both",
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ boxShadow: "inset 0 0 8px rgba(248,113,113,0.3)" }}
                      />
                    </div>
                  </div>
                  <p className="text-xs font-mono text-red-400/70 mt-1">
                    platform takes a cut — every time
                  </p>
                </div>

                {/* Paytree — solid green, nothing taken */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"
                      style={{ boxShadow: "0 0 5px rgba(0,255,136,0.7)" }}
                    />
                    <span className="text-sm font-mono text-[#00ff88]">Paytree</span>
                  </div>
                  <div
                    className="relative h-6 rounded-lg overflow-hidden"
                    style={{
                      background: "rgba(0,255,136,0.12)",
                      boxShadow: "0 0 16px rgba(0,255,136,0.15)",
                      animation: "barGrow 1.1s cubic-bezier(0.22,1,0.36,1) 0.85s both",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ boxShadow: "inset 0 1px 0 rgba(0,255,136,0.2)" }}
                    />
                  </div>
                  <p className="text-xs font-mono text-[#00ff88]/70 mt-1">
                    zero fees — you keep everything
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
