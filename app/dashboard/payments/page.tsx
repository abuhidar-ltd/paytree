"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Check, Lock, ArrowUpRight, ShoppingBag, Wallet, Link2, Sparkles,
  AlertCircle, ArrowLeft,
} from "lucide-react"
import { glass, glassReflection } from "@/lib/glass"
import { resolveUserPlan, type PlanId } from "@/lib/plans"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { trackEvent } from "@/lib/analytics"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  username: string
  subscriptionStatus?: string | null
  subscriptionPlan?: string | null
  trialEndsAt?: string | null
  subscriptionEndsAt?: string | null
  stripeAccountId?: string | null
  stripeAccountStatus?: string | null
}

interface ProductSummary { totalRevenue: number; salesCount: number }

type StripeStatus = "not_connected" | "pending" | "active"

// ─── Glass primitives ────────────────────────────────────────────────────────

function GlassCard({ children, className = "", padding = "p-6" }: {
  children: ReactNode; className?: string; padding?: string
}) {
  return (
    <div className={`relative overflow-hidden ${padding} ${className}`} style={glass.card}>
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: glassReflection }} />
      {children}
    </div>
  )
}

function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#444]">{children}</span>
      {right}
    </div>
  )
}

// Stripe S badge — simple purple circle with "S"
function StripeBadge({ size = 48 }: { size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #635BFF, #7A73FF)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 14px rgba(99,91,255,0.35)",
        fontSize: size * 0.45,
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      S
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const FEE_TABLE: { plan: PlanId; label: string; fee: string; monthly: string; canSell: boolean }[] = [
  { plan: "free",    label: "Free",    fee: "—",  monthly: "$0",     canSell: false },
  { plan: "starter", label: "Starter", fee: "0%", monthly: "$7/mo",  canSell: true },
  { plan: "ultra",   label: "Ultra",   fee: "0%", monthly: "$19/mo", canSell: true },
]

export default function PaymentsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) setProfile(await res.json())
    } catch {
      // swallow — UI handles null profile
    }
  }

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setProducts(data)
      }
    } catch {
      // optional data
    }
  }

  useEffect(() => {
    trackEvent("payments_page_viewed")
    Promise.allSettled([loadProfile(), loadProducts()]).finally(() => setLoading(false))
  }, [])

  // Handle ?stripe=success when the user navigates back here manually after onboarding.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stripeParam = params.get("stripe")
    if (stripeParam === "success") {
      ;(async () => {
        try {
          const res = await fetch("/api/stripe/connect/status")
          const data = await res.json()
          if (data.status === "active") {
            toast.success("Stripe account connected!")
            trackEvent("stripe_connected", { status: "active" })
          } else {
            toast.success("Stripe onboarding started. Finish setup to activate payments.")
            trackEvent("stripe_connected", { status: "pending" })
          }
        } catch {
          toast.success("Stripe account connected!")
          trackEvent("stripe_connected", { status: "unknown" })
        }
        loadProfile()
        router.replace("/dashboard/payments")
      })()
    } else if (stripeParam === "error") {
      toast.error("Failed to connect Stripe. Please try again.")
      router.replace("/dashboard/payments")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll status when pending — auto-flips to active after Stripe finishes verification
  useEffect(() => {
    if (profile?.stripeAccountStatus !== "pending") return
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/stripe/connect/status")
        const data = await res.json()
        if (data.status === "active") {
          await loadProfile()
        }
      } catch {}
    }, 5000)
    return () => clearInterval(t)
  }, [profile?.stripeAccountStatus])

  const handleDisconnect = async () => {
    setConfirmDisconnect(false)
    setDisconnecting(true)
    try {
      const res = await fetch("/api/stripe/connect/disconnect", { method: "POST" })
      if (res.ok) {
        toast.success("Stripe account disconnected.")
        await loadProfile()
      } else {
        toast.error("Failed to disconnect.")
      }
    } catch {
      toast.error("Failed to disconnect.")
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-[#00ff88] rounded-full animate-spin" />
      </div>
    )
  }

  const userPlan: PlanId = profile ? resolveUserPlan({
    subscriptionStatus: profile.subscriptionStatus,
    subscriptionPlan: profile.subscriptionPlan,
    trialEndsAt: profile.trialEndsAt ? new Date(profile.trialEndsAt) : null,
    subscriptionEndsAt: profile.subscriptionEndsAt ? new Date(profile.subscriptionEndsAt) : null,
  }) : "free"

  const stripeStatus: StripeStatus = (profile?.stripeAccountStatus as StripeStatus) ?? "not_connected"

  const totalRevenue = products.reduce((s, p) => s + (p.totalRevenue || 0), 0)
  const totalSales = products.reduce((s, p) => s + (p.salesCount || 0), 0)

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="max-w-[800px] mx-auto px-6 py-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-7"
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#555] hover:text-[#e0e0e0] hover:border-white/20 transition-colors flex-shrink-0"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Payments</h1>
            <p className="text-sm text-[#555] mt-1.5">
              Connect Stripe to start selling and receiving payments directly.
            </p>
          </div>
        </motion.div>

        {/* ── Connection status + how-it-works + fees ── */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">

          {/* Connection status card */}
          <motion.div variants={cardVariants}>
            <ConnectionCard
              status={stripeStatus}
              onDisconnect={() => setConfirmDisconnect(true)}
              disconnecting={disconnecting}
              userPlan={userPlan}
            />
          </motion.div>

          {/* Revenue summary — only when active */}
          {stripeStatus === "active" && (
            <motion.div variants={cardVariants}>
              <RevenueSummary revenueCents={totalRevenue} sales={totalSales} />
            </motion.div>
          )}

          {/* How it works */}
          <motion.div variants={cardVariants}>
            <HowItWorks />
          </motion.div>

          {/* Platform fees */}
          <motion.div variants={cardVariants}>
            <PlatformFees userPlan={userPlan} />
          </motion.div>

        </motion.div>
      </div>

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Stripe?"
        description="Buyers will no longer be able to purchase your products or send tips until you reconnect."
        confirmLabel="Disconnect"
        loading={disconnecting}
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmDisconnect(false)}
      />
    </div>
  )
}

