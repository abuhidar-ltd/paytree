import { unstable_noStore as noStore } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { Card, PageTitle, nf, pct } from "../ui"

export const dynamic = "force-dynamic"

// The click-event funnel (homepage_view → … → dashboard_first_visit) is sent to
// Vercel Analytics, not the database, so it cannot be queried here. This page
// shows the DB *state* funnel and points to Vercel Analytics for event rates.
const EVENT_FUNNEL = [
  "view_home",
  "click_cta",
  "view_signup",
  "submit_signup",
  "create_account",
  "start_onboarding",
  "complete_onboarding",
  "first_dashboard",
]

export default async function AdminFunnelPage() {
  noStore()
  await requireAdmin()

  const [total, onboarded, activated, published, paid] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboarded: true } }),
    prisma.user.count({
      where: { OR: [{ blocks: { some: {} } }, { links: { some: {} } }] },
    }),
    prisma.user.count({ where: { pageStatus: "published" } }),
    prisma.user.count({ where: { subscriptionStatus: { in: ["active", "trial", "canceling"] } } }),
  ])

  const steps = [
    { label: "Signed up (users)", value: total },
    { label: "Onboarded", value: onboarded },
    { label: "Activated (has a link/block)", value: activated },
    { label: "Published page", value: published },
    { label: "Paid or trial", value: paid },
  ]

  return (
    <>
      <PageTitle title="Funnel" subtitle="Database state-funnel. Event rates (per click) live in Vercel Analytics." />

      <Card title="State funnel (DB-derived)">
        <div className="space-y-3">
          {steps.map((s, i) => {
            const prev = i === 0 ? s.value : steps[i - 1].value
            const widthPct = total ? Math.max(2, (s.value / total) * 100) : 0
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-[#d0d0d0]">{s.label}</span>
                  <span className="text-[#c9c9d1]">
                    {nf(s.value)} · {pct(s.value, total)} of all
                    {i > 0 ? <span className="text-[#c9c9d1]"> · {pct(s.value, prev)} step</span> : null}
                  </span>
                </div>
                <div className="h-2.5 rounded-md overflow-hidden bg-white/[0.04]">
                  <div
                    className="h-full rounded-md"
                    style={{ width: `${widthPct}%`, background: "rgba(0,255,136,0.35)" }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] font-mono text-[#c9c9d1] mt-4">
          &ldquo;Activated&rdquo; is a DB proxy (user created at least one link or block). True
          dashboard-visit activation is an event in Vercel Analytics.
        </p>
      </Card>

      <Card title="Event funnel (Vercel Analytics)">
        <p className="text-xs font-mono text-[#c9c9d1] mb-3">
          These per-step conversion rates are not stored in the database. View them in Vercel
          Analytics → Events:
        </p>
        <ol className="text-xs font-mono text-[#d0d0d0] space-y-1 list-decimal list-inside">
          {EVENT_FUNNEL.map((e) => (
            <li key={e}>
              <span className="text-[#00ff88]">{e}</span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  )
}
