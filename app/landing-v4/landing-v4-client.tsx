"use client"

import Link from "next/link"
import { PhoneMockup } from "@/components/phone-mockup"
import { MiniProfile } from "./mini-profile"
import { PROFILES } from "./mock-profiles"
import { Star, Sparkles, ArrowRight } from "lucide-react"

/**
 * Gallery-first. The pitch is proof: swipe through four believable creator
 * pages before we ever say what the product is. Slide 1 is the cinematic
 * PhoneMockup (live AI-agent sale demo) — the featured page. Slides 2-5 are
 * static MiniProfile renders driven by mock-profiles.ts.
 *
 * Scroll-snap horizontal gallery works fine in TikTok WebViews (no JS gesture
 * handling), and only slide 1 does real animation to keep the first frame
 * cheap on 3G.
 */
export function LandingV4Client() {
  return (
    <main className="pt-12">
      <IntroHead />
      <Gallery />
      <ProofBar />
      <WhyItWorks />
      <CTA />
      <Footer />
      <StickyCTA />
    </main>
  )
}

function IntroHead() {
  return (
    <section className="relative px-5 pt-6 pb-2 text-center">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 15%, rgba(0,255,136,0.14) 0%, transparent 55%)",
        }}
      />
      <div className="relative max-w-md mx-auto">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 motion-safe:animate-[fadeIn_0.4s_ease_both]"
          style={{
            background: "rgba(0,255,136,0.10)",
            border: "0.5px solid rgba(0,255,136,0.35)",
            boxShadow: "0 0 20px rgba(0,255,136,0.16)",
          }}
        >
          <Sparkles size={11} className="text-[#00ff88]" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#00ff88] font-bold">
            real pages · real earnings
          </span>
        </span>

        <h1 className="font-bold tracking-tight leading-[1.02] motion-safe:animate-[slideUp_0.5s_ease_0.05s_both]">
          <span
            className="block text-[38px] text-[#00ff88]"
            style={{
              textShadow:
                "0 0 24px rgba(0,255,136,0.45), 0 0 52px rgba(0,255,136,0.22)",
            }}
          >
            This is what your
          </span>
          <span className="block text-[26px] text-white/95 font-semibold mt-1">
            page could look like.
          </span>
        </h1>

        <p className="mt-3 text-[13px] text-[#aaa] max-w-[290px] mx-auto motion-safe:animate-[fadeIn_0.4s_ease_0.15s_both]">
          Swipe →
        </p>
      </div>
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  )
}

function Gallery() {
  return (
    <section className="mt-4">
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Slide 1 — cinematic photo (featured live demo) */}
        <div className="shrink-0 snap-center">
          <FeaturedTag>Featured · AI closes a sale</FeaturedTag>
          <PhoneMockup />
          <ProfileCaption
            name="Ava Morgan"
            handle="avamorgan"
            niche="signals · $4.6k/mo"
            accent="#00ff88"
          />
        </div>

        {PROFILES.map((p) => (
          <div key={p.handle} className="shrink-0 snap-center">
            <FeaturedTag>{p.niche}</FeaturedTag>
            <MiniProfile profile={p} />
            <ProfileCaption
              name={p.name}
              handle={p.handle}
              niche={p.monthly}
              accent={p.accent}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function FeaturedTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-1.5">
      <span
        className="w-1.5 h-1.5 rounded-full bg-[#00ff88] motion-safe:animate-pulse"
        style={{ boxShadow: "0 0 6px #00ff88" }}
      />
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88]">
        {children}
      </span>
    </div>
  )
}

function ProfileCaption({
  name,
  handle,
  niche,
  accent,
}: {
  name: string
  handle: string
  niche: string
  accent: string
}) {
  return (
    <div className="mt-4 text-center">
      <div className="text-white text-[14px] font-semibold">{name}</div>
      <div
        className="text-[11px] font-mono mt-0.5"
        style={{ color: accent }}
      >
        @{handle}
      </div>
      <div className="text-[11px] font-mono text-[#666] mt-1">{niche}</div>
    </div>
  )
}

function ProofBar() {
  return (
    <section className="mt-6 border-y border-white/[0.05] py-4">
      <div className="max-w-md mx-auto px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={13}
              className="fill-[#00ff88] text-[#00ff88]"
            />
          ))}
        </div>
        <div className="text-[11px] font-mono text-[#aaa]">
          <span className="text-white font-bold">1,247</span> creators live
        </div>
        <div className="text-[11px] font-mono text-[#aaa]">
          <span className="text-[#00ff88] font-bold">0%</span> fees
        </div>
      </div>
    </section>
  )
}

function WhyItWorks() {
  return (
    <section className="px-5 py-10">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-2">
            why they picked paytree
          </div>
          <h2 className="text-[22px] font-bold text-white leading-tight">
            The page is the product.
          </h2>
        </div>
        <div className="mt-5 flex flex-col gap-2.5">
          {[
            {
              t: "0% platform fees",
              b: "Linktree takes 9%. Every $10k = $900 gone. Not here.",
            },
            {
              t: "AI closes the sale",
              b: "Answers DMs. Handles pricing. Replies at 3am.",
            },
            {
              t: "Drops · Vault · Products",
              b: "Real card types made for creators, not just links.",
            },
          ].map((r) => (
            <div
              key={r.t}
              className="relative overflow-hidden rounded-xl p-3.5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div
                aria-hidden
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
                }}
              />
              <div className="text-[13px] font-semibold text-white">{r.t}</div>
              <div className="text-[12px] text-[#888] mt-0.5">{r.b}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="px-5 pb-10">
      <div
        className="max-w-md mx-auto rounded-3xl p-6 text-center relative overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(0,255,136,0.14), rgba(255,255,255,0.03) 60%)",
          border: "0.5px solid rgba(0,255,136,0.3)",
          boxShadow:
            "inset 0 1px 0 rgba(0,255,136,0.2), 0 0 48px rgba(0,255,136,0.14)",
        }}
      >
        <h2 className="text-[22px] font-bold text-white leading-tight">
          Your page — <span className="text-[#00ff88]">live in 60 sec.</span>
        </h2>
        <p className="mt-2 text-[13px] text-[#aaa]">
          Same as Sara, Omar, Jenna, Rana.
        </p>
        <Link
          href="/register-v4"
          className="mt-5 w-full flex items-center justify-center gap-2 bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-2xl text-base active:scale-[0.98]"
          style={{
            minHeight: 56,
            boxShadow: "0 0 40px rgba(0,255,136,0.4)",
          }}
        >
          Claim my page — free
          <ArrowRight size={16} strokeWidth={2.75} />
        </Link>
        <p className="mt-3 text-[11px] font-mono text-[#00ff88] font-semibold">
          No card · Cancel anytime · 0% fees
        </p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.05]">
      <div className="max-w-md mx-auto px-5 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)]" />
          <span className="font-semibold text-white text-sm">Paytree</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-[#666]">
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  )
}

function StickyCTA() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe-12 px-4 pt-3"
      style={{
        background:
          "linear-gradient(180deg, rgba(3,3,3,0) 0%, rgba(3,3,3,0.92) 50%, rgba(3,3,3,0.98) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <Link
        href="/register-v4"
        className="flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-2xl text-base items-center justify-center gap-2 active:scale-[0.98]"
        style={{
          minHeight: 56,
          boxShadow: "0 0 32px rgba(0,255,136,0.4)",
        }}
      >
        Claim my page — free →
      </Link>
    </div>
  )
}