// ─── Connection status card ──────────────────────────────────────────────────

function ConnectionCard({
  status, onDisconnect, disconnecting, userPlan,
}: {
  status: StripeStatus
  onDisconnect: () => void
  disconnecting: boolean
  userPlan: PlanId
}) {
  if (status === "active") {
    return (
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)" }}
          >
            <Check size={18} className="text-[#00ff88]" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Stripe account connected</p>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(0,255,136,0.12)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" }}>
                Connected
              </span>
            </div>
            <p className="text-xs text-[#666] mt-0.5">
              Buyers pay directly to your Stripe account. <span className="text-[#00ff88]">0% platform fees</span> — you keep every dollar.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] font-mono rounded-xl px-4 py-2.5 text-xs hover:border-white/20 transition-colors"
          >
            View Stripe Dashboard <ArrowUpRight size={12} />
          </a>
          <button
            onClick={onDisconnect}
            disabled={disconnecting}
            className="flex-1 bg-transparent border border-red-500/25 text-red-400 font-mono rounded-xl px-4 py-2.5 text-xs hover:border-red-500/60 transition-colors disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      </GlassCard>
    )
  }

  if (status === "pending") {
    return (
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <AlertCircle size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">Setup incomplete</p>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }}>
                Pending
              </span>
            </div>
            <p className="text-xs text-[#666] mt-0.5">
              Complete your Stripe onboarding to start accepting payments.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
          <Link
            href="/api/stripe/connect"
            onClick={() => trackEvent("stripe_connect_clicked", { source: "continue_setup" })}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-2.5 text-xs hover:opacity-90 transition-opacity"
          >
            Continue setup <ArrowUpRight size={12} />
          </Link>
          <button
            onClick={onDisconnect}
            disabled={disconnecting}
            className="flex-1 bg-transparent border border-red-500/25 text-red-400 font-mono rounded-xl px-4 py-2.5 text-xs hover:border-red-500/60 transition-colors disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      </GlassCard>
    )
  }

  // ── Not connected ──
  return (
    <GlassCard padding="p-8">
      <div className="flex flex-col items-center text-center">
        <StripeBadge size={56} />
        <h2 className="text-lg font-bold text-white mt-5">Connect your Stripe account</h2>
        <p className="text-sm text-[#666] mt-2 max-w-[440px]">
          Buyers pay you directly. <span className="text-[#00ff88] font-mono">0% platform fees</span> — we make money from subscriptions, not your sales.
        </p>

        {/* Compact fee table */}
        <div className="mt-5 w-full max-w-[360px] rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)" }}>
          {FEE_TABLE.map((row, i) => {
            const isCurrent = userPlan === row.plan
            return (
              <div
                key={row.plan}
                className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-mono ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
                style={isCurrent ? { background: "rgba(0,255,136,0.05)" } : undefined}
              >
                <span className={`${row.canSell ? (isCurrent ? "text-[#00ff88]" : "text-[#e0e0e0]") : "text-[#444]"}`}>
                  {row.label} {isCurrent && <span className="text-[9px] uppercase tracking-widest ml-1.5 opacity-70">current</span>}
                </span>
                <span className={`tabular-nums ${row.canSell ? "text-[#00ff88] font-bold" : "text-[#444]"}`}>
                  {row.canSell ? "0% fees" : "Can't sell"}
                </span>
              </div>
            )
          })}
        </div>

        {userPlan === "free" ? (
          <>
            <div className="mt-6 w-full max-w-[280px] rounded-xl px-4 py-3.5 text-center"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs text-amber-400 font-mono">Upgrade to Starter or Ultra to accept payments</p>
            </div>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center justify-center gap-1.5 bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-5 py-3 text-sm hover:opacity-90 transition-opacity w-full max-w-[280px]"
            >
              Upgrade now <ArrowUpRight size={14} />
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/api/stripe/connect"
              onClick={() => trackEvent("stripe_connect_clicked", { source: "first_time" })}
              className="mt-6 inline-flex items-center justify-center gap-1.5 bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-5 py-3 text-sm hover:opacity-90 transition-opacity w-full max-w-[280px]"
            >
              Connect Stripe <ArrowUpRight size={14} />
            </Link>
            <p className="text-[11px] font-mono text-[#444] mt-4 max-w-[360px]">
              Stripe handles all verification and compliance. Your data is secure.
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Lock size={9} className="text-[#444]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#444]">Powered by Stripe</span>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  )
}

