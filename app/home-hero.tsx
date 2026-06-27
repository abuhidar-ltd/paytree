"use client"

import Link from "next/link"
import { Sparkles, Bot, Lock, Timer, Globe, Percent, type LucideIcon } from "lucide-react"
import { PhoneMockup } from "./home-phone-mockup"
import { trackEvent } from "@/lib/analytics"

interface HomeHeroProps {
  isLoggedIn: boolean
}

// Full feature set, rendered as a clean 2-column icon grid. Icons are
// lucide-react outline glyphs inside green glass squares.
const FEATURES: { Icon: LucideIcon; label: string; wide?: boolean }[] = [
  {
    Icon: Sparkles,
    label: "Sell products, services and content, share your links, & get paid instantly",
    wide: true,
  },
  { Icon: Bot, label: "24/7 AI Sales Agent" },
  { Icon: Lock, label: "Vault — lock premium content" },
  { Icon: Timer, label: "Countdown Card" },
  { Icon: Globe, label: "Globe Analytics" },
]

// All hero animations are CSS keyframes (slideUp / fadeIn in globals.css, plus
// the local @keyframes below) — no framer-motion in the first-paint chunk.
export function HomeHero({ isLoggedIn }: HomeHeroProps) {
  return (
    <section className="min-h-[calc(100svh-64px)] flex items-start pt-24 sm:pt-28 lg:pt-32 pb-16 relative overflow-hidden">
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

            {/* Top-right badge. In normal flow (right-aligned) on mobile/tablet
                so it can never overlap the headline; pinned to the section's
                top-right corner from lg up, where the space is empty. */}
            <div
              className="flex justify-end mb-5 lg:mb-0 lg:absolute lg:top-28 lg:right-16 lg:z-20"
              style={{ animation: "fadeIn 0.5s ease 0.05s both" }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full pl-2.5 pr-3 py-1.5"
                style={{
                  background: "rgba(0,255,136,0.10)",
                  border: "0.5px solid rgba(0,255,136,0.35)",
                  boxShadow: "inset 0 1px 0 rgba(0,255,136,0.18), 0 0 24px rgba(0,255,136,0.18)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="grid place-items-center w-5 h-5 rounded-full"
                  style={{ background: "rgba(0,255,136,0.18)" }}
                >
                  <Percent size={12} strokeWidth={2.5} className="text-[#00ff88]" />
                </span>
                <span className="font-mono tracking-tight leading-none">
                  <span className="text-sm sm:text-base font-extrabold text-[#00ff88]">0%</span>{" "}
                  <span className="text-xs sm:text-[13px] font-semibold text-white">platform commission</span>
                </span>
              </span>
            </div>

            {/* Headline — centered neon-green hook with soft glow, white
                resolution line beneath. */}
            <h1
              className="font-bold tracking-tight text-center"
              style={{ animation: "slideUp 0.5s ease 0.1s both" }}
            >
              <span
                className="block text-[40px] leading-[1.04] sm:text-5xl lg:text-[64px] lg:leading-[1.02] text-[#00ff88]"
                style={{
                  textShadow:
                    "0 0 24px rgba(0,255,136,0.45), 0 0 52px rgba(0,255,136,0.22), 0 2px 8px rgba(0,0,0,0.35)",
                }}
              >
                Your entire business
              </span>
              <span className="block mt-2.5 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-semibold text-white/95">
                in one place
              </span>
            </h1>

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

            {/* Feature grid — 1 col on mobile, 2 cols from sm up. */}
            <ul
              className="mt-6 sm:mt-7 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-xl"
              style={{ animation: "slideUp 0.5s ease 0.15s both" }}
            >
              {FEATURES.map(({ Icon, label, wide }) => (
                <li
                  key={label}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    wide ? "sm:col-span-2" : ""
                  }`}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "0.5px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      background: "rgba(0,255,136,0.06)",
                      border: "0.5px solid rgba(0,255,136,0.25)",
                      boxShadow: "inset 0 1px 0 rgba(0,255,136,0.15), 0 0 14px rgba(0,255,136,0.12)",
                    }}
                  >
                    <Icon size={18} strokeWidth={2.25} className="text-[#00ff88]" />
                  </span>
                  <span className="text-sm sm:text-[15px] leading-snug font-medium text-white/90">
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div
              className="mt-7 sm:mt-8 w-full max-w-sm"
              style={{ animation: "slideUp 0.5s ease 0.2s both" }}
            >
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => {
                    trackEvent("homepage_cta_clicked", { variant: "dashboard", location: "hero" })
                  }}
                  className="group flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-2xl text-base items-center justify-center transition-all duration-200 hover:shadow-[0_0_56px_rgba(0,255,136,0.5)] hover:brightness-110 active:scale-[0.98] shadow-[0_0_40px_rgba(0,255,136,0.35)]"
                  style={{ minHeight: 56 }}
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
                    interstitial. Soft nav (History API) is invisible to it.
                    We route through /start for the same reason — /join is
                    a recognized auth-keyword on TikTok's URL blocklist.
                  */}
                  <Link
                    href="/start"
                    onClick={() => {
                      trackEvent("homepage_cta_clicked", { variant: "start", location: "hero" })
                    }}
                    className="group flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-2xl text-base items-center justify-center gap-2 transition-all duration-200 hover:shadow-[0_0_56px_rgba(0,255,136,0.5)] hover:brightness-110 active:scale-[0.98] shadow-[0_0_40px_rgba(0,255,136,0.35)]"
                    style={{ minHeight: 56 }}
                  >
                    Create your free page
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </Link>
                  <p className="mt-2.5 text-sm font-mono text-[#00ff88] font-semibold text-center">
                    No Credit Card Required
                  </p>
                </>
              )}
            </div>

            {/* Fee comparison — elevated glass card, visual only (no $ amounts). */}
            <div
              className="mt-8 max-w-md relative overflow-hidden rounded-2xl p-4 sm:p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                animation: "fadeIn 0.5s ease 0.32s both",
              }}
            >
              {/* Reflection line */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 top-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)" }}
              />

              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#666] mb-4">
                Platform fee on every sale
              </p>

              <div className="space-y-4">
                {/* Linktree — red bite out of the bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                      <span className="text-sm font-mono text-[#888]">Linktree</span>
                    </div>
                    <span className="text-[11px] font-mono text-red-400/80">their cut</span>
                  </div>
                  <div className="relative h-7 rounded-lg overflow-hidden bg-white/[0.03] flex">
                    <div className="h-full" style={{ width: "91%", background: "rgba(255,255,255,0.05)" }} />
                    <div
                      className="h-full relative origin-right"
                      style={{
                        width: "9%",
                        background: "rgba(248,113,113,0.25)",
                        boxShadow: "inset 0 0 10px rgba(248,113,113,0.35)",
                        animation: "barGrow 0.9s cubic-bezier(0.22,1,0.36,1) 0.6s both",
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-red-400/70 mt-1.5">
                    platform takes a cut — every time
                  </p>
                </div>

                {/* Paytree — full green, nothing taken */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"
                        style={{ boxShadow: "0 0 5px rgba(0,255,136,0.7)" }}
                      />
                      <span className="text-sm font-mono text-[#00ff88]">Paytree</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#00ff88]/90">100% yours</span>
                  </div>
                  <div
                    className="relative h-7 rounded-lg overflow-hidden origin-left"
                    style={{
                      background: "rgba(0,255,136,0.14)",
                      boxShadow: "0 0 18px rgba(0,255,136,0.18)",
                      animation: "barGrow 1.1s cubic-bezier(0.22,1,0.36,1) 0.85s both",
                    }}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{ boxShadow: "inset 0 1px 0 rgba(0,255,136,0.22)" }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-[#00ff88]/70 mt-1.5">
                    zero fees — you keep everything
                  </p>
                </div>
              </div>
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
        @keyframes barGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </section>
  )
}
