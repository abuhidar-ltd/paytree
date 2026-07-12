"use client"

import Link from "next/link"
import { PhoneMockup } from "./home-phone-mockup"
import { track } from "@/lib/analytics"

interface HomeHeroProps {
  isLoggedIn: boolean
}

// All hero animations are CSS keyframes (slideUp / fadeIn in globals.css, plus
// the local @keyframes below) — no framer-motion in the first-paint chunk.
export function HomeHero({ isLoggedIn }: HomeHeroProps) {
  return (
    <section className="min-h-[calc(100svh-64px)] flex items-start pt-24 sm:pt-28 lg:pt-32 pb-0 sm:pb-1 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 38%, rgba(0,255,136,0.06) 0%, transparent 62%)",
        }}
      />

      <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-10">

          {/* Left column — content */}
          <div className="flex-[3] w-full max-w-2xl">

            {/* Headline — centered neon-green hook with soft glow, white
                supporting line SMALLER than the headline (scale reinforces
                the hierarchy), then a centered CTA so it can never sit
                where X's in-app-browser chrome would cover it. */}
            <h1
              className="font-bold tracking-tight text-center"
              style={{ animation: "slideUp 0.5s ease 0.1s both" }}
            >
              <span
                className="block text-[30px] leading-[1.14] sm:text-[40px] lg:text-[46px] lg:leading-[1.1] text-[#00ff88]"
                style={{
                  textShadow:
                    "0 0 24px rgba(0,255,136,0.45), 0 0 52px rgba(0,255,136,0.22), 0 2px 8px rgba(0,0,0,0.35)",
                }}
              >
                One page to sell, share links &amp; get paid
              </span>
            </h1>

            <p
              className="mt-4 text-center text-lg leading-[1.4] sm:text-xl lg:text-2xl font-semibold tracking-tight text-white max-w-xl mx-auto"
              style={{ animation: "slideUp 0.5s ease 0.14s both" }}
            >
              0% platform fees
            </p>

            <p
              className="mt-2 text-center text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-[#00ff88]"
              style={{ animation: "slideUp 0.5s ease 0.17s both" }}
            >
              + <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#f59e0b]">AI Sales Agent</span> that works for you 24/7
            </p>

            {/* Green accent divider — centered with a symmetric fade so it sits
                cleanly under the centered heading block. */}
            <div
              aria-hidden
              className="mt-5 mx-auto h-px w-full max-w-[200px]"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.6), transparent)",
                animation: "fadeIn 0.5s ease 0.18s both",
              }}
            />

            {/* CTA — centered so it's dead-center of the viewport on mobile,
                never near the edges where an in-app browser draws its own
                chrome (X's bottom toolbar, TikTok's top bar, etc). */}
            <div
              className="mt-7 sm:mt-8 w-full max-w-sm mx-auto flex flex-col items-center"
              style={{ animation: "slideUp 0.5s ease 0.2s both" }}
            >
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => {
                    track("click_cta", { variant: "dashboard", source: "hero" })
                  }}
                  className="group flex w-full bg-[#00ff88] text-black font-mono font-bold px-5 py-3 sm:px-6 sm:py-4 rounded-2xl text-sm sm:text-base items-center justify-center transition-all duration-200 hover:shadow-[0_0_56px_rgba(0,255,136,0.5)] hover:brightness-110 active:scale-[0.98] shadow-[0_0_40px_rgba(0,255,136,0.35)] min-h-11 sm:min-h-14"
                >
                  Go to dashboard
                  <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              ) : (
                <>
                  {/*
                    Soft navigation via next/link is required here: TikTok's
                    in-app browser intercepts hard <a> navigations to auth
                    keywords (join, signup, register) and shows its safety
                    interstitial. Soft nav (History API) is invisible to it,
                    which is what makes linking straight to /register safe
                    for internal CTAs.
                  */}
                  <Link
                    href="/register"
                    data-testid="home-hero-cta"
                    onClick={() => {
                      track("click_cta", { variant: "register", source: "hero" })
                    }}
                    className="group flex w-full bg-[#00ff88] text-black font-mono font-bold px-5 py-3 sm:px-6 sm:py-4 rounded-2xl text-sm sm:text-base items-center justify-center gap-2 transition-all duration-200 hover:shadow-[0_0_56px_rgba(0,255,136,0.5)] hover:brightness-110 active:scale-[0.98] shadow-[0_0_40px_rgba(0,255,136,0.35)] min-h-11 sm:min-h-14"
                  >
                    Create your free business page
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </Link>
                  <p className="mt-2.5 text-sm font-mono text-[#00ff88] font-semibold text-center">
                    Free plan for everyone &middot; No credit card required
                  </p>
                </>
              )}
            </div>

          </div>

          {/* Right column — phone (desktop only, so mobile reaches the CTA faster) */}
          <div className="hidden lg:flex flex-[2] relative justify-center self-center">
            <div
              className="max-w-[240px] mx-auto lg:max-w-none"
              style={{ animation: "heroPhoneFloat 4s ease-in-out infinite, heroPhoneIn 0.6s 0.3s ease both" }}
            >
              <PhoneMockup />
            </div>

            {/* Floating stat cards — desktop only */}
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
