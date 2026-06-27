import { unstable_noStore as noStore } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { Card, PageTitle, nf } from "../ui"

export const dynamic = "force-dynamic"

// Presence-only config check — never render secret VALUES, only whether each
// env var is set.
const ENV_KEYS: { key: string; label: string }[] = [
  { key: "DATABASE_URL", label: "Database" },
  { key: "BETTER_AUTH_SECRET", label: "Auth secret" },
  { key: "NEXT_PUBLIC_APP_URL", label: "App URL" },
  { key: "STRIPE_SECRET_KEY", label: "Stripe secret" },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook secret" },
  { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", label: "Stripe publishable" },
  { key: "RESEND_API_KEY", label: "Resend" },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic" },
  { key: "BLOB_READ_WRITE_TOKEN", label: "Vercel Blob" },
  { key: "CRON_SECRET", label: "Cron secret" },
  { key: "HEALTH_CHECK_SECRET", label: "Health secret" },
  { key: "ADMIN_EMAILS", label: "Admin allowlist" },
]

export default async function AdminHealthPage() {
  noStore()
  await requireAdmin()

  let dbOk = true
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbOk = false
  }

  // Subscription-consistency proxies (stand-in for webhook monitoring, which is
  // not persisted in V1).
  const [stripeIdButFree, activeNoStripeId, activeNotPublished] = await Promise.all([
    prisma.user.count({
      where: { stripeSubscriptionId: { not: null }, subscriptionStatus: { in: ["free"] } },
    }),
    prisma.user.count({
      where: { subscriptionStatus: "active", stripeSubscriptionId: null },
    }),
    prisma.user.count({
      where: { subscriptionStatus: { in: ["active", "trial"] }, pageStatus: { not: "published" } },
    }),
  ])

  return (
    <>
      <PageTitle title="Health & config" subtitle="Read-only. Presence of secrets only — values are never shown." />

      <Card title="Configuration (env presence)">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ENV_KEYS.map(({ key, label }) => {
            const set = !!process.env[key]
            return (
              <div key={key} className="flex items-center justify-between text-xs font-mono border border-white/[0.06] rounded-lg px-3 py-2">
                <span className="text-[#888]">{label}</span>
                <span className={set ? "text-[#00ff88]" : "text-[#f59e0b]"}>{set ? "set" : "missing"}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Database">
        <div className="text-xs font-mono">
          <span className="text-[#888]">Connectivity: </span>
          <span className={dbOk ? "text-[#00ff88]" : "text-red-400"}>{dbOk ? "connected" : "error"}</span>
        </div>
      </Card>

      <Card title="Subscription consistency (webhook proxies)">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="text-xs font-mono border border-white/[0.06] rounded-lg px-3 py-3">
            <div className="text-2xl font-bold text-white">{nf(stripeIdButFree)}</div>
            <div className="text-[#888] mt-1">Has Stripe sub ID but status &ldquo;free&rdquo;</div>
          </div>
          <div className="text-xs font-mono border border-white/[0.06] rounded-lg px-3 py-3">
            <div className="text-2xl font-bold text-white">{nf(activeNoStripeId)}</div>
            <div className="text-[#888] mt-1">Active but no Stripe sub ID</div>
          </div>
          <div className="text-xs font-mono border border-white/[0.06] rounded-lg px-3 py-3">
            <div className="text-2xl font-bold text-white">{nf(activeNotPublished)}</div>
            <div className="text-[#888] mt-1">Paid/trial but page not published</div>
          </div>
        </div>
        <p className="text-[11px] font-mono text-[#555] mt-4">
          Non-zero values can indicate Stripe webhook drift. A dedicated webhook event log
          (V2) would make this authoritative — for now check the Stripe Dashboard and Vercel
          function logs for <span className="text-[#888]">/api/stripe/webhook</span>.
        </p>
      </Card>
    </>
  )
}
