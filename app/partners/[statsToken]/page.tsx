import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { computeAffiliateStats } from "@/lib/affiliate-server"

// This is a public page — no auth. The statsToken IS the authorization; anyone
// with the URL can see the numbers, so:
//   1. Aggregate counts only. No user names, emails, or any other PII.
//   2. Invalid / unknown tokens return the framework 404 (via notFound()) —
//      identical to any missing route. We deliberately don't distinguish
//      "malformed token", "not found", and "inactive" so the shape of the
//      404 doesn't leak information about token validity.
//   3. Never index — see generateMetadata below (robots + noindex meta) and
//      app/robots.ts (/partners/ is in the disallow list).

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Partner stats · Paytree",
  robots: { index: false, follow: false, nocache: true },
}

interface Props {
  params: Promise<{ statsToken: string }>
}

// Cheap guard so we don't hit the DB with anything that couldn't possibly
// match a token we ever issued. Kept intentionally simple — the token is
// validated for real by the DB lookup below.
const TOKEN_SHAPE = /^[a-f0-9-]{16,64}$/i

export default async function PartnerStatsPage({ params }: Props) {
  noStore()
  const { statsToken } = await params

  if (!TOKEN_SHAPE.test(statsToken)) notFound()

  const affiliate = await prisma.affiliate.findUnique({
    where: { statsToken },
    include: {
      users: {
        select: {
          subscriptionStatus: true,
          subscriptionPlan: true,
          subscriptionInterval: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          isComped: true,
          compedExpiresAt: true,
        },
      },
    },
  })
  if (!affiliate) notFound()

  const commission = Number(affiliate.commissionPercent)
  const stats = computeAffiliateStats(affiliate.users, commission)
  const payoutUsd = (stats.monthlyCommissionCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
        {/* Header — brand mark + label */}
        <div className="flex items-center gap-3 mb-12">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(0,255,136,0.1)",
              border: "0.5px solid rgba(0,255,136,0.2)",
              boxShadow: "0 0 20px rgba(0,255,136,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="w-3 h-3 rounded-full bg-[#00ff88]" style={{ boxShadow: "0 0 8px rgba(0,255,136,0.6)" }} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#b0b0b0]">Paytree Partners</div>
            <div className="text-sm font-mono text-white">{affiliate.name}</div>
          </div>
        </div>

        {/* Hero payout number */}
        <div className="mb-12">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#b0b0b0] mb-2">
            Estimated monthly payout
          </div>
          <div className="text-5xl sm:text-6xl font-bold text-white tracking-tight">{payoutUsd}</div>
          <div className="text-xs font-mono text-[#c9c9d1] mt-2">
            {commission.toFixed(2)}% of referred users&apos; current recurring revenue.
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <StatBlock label="Referred" value={stats.total.toLocaleString("en-US")} />
          <StatBlock label="Paid" value={stats.paid.toLocaleString("en-US")} accent />
          <StatBlock label="Free" value={stats.free.toLocaleString("en-US")} />
        </div>

        {/* Notes */}
        <div className="border-t border-white/[0.06] pt-6 space-y-3">
          <p className="text-xs font-mono text-[#c9c9d1] leading-relaxed">
            Numbers refresh live and reflect current plan prices. Free users don&apos;t produce a payout;
            trial and canceled subscriptions count as free until they convert or churn.
          </p>
          <p className="text-xs font-mono text-[#b0b0b0] leading-relaxed">
            This link is your private stats dashboard — don&apos;t post it publicly. Payouts are reconciled
            monthly against Stripe.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatBlock({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          pointerEvents: "none",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
        }}
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#b0b0b0] mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-[#00ff88]" : "text-white"}`}>{value}</div>
    </div>
  )
}
