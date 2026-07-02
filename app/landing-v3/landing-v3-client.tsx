"use client"

import Link from "next/link"
import { PhoneMockup } from "@/components/phone-mockup"
import { Star, Percent, Zap, ShieldCheck } from "lucide-react"

/**
 * TikTok Turbo. Two rules:
 *
 * 1. The user's first tap in a slow WebView should be the CTA. Every element
 *    above the CTA has to earn its place — one chip, one headline, one line
 *    of sub, then the cinematic phone, then the button. Nothing else.
 *
 * 2. CSS animations only (no framer-motion runtime cost in the hero) so this
 *    paints in one frame even on throttled cores. Reduced-motion tokens are
 *    respected via `motion-reduce:` utilities. framer-motion is intentionally
 *    absent from this route to keep the JS bundle minimal.
 */
export function LandingV3Client() {
  return (
    <main className="pt-12">
      <Hero />
      <ProofStrip />
      <ThreeReasons />
      <BigFinal />
      <Footer />
      <PermanentStickyCTA />
    </main>
  )
}

function Hero() {
  return (
    <section className="relative px-5 pt-6 pb-4 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 15%, rgba(0,255,136,0.18) 0%, transparent 55%)",
        }}
      />
      <div className="relative max-w-md mx-auto flex flex-col items-center text-center">
        {/* Kicker */}
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 motion-safe:animate-[fadeIn_0.4s_ease_both]"
          style={{
            background: "rgba(0,255,136,0.10)",
            border: "0.5px solid rgba(0,255,136,0.35)",
            boxShadow: "0 0 20px rgba(0,255,136,0.16)",
          }}
        >
          <Percent size={11} className="text-[#00ff88]" strokeWidth={2.5} />
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#00ff88] font-bold">
            0% fees · keep everything
          </span>
        </span>

        <h1 className="font-bold tracking-tight leading-[1.02] motion-safe:animate-[slideUp_0.5s_ease_0.05s_both]">
          <span
            className="block text-[42px] text-[#00ff88]"
            style={{
              textShadow:
                "0 0 24px rgba(0,255,136,0.45), 0 0 52px rgba(0,255,136,0.22)",
            }}
          >
            One link.
          </span>
          <span className="block text-[42px] text-white/95 mt-1">Every sale.</span>
        </h1>

        <p className="mt-3 text-[14px] text-[#aaa] leading-snug max-w-[300px] motion-safe:animate-[fadeIn_0.5s_ease_0.15s_both]">
          Drop a link. AI closes the sale.{" "}
          <span className="text-white">You keep every cent.</span>
        </p>

        {/* Cinematic phone — the whole product in one glance */}
        <div className="mt-6 motion-safe:animate-[slideUp_0.6s_ease_0.2s_both]">
          <PhoneMockup className="mx-auto scale-90" />
        </div>

        {/* CTA — always in view under the hero and again in the sticky bar */}
        <Link
          href="/register"
          className="mt-6 w-full max-w-sm flex items-center justify-center gap-2 bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-2xl text-base active:scale-[0.98] motion-safe:animate-[pulseGlow_2.4s_ease_infinite]"
          style={{
            minHeight: 56,
            boxShadow: "0 0 40px rgba(0,255,136,0.4)",
          }}
        >
          Claim my page — 60 sec →
        </Link>

        <div className="mt-3 flex items-center justify-center gap-2 text-[12px] font-mono text-[#888]">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                size={11}
                className="fill-[#00ff88] text-[#00ff88]"
              />
            ))}
          </div>
          <span>1,247 creators · no card</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(0,255,136,0.4); }
          50% { box-shadow: 0 0 64px rgba(0,255,136,0.62); }
        }
      `}</style>
    </section>
  )
}

function ProofStrip() {
  return (
    <section className="border-y border-white/[0.05] py-4 overflow-hidden">
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#555] text-center mb-2">
        already selling
      </div>
      {/* CSS marquee — no JS. Reduced-motion users see a static row. */}
      <div className="marquee">
        <div className="marquee-track">
          {[
            "@sara.trades",
            "@coach.omar",
            "@jenna.pdf",
            "@rana.crypto",
            "@yasmin.fit",
            "@amir.stocks",
            "@leo.beats",
            "@nadia.eats",
          ].concat([
            "@sara.trades",
            "@coach.omar",
            "@jenna.pdf",
            "@rana.crypto",
            "@yasmin.fit",
            "@amir.stocks",
            "@leo.beats",
            "@nadia.eats",
          ]).map((h, i) => (
            <span key={i} className="marquee-item">
              <span
                className="w-1 h-1 rounded-full bg-[#00ff88]"
                style={{ boxShadow: "0 0 6px rgba(0,255,136,0.6)" }}
              />
              {h}
            </span>
          ))}
        </div>
      </div>
      <style jsx>{`
        .marquee { overflow: hidden; }
        .marquee-track {
          display: inline-flex;
          gap: 28px;
          white-space: nowrap;
          animation: scroll 22s linear infinite;
          will-change: transform;
        }
        .marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          color: #666;
        }
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </section>
  )
}

const REASONS = [
  {
    Icon: Percent,
    kicker: "0% fees",
    title: "Linktree takes 9%.",
    body: "$10k sold → $900 gone. On Paytree: $0.",
  },
  {
    Icon: Zap,
    kicker: "AI",
    title: "Sells while you sleep.",
    body: "AI agent answers DMs and closes on your page 24/7.",
  },
  {
    Icon: ShieldCheck,
    kicker: "free",
    title: "Free forever.",
    body: "No card. Publish real product. Upgrade only if you want.",
  },
]

function ThreeReasons() {
  return (
    <section className="px-5 py-10">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-2">
            why now
          </div>
          <h2 className="text-[24px] font-bold text-white leading-tight">
            Three reasons.
            <br />
            Three seconds.
          </h2>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {REASONS.map(({ Icon, kicker, title, body }) => (
            <div
              key={kicker}
              className="relative overflow-hidden rounded-2xl p-4 flex gap-3"
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
              <div
                className="shrink-0 w-10 h-10 rounded-xl grid place-items-center"
                style={{
                  background: "rgba(0,255,136,0.08)",
                  border: "0.5px solid rgba(0,255,136,0.3)",
                }}
              >
                <Icon size={18} strokeWidth={2.25} className="text-[#00ff88]" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88]">
                  {kicker}
                </div>
                <div className="text-[15px] font-semibold text-white">
                  {title}
                </div>
                <div className="text-[13px] text-[#888] mt-0.5">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BigFinal() {
  return (
    <section className="px-5 py-10">
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
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-3">
          last thing
        </div>
        <h2 className="text-[24px] font-bold text-white leading-tight">
          60 seconds now
          <br />
          <span className="text-[#00ff88]">or another day lost.</span>
        </h2>
        <Link
          href="/register"
          className="mt-5 w-full flex items-center justify-center gap-2 bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-2xl text-base active:scale-[0.98]"
          style={{
            minHeight: 56,
            boxShadow: "0 0 40px rgba(0,255,136,0.4)",
          }}
        >
          Claim my paytree →
        </Link>
        <p className="mt-3 text-[11px] font-mono text-[#00ff88] font-semibold">
          No card · Cancel anytime
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

/**
 * Sticky CTA that is present from the FIRST paint — not gated behind a
 * scroll event. Inside a slow TikTok WebView the scroll listener may not
 * even fire before the user swipes back. Better to trade a bit of screen
 * real-estate for a guaranteed-visible CTA.
 */
function PermanentStickyCTA() {
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
        href="/register"
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