// ─── Revenue summary (active only) ──────────────────────────────────────────

function RevenueSummary({ revenueCents, sales }: { revenueCents: number; sales: number }) {
  const dollars = (revenueCents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return (
    <GlassCard>
      <SectionLabel right={
        <a
          href="https://dashboard.stripe.com/payments"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono text-[#888] hover:text-[#00ff88] transition-colors inline-flex items-center gap-1"
        >
          View full breakdown in Stripe <ArrowUpRight size={10} />
        </a>
      }>
        This month
      </SectionLabel>
      <div className="flex items-baseline gap-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#555] mb-1.5">Revenue</p>
          <p className="text-3xl font-bold font-mono text-[#00ff88] tabular-nums leading-none">${dollars}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#555] mb-1.5">Transactions</p>
          <p className="text-3xl font-bold font-mono text-white tabular-nums leading-none">{sales}</p>
        </div>
      </div>
    </GlassCard>
  )
}

// ─── How it works ────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps: { title: string; desc: string; icon: typeof Link2; tint: string }[] = [
    {
      title: "Connect Stripe",
      desc: "Link your existing Stripe account or create one in minutes. Stripe verifies your identity.",
      icon: Link2,
      tint: "#00ff88",
    },
    {
      title: "Add products",
      desc: "Create product cards on your page with prices. Visitors can buy directly.",
      icon: ShoppingBag,
      tint: "#378add",
    },
    {
      title: "Get paid",
      desc: "Payments go directly to your Stripe account. 0% platform fees — you keep 100% of every sale.",
      icon: Wallet,
      tint: "#00ff88",
    },
  ]

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-3">How it works</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <GlassCard key={s.title} padding="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                  style={{ background: "rgba(0,255,136,0.12)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" }}
                >
                  {i + 1}
                </div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.tint}1a`, color: s.tint }}
                >
                  <Icon size={14} />
                </div>
              </div>
              <p className="text-sm font-semibold text-white">{s.title}</p>
              <p className="text-[12px] text-[#666] mt-1.5 leading-relaxed">{s.desc}</p>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}

// ─── Platform fees table ─────────────────────────────────────────────────────

function PlatformFees({ userPlan }: { userPlan: PlanId }) {
  return (
    <GlassCard>
      <SectionLabel right={
        userPlan === "free" ? (
          <Link
            href="/pricing"
            className="text-[11px] font-mono text-[#00ff88] hover:opacity-80 transition-opacity inline-flex items-center gap-1"
          >
            <Sparkles size={10} /> Upgrade plan
          </Link>
        ) : undefined
      }>
        Platform fees
      </SectionLabel>
      <p className="text-xs text-[#666] mb-4 leading-relaxed">
        <span className="text-[#00ff88]">0% platform fees on every paid plan.</span> We make money from subscriptions, not your sales. Stripe processing fees still apply.
      </p>

      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)" }}>
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr] px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[#444]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <span>Plan</span>
          <span className="text-right">Fee</span>
          <span className="text-right">Monthly</span>
        </div>
        {FEE_TABLE.map((row) => {
          const isCurrent = userPlan === row.plan
          return (
            <div
              key={row.plan}
              className="grid grid-cols-[2fr_1fr_1fr] px-4 py-3 text-xs font-mono border-t border-white/[0.04] items-center"
              style={isCurrent ? { background: "rgba(0,255,136,0.05)" } : undefined}
            >
              <span className={isCurrent ? "text-[#00ff88]" : row.canSell ? "text-[#e0e0e0]" : "text-[#666]"}>
                {row.label}
                {isCurrent && <span className="text-[9px] uppercase tracking-widest ml-1.5 opacity-70">current</span>}
              </span>
              <span className={`text-right tabular-nums ${row.fee === "0%" ? "text-[#00ff88] font-bold" : row.canSell ? "text-[#888]" : "text-[#555]"}`}>
                {row.fee}
              </span>
              <span className={`text-right tabular-nums ${row.canSell ? "text-[#888]" : "text-[#555]"}`}>
                {row.canSell ? row.monthly : "Can't sell"}
              </span>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
