"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useInView, AnimatePresence } from "framer-motion"
import {
  Timer,
  Lock,
  Bot,
  Sparkles,
  ChevronDown,
  Check,
  Star,
  ArrowUpRight,
  BadgeCheck,
  Play,
  FileText,
  MessageCircle,
} from "lucide-react"

const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 32 },
  standard: { type: "spring" as const, stiffness: 300, damping: 28 },
  gentle: { type: "spring" as const, stiffness: 180, damping: 24 },
}

const glass = {
  background: "rgba(255,255,255,0.03)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
}

function Reflection() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        pointerEvents: "none",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
      }}
    />
  )
}

export function HomeClient() {
  return (
    <main className="pt-14">
      <Hero />
      <SocialMarquee />
      <FeeCalc />
      <Features />
      <Showcase />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
      <StickyCTA />
    </main>
  )
}

/* ─────────────── HERO ─────────────── */

function Hero() {
  return (
    <section className="relative px-5 pt-8 pb-10">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 24%, rgba(0,255,136,0.10) 0%, transparent 62%)",
        }}
      />
      <div className="relative max-w-md mx-auto flex flex-col items-center text-center">
        {/* Kicker chip */}
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.gentle, delay: 0.05 }}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5"
          style={{
            background: "rgba(0,255,136,0.10)",
            border: "0.5px solid rgba(0,255,136,0.35)",
            boxShadow:
              "inset 0 1px 0 rgba(0,255,136,0.18), 0 0 24px rgba(0,255,136,0.18)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"
            style={{ boxShadow: "0 0 6px rgba(0,255,136,0.9)" }}
          />
          <span className="font-mono text-[11px] tracking-widest uppercase text-[#00ff88] font-bold">
            0% fees · made for creators
          </span>
        </motion.span>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.standard, delay: 0.1 }}
          className="font-bold tracking-tight leading-[1.02]"
        >
          <span
            className="block text-[44px] text-[#00ff88]"
            style={{
              textShadow:
                "0 0 24px rgba(0,255,136,0.45), 0 0 52px rgba(0,255,136,0.22), 0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            Sell everything
          </span>
          <span className="block mt-1 text-[26px] text-white/95 font-semibold">
            from one link.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.standard, delay: 0.15 }}
          className="mt-4 text-[15px] leading-snug text-[#aaa] max-w-[300px]"
        >
          Your paid page.{" "}
          <span className="text-white">AI closes sales while you sleep.</span>
        </motion.p>

        {/* Compact mockup */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...springs.standard, delay: 0.2 }}
          className="mt-6"
        >
          <MiniPhoneMockup />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.standard, delay: 0.28 }}
          className="mt-6 w-full max-w-sm"
        >
          <Link
            data-testid="home-hero-cta"
            href="/register"
            aria-label="Create your free page"
            className="group flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-2xl text-base items-center justify-center gap-2 active:scale-[0.98] shadow-[0_0_40px_rgba(0,255,136,0.35)] transition-transform"
            style={{ minHeight: 56 }}
          >
            Claim my page — free
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
          {/* Trust row */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[12px] font-mono text-[#888]">
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  size={12}
                  className="fill-[#00ff88] text-[#00ff88]"
                />
              ))}
            </div>
            <span>1,247 creators · no card needed</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/**
 * Realistic Paytree phone mockup — matches the real profile page:
 * 108px avatar with accent halo, verified pill, real link cards with
 * icon/arrow, drop card with live countdown, vault card, AI agent chip.
 * Fits the actual visual language a signed-up user sees.
 */
function MiniPhoneMockup() {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: 264,
        height: 540,
        borderRadius: 42,
        padding: 7,
        background:
          "linear-gradient(180deg, #1c1c1c 0%, #0a0a0a 40%, #000 100%)",
        boxShadow:
          "0 40px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px rgba(0,255,136,0.08), inset 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      {/* Dynamic Island */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-20 h-5 w-20 rounded-full"
        style={{
          background: "#000",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      />
      {/* Screen */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: 36,
          background:
            "radial-gradient(circle at 50% 8%, rgba(0,255,136,0.06) 0%, transparent 55%), #050505",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[9px] font-mono text-white/70">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span className="tracking-tight">●●●</span>
            <span>􀛨</span>
          </div>
        </div>

        {/* Profile head */}
        <div className="pt-4 px-4 flex flex-col items-center">
          {/* Avatar with halo — real profile ratio */}
          <div
            className="w-16 h-16 rounded-full overflow-hidden relative"
            style={{
              border: "1.5px solid rgba(0,255,136,0.55)",
              boxShadow:
                "0 0 0 3px rgba(0,255,136,0.14), 0 0 20px rgba(0,255,136,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, #00ff88 0%, #0a0a0a 100%)",
              }}
            >
              S
            </div>
          </div>

          {/* Verified pill */}
          <div
            className="inline-flex items-center gap-1 mt-2.5 px-2 py-[3px] rounded-full"
            style={{
              background: "rgba(0,255,136,0.12)",
              border: "0.5px solid rgba(0,255,136,0.35)",
            }}
          >
            <BadgeCheck
              size={9}
              strokeWidth={3}
              className="text-[#00ff88]"
            />
            <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#00ff88]">
              Verified
            </span>
          </div>

          <div className="text-white font-bold text-[15px] mt-2">
            Sara Rahman
          </div>
          <div className="text-[#00ff88] font-mono text-[10px] mt-0.5">
            @sara
          </div>
          <div className="text-[#888] text-[10px] mt-1 text-center leading-tight px-3">
            Trading signals · daily setups
          </div>
        </div>

        {/* Cards feed — real Paytree styling */}
        <div className="mt-4 px-3.5 flex flex-col gap-2">
          {/* Starred link card — signals */}
          <RealLinkCard
            icon={<Play size={12} className="text-[#00ff88]" strokeWidth={2.5} fill="#00ff88" />}
            title="Live trading signals"
            starred
          />

          {/* Drop card with countdown */}
          <RealDropCard />

          {/* Vault card */}
          <RealVaultCard />

          {/* AI agent card */}
          <RealAgentCard />

          {/* Regular link */}
          <RealLinkCard
            icon={<FileText size={12} className="text-[#f0f0f0]" strokeWidth={2.5} />}
            title="Free strategy PDF"
          />
        </div>
      </div>
    </div>
  )
}

/* Real link card — 44px height, thumbnail chip + title + arrow */
function RealLinkCard({
  icon,
  title,
  starred,
}: {
  icon: React.ReactNode
  title: string
  starred?: boolean
}) {
  return (
    <motion.div
      animate={
        starred
          ? {
              boxShadow: [
                "0 0 0 0 rgba(0,255,136,0)",
                "0 0 0 3px rgba(0,255,136,0.15)",
                "0 0 0 0 rgba(0,255,136,0)",
              ],
            }
          : undefined
      }
      transition={
        starred
          ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: starred
          ? "0.5px solid rgba(0,255,136,0.5)"
          : "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <Reflection />
      <div
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{
          background: starred
            ? "linear-gradient(135deg, rgba(0,255,136,0.25), rgba(0,255,136,0.05))"
            : "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-white text-[11px] font-semibold truncate">
        {title}
      </div>
      <div
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <ArrowUpRight size={10} className="text-white/60" strokeWidth={2.5} />
      </div>
    </motion.div>
  )
}

/* Real drop card — DROP · SCHEDULED kicker, live 3-cell countdown */
function RealDropCard() {
  // SSR-safe fake countdown — starts client-side, avoids Date.now() in render.
  const [remaining, setRemaining] = useState(2 * 3600_000 + 14 * 60_000 + 29_000)
  useEffect(() => {
    const target = Date.now() + remaining
    const id = setInterval(() => {
      setRemaining(Math.max(0, target - Date.now()))
    }, 1000)
    return () => clearInterval(id)
    // Fresh mount = fresh countdown; deps intentionally empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const t = Math.floor(remaining / 1000)
  const hh = String(Math.floor(t / 3600)).padStart(2, "0")
  const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0")
  const ss = String(t % 60).padStart(2, "0")

  return (
    <div
      className="w-full rounded-xl p-3 relative overflow-hidden"
      style={{
        background: "rgba(0,255,136,0.04)",
        border: "0.5px solid rgba(0,255,136,0.28)",
      }}
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,255,136,0.5), transparent)",
        }}
      />
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[8px] font-mono uppercase tracking-widest text-[#00ff88]/70">
          DROP · SCHEDULED
        </div>
        <div
          className="text-[8px] font-mono px-1.5 py-0.5 rounded-full"
          style={{
            background: "rgba(245,158,11,0.12)",
            border: "0.5px solid rgba(245,158,11,0.35)",
            color: "#f59e0b",
          }}
        >
          12 spots left
        </div>
      </div>
      <div className="text-white text-[12px] font-semibold leading-tight">
        Course launch — 50% off
      </div>
      <div className="grid grid-cols-3 gap-1 mt-2">
        {[
          { l: "HRS", v: hh },
          { l: "MIN", v: mm },
          { l: "SEC", v: ss },
        ].map((u) => (
          <div
            key={u.l}
            className="rounded-md py-1 text-center relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.06)",
            }}
          >
            <motion.div
              key={u.v}
              initial={{ scale: 1.15, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18 }}
              className="text-white font-mono font-bold text-[13px] tabular-nums leading-none"
            >
              {u.v}
            </motion.div>
            <div className="text-[7px] font-mono uppercase tracking-widest text-[#555] mt-0.5">
              {u.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Real vault card — locked with email chip */
function RealVaultCard() {
  return (
    <div
      className="w-full rounded-xl p-2.5 relative overflow-hidden flex items-center gap-2.5"
      style={{
        background: "rgba(145,70,255,0.05)",
        border: "0.5px solid rgba(145,70,255,0.3)",
      }}
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(145,70,255,0.5), transparent)",
        }}
      />
      <div
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{
          background: "rgba(145,70,255,0.12)",
          border: "0.5px solid rgba(145,70,255,0.35)",
        }}
      >
        <Lock size={12} className="text-[#b98cff]" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[8px] font-mono uppercase tracking-widest text-[#b98cff]/80">
          VAULT · LOCKED
        </div>
        <div className="text-white text-[11px] font-semibold truncate">
          Secret Telegram group
        </div>
      </div>
      <div
        className="shrink-0 text-[8px] font-mono px-1.5 py-0.5 rounded"
        style={{
          background: "rgba(145,70,255,0.15)",
          color: "#b98cff",
        }}
      >
        email
      </div>
    </div>
  )
}

/* Real AI agent chip — pulsing green dot + "Ask me anything" */
function RealAgentCard() {
  return (
    <motion.div
      animate={{
        boxShadow: [
          "0 0 12px rgba(0,255,136,0.15)",
          "0 0 24px rgba(0,255,136,0.32)",
          "0 0 12px rgba(0,255,136,0.15)",
        ],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      className="w-full rounded-xl p-2.5 relative overflow-hidden flex items-center gap-2.5"
      style={{
        background:
          "linear-gradient(90deg, rgba(0,255,136,0.06), rgba(0,255,136,0.02))",
        border: "0.5px solid rgba(0,255,136,0.35)",
      }}
    >
      <Reflection />
      <div
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center relative"
        style={{
          background: "rgba(0,255,136,0.12)",
          border: "0.5px solid rgba(0,255,136,0.4)",
        }}
      >
        <Bot size={13} className="text-[#00ff88]" strokeWidth={2.5} />
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00ff88]"
          style={{ boxShadow: "0 0 6px #00ff88" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[8px] font-mono uppercase tracking-widest text-[#00ff88]">
          AI SALES AGENT · ONLINE
        </div>
        <div className="text-white text-[11px] font-semibold">
          Ask me anything
        </div>
      </div>
      <MessageCircle size={12} className="text-[#00ff88]/70" />
    </motion.div>
  )
}

/* ─────────────── SOCIAL MARQUEE ─────────────── */

function SocialMarquee() {
  const handles = [
    "@finance.sara",
    "@cryptocoach",
    "@lifting.mo",
    "@edu.lila",
    "@yt.jamal",
    "@tiktok.rana",
    "@sneaker.k",
    "@copytrade.p",
  ]
  return (
    <section className="py-6 border-y border-white/[0.05] overflow-hidden">
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#555] text-center mb-3">
        creators already selling on paytree
      </div>
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
      >
        {[...handles, ...handles, ...handles].map((h, i) => (
          <span
            key={i}
            className="font-mono text-sm text-[#666] shrink-0 flex items-center gap-2"
          >
            <span
              className="w-1 h-1 rounded-full bg-[#00ff88]"
              style={{ boxShadow: "0 0 6px rgba(0,255,136,0.6)" }}
            />
            {h}
          </span>
        ))}
      </motion.div>
    </section>
  )
}

/* ─────────────── FEE CALCULATOR ─────────────── */

function FeeCalc() {
  const [monthly, setMonthly] = useState(3000)
  const linktreeCut = Math.round(monthly * 0.09)
  const yearlyKept = linktreeCut * 12

  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section ref={ref} className="px-5 py-14">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={springs.standard}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-2">
            the math
          </div>
          <h2 className="text-[28px] font-bold leading-tight text-white">
            Linktree takes 9%.
            <br />
            <span className="text-[#ff5555]">That&apos;s your money.</span>
          </h2>
          <p className="mt-3 text-[14px] text-[#888]">
            Slide to your monthly sales.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...springs.standard, delay: 0.1 }}
          className="mt-5 rounded-2xl p-5 relative overflow-hidden"
          style={glass}
        >
          <Reflection />

          {/* Slider */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-[#666] uppercase tracking-wider">
              you sell / month
            </span>
            <span className="font-mono text-[#00ff88] font-bold text-lg">
              ${monthly.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={500}
            max={20000}
            step={500}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full accent-[#00ff88] h-2"
            style={{
              WebkitAppearance: "none",
              appearance: "none",
              background: `linear-gradient(90deg, #00ff88 ${
                ((monthly - 500) / 19500) * 100
              }%, rgba(255,255,255,0.08) ${
                ((monthly - 500) / 19500) * 100
              }%)`,
              borderRadius: 999,
              outline: "none",
            }}
          />

          {/* Compare */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-3.5 relative overflow-hidden"
              style={{
                background: "rgba(255,85,85,0.08)",
                border: "0.5px solid rgba(255,85,85,0.25)",
              }}
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#ff5555]/80 mb-1">
                Linktree
              </div>
              <div className="font-mono text-2xl font-bold text-[#ff5555]">
                −${linktreeCut.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#ff5555]/70 mt-1 font-mono">
                gone / month
              </div>
            </div>
            <div
              className="rounded-xl p-3.5 relative overflow-hidden"
              style={{
                background: "rgba(0,255,136,0.06)",
                border: "0.5px solid rgba(0,255,136,0.3)",
                boxShadow: "0 0 24px rgba(0,255,136,0.12)",
              }}
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-1">
                Paytree
              </div>
              <div className="font-mono text-2xl font-bold text-[#00ff88]">
                $0
              </div>
              <div className="text-[11px] text-[#00ff88]/80 mt-1 font-mono">
                you keep all
              </div>
            </div>
          </div>

          <div
            className="mt-4 rounded-xl px-3.5 py-2.5 text-center"
            style={{
              background: "rgba(0,255,136,0.05)",
              border: "0.5px dashed rgba(0,255,136,0.35)",
            }}
          >
            <div className="text-[11px] font-mono text-[#888] uppercase tracking-widest">
              extra in your pocket / year
            </div>
            <div className="font-mono text-[#00ff88] text-2xl font-bold mt-0.5">
              +${yearlyKept.toLocaleString()}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────── FEATURES ─────────────── */

const FEATURES = [
  {
    Icon: Timer,
    kicker: "drops",
    title: "Countdown that converts.",
    body: "Ship a drop card. Timer glows. Buyers panic-buy at 00:00.",
    accent: "#f59e0b",
  },
  {
    Icon: Lock,
    kicker: "vault",
    title: "Email-gate anything.",
    body: "Free PDF, private Telegram, secret discount — locked behind email.",
    accent: "#9146ff",
  },
  {
    Icon: Bot,
    kicker: "agent",
    title: "AI sales rep, 24/7.",
    body: "Answers DMs on your page. Closes the sale while you sleep.",
    accent: "#00ff88",
  },
]

function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section ref={ref} className="px-5 py-14">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={springs.standard}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-2">
            what you get
          </div>
          <h2 className="text-[28px] font-bold leading-tight text-white">
            Three weapons Linktree
            <br />
            doesn&apos;t have.
          </h2>
        </motion.div>

        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="mt-6 flex flex-col gap-3"
        >
          {FEATURES.map(({ Icon, kicker, title, body, accent }) => (
            <motion.div
              key={kicker}
              variants={{
                hidden: { opacity: 0, y: 16, scale: 0.98 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: springs.standard,
                },
              }}
              className="relative overflow-hidden rounded-2xl p-4 flex gap-3.5"
              style={glass}
            >
              <Reflection />
              <div
                className="shrink-0 w-11 h-11 rounded-xl grid place-items-center"
                style={{
                  background: `${accent}12`,
                  border: `0.5px solid ${accent}55`,
                  boxShadow: `inset 0 1px 0 ${accent}22, 0 0 18px ${accent}22`,
                }}
              >
                <Icon size={20} strokeWidth={2.25} style={{ color: accent }} />
              </div>
              <div className="min-w-0">
                <div
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  {kicker}
                </div>
                <div className="text-[15px] font-semibold text-white mt-0.5">
                  {title}
                </div>
                <div className="text-[13px] text-[#888] mt-1 leading-snug">
                  {body}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────── SHOWCASE ─────────────── */

function Showcase() {
  const cards = [
    { name: "@sara", niche: "signals", earn: "$4.2k/mo" },
    { name: "@yasmin", niche: "PDFs", earn: "$1.8k/mo" },
    { name: "@omar", niche: "coach", earn: "$7.1k/mo" },
    { name: "@rana", niche: "creator", earn: "$3.4k/mo" },
  ]
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section ref={ref} className="py-14">
      <div className="max-w-md mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={springs.standard}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-2">
            real pages
          </div>
          <h2 className="text-[28px] font-bold leading-tight text-white">
            Creators are already
            <br />
            printing.
          </h2>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ ...springs.gentle, delay: 0.1 }}
        className="mt-6 flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {cards.map((c) => (
          <div
            key={c.name}
            className="shrink-0 snap-center rounded-2xl p-4 relative overflow-hidden"
            style={{ ...glass, width: 200 }}
          >
            <Reflection />
            <div
              className="w-full aspect-[9/16] rounded-lg mb-3 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,0,0,0.4))",
                border: "0.5px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.4)] shadow-[0_0_16px_rgba(0,255,136,0.4)]" />
              <div className="absolute top-16 left-3 right-3 flex flex-col gap-1.5">
                <div className="h-4 rounded bg-white/[0.06]" />
                <div className="h-4 rounded bg-white/[0.06]" />
                <div className="h-4 rounded bg-[#00ff88]/20 border border-[#00ff88]/40" />
                <div className="h-4 rounded bg-white/[0.06]" />
              </div>
            </div>
            <div className="text-white font-semibold text-sm">{c.name}</div>
            <div className="text-[11px] text-[#666] font-mono">{c.niche}</div>
            <div className="text-[#00ff88] font-mono text-sm font-bold mt-1">
              {c.earn}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}

/* ─────────────── PRICING ─────────────── */

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    per: "forever",
    tag: "Try it",
    features: ["Publish your page", "Core cards", "0% platform fees"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$7",
    per: "/mo",
    tag: "Most popular",
    highlighted: true,
    features: [
      "Everything in Free",
      "Drops + countdown timers",
      "Vault — email gate",
      "AI sales agent",
      "0% platform fees",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    price: "$19",
    per: "/mo",
    tag: "Serious",
    features: [
      "Everything in Pro",
      "3D globe analytics",
      "No Paytree branding",
      "Priority support",
    ],
  },
]

function Pricing() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="px-5 py-14">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={springs.standard}
          className="text-center"
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-2">
            pricing
          </div>
          <h2 className="text-[28px] font-bold leading-tight text-white">
            Cheaper than lunch.
            <br />
            Pays for itself in a sale.
          </h2>
        </motion.div>

        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="mt-6 flex flex-col gap-3"
        >
          {PLANS.map((p) => (
            <motion.div
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 16, scale: 0.98 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: springs.standard,
                },
              }}
              className="relative overflow-hidden rounded-2xl p-5"
              style={{
                background: p.highlighted
                  ? "rgba(0,255,136,0.06)"
                  : "rgba(255,255,255,0.03)",
                border: p.highlighted
                  ? "0.5px solid rgba(0,255,136,0.45)"
                  : "0.5px solid rgba(255,255,255,0.08)",
                boxShadow: p.highlighted
                  ? "inset 0 1px 0 rgba(0,255,136,0.2), 0 0 32px rgba(0,255,136,0.15)"
                  : "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <Reflection />

              {p.highlighted && (
                <div
                  className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full"
                  style={{
                    background: "rgba(0,255,136,0.15)",
                    color: "#00ff88",
                    border: "0.5px solid rgba(0,255,136,0.4)",
                  }}
                >
                  {p.tag}
                </div>
              )}

              <div className="flex items-baseline gap-2">
                <div className="text-white font-semibold text-lg">{p.name}</div>
                {!p.highlighted && (
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#666]">
                    {p.tag}
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <div
                  className="font-mono font-bold"
                  style={{
                    fontSize: 40,
                    color: p.highlighted ? "#00ff88" : "#f0f0f0",
                  }}
                >
                  {p.price}
                </div>
                <div className="text-[#666] font-mono text-sm">{p.per}</div>
              </div>

              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      size={14}
                      className="text-[#00ff88] mt-0.5 shrink-0"
                      strokeWidth={2.5}
                    />
                    <span className="text-[13px] text-[#ccc]">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="mt-5 flex w-full items-center justify-center rounded-xl font-mono font-semibold text-sm active:scale-[0.97] transition-transform"
                style={{
                  minHeight: 48,
                  background: p.highlighted ? "#00ff88" : "rgba(255,255,255,0.05)",
                  color: p.highlighted ? "#000" : "#f0f0f0",
                  border: p.highlighted
                    ? "none"
                    : "0.5px solid rgba(255,255,255,0.12)",
                  boxShadow: p.highlighted
                    ? "0 0 24px rgba(0,255,136,0.35)"
                    : "none",
                }}
              >
                {p.id === "free" ? "Start free" : `Start ${p.name}`}
                <span className="ml-1.5">→</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────── FAQ ─────────────── */

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. Free forever, real product — publish, take payments, keep 100% of the sale. Stripe still charges its processing fee (2.9% + 30¢), but Paytree takes $0.",
  },
  {
    q: "How is it 0% platform fees?",
    a: "We make money when you upgrade to Pro or Ultra — not by skimming your sales. If Free works for you, keep everything.",
  },
  {
    q: "Do I need a website?",
    a: "No. Your Paytree page IS your website. Custom URL, mobile-perfect, one link works everywhere — TikTok bio, IG, YouTube.",
  },
  {
    q: "Can I switch from Linktree?",
    a: "In 60 seconds. Paste your existing links, publish, redirect. We'll even build your first drop card for you.",
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section ref={ref} className="px-5 py-14">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={springs.standard}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-2">
            questions
          </div>
          <h2 className="text-[28px] font-bold leading-tight text-white">
            Kill the doubts.
          </h2>
        </motion.div>

        <div className="mt-6 flex flex-col gap-2.5">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...springs.standard, delay: 0.05 * i }}
                className="rounded-2xl relative overflow-hidden"
                style={glass}
              >
                <Reflection />
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left px-4 py-4 flex items-center justify-between gap-3"
                  style={{ minHeight: 56 }}
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] font-semibold text-white">
                    {f.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={springs.snappy}
                    className="shrink-0 text-[#00ff88]"
                  >
                    <ChevronDown size={18} strokeWidth={2.5} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={springs.gentle}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 text-[14px] leading-relaxed text-[#aaa]">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────── FINAL CTA ─────────────── */

function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section ref={ref} className="px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={springs.standard}
        className="max-w-md mx-auto rounded-3xl p-7 relative overflow-hidden text-center"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(0,255,136,0.14), rgba(255,255,255,0.03) 60%)",
          border: "0.5px solid rgba(0,255,136,0.3)",
          boxShadow:
            "inset 0 1px 0 rgba(0,255,136,0.2), 0 0 48px rgba(0,255,136,0.15)",
        }}
      >
        <Reflection />

        <motion.div
          animate={{
            boxShadow: [
              "0 0 20px rgba(0,255,136,0.2)",
              "0 0 40px rgba(0,255,136,0.4)",
              "0 0 20px rgba(0,255,136,0.2)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="inline-flex w-14 h-14 rounded-2xl bg-[rgba(0,255,136,0.15)] border border-[rgba(0,255,136,0.4)] items-center justify-center mb-4"
        >
          <Sparkles size={22} className="text-[#00ff88]" />
        </motion.div>

        <h2 className="text-[26px] font-bold text-white leading-tight">
          Your page takes
          <br />
          <span className="text-[#00ff88]">60 seconds</span> to set up.
        </h2>
        <p className="mt-3 text-[14px] text-[#aaa]">
          Every day you wait is a day Linktree keeps skimming.
        </p>

        <Link
          href="/register"
          className="mt-6 flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-2xl text-base items-center justify-center gap-2 active:scale-[0.98] shadow-[0_0_40px_rgba(0,255,136,0.4)] transition-transform"
          style={{ minHeight: 56 }}
        >
          Claim my paytree — free
          <span>→</span>
        </Link>
        <p className="mt-3 text-[12px] font-mono text-[#00ff88] font-semibold">
          No card · Cancel anytime · 0% fees
        </p>
      </motion.div>
    </section>
  )
}

/* ─────────────── FOOTER ─────────────── */

function Footer() {
  return (
    <footer className="border-t border-white/[0.05] mt-4">
      <div className="max-w-md mx-auto px-5 py-8">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
          <span className="font-semibold text-white text-sm">Paytree</span>
          <span className="text-[10px] font-mono text-[#666] ml-auto">
            v2 preview
          </span>
        </div>
        <div className="mt-4 flex items-center gap-5 text-[12px] font-mono text-[#666]">
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <div className="mt-4 text-[11px] font-mono text-[#555]">
          © {new Date().getFullYear()} Paytree. 0% platform fees. Stripe fees apply.
        </div>
      </div>
    </footer>
  )
}

/* ─────────────── STICKY CTA ─────────────── */

function StickyCTA() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={springs.standard}
          className="fixed bottom-0 left-0 right-0 z-40 pb-safe-12 px-4 pt-3"
          style={{
            background:
              "linear-gradient(180deg, rgba(3,3,3,0) 0%, rgba(3,3,3,0.9) 40%, rgba(3,3,3,0.98) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <Link
            href="/register"
            className="flex w-full bg-[#00ff88] text-black font-mono font-bold px-6 py-4 rounded-2xl text-base items-center justify-center gap-2 active:scale-[0.98] shadow-[0_0_40px_rgba(0,255,136,0.4)]"
            style={{ minHeight: 56 }}
          >
            Claim my page — free →
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
