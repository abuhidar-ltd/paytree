import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { resolveUserPlan, PLANS, type PlanId } from "@/lib/plans"
import { StatCard, Card, PageTitle, nf, money, fmtDate } from "../ui"

export const dynamic = "force-dynamic"

export default async function AdminSubscriptionsPage() {
  noStore()
  await requireAdmin()

  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  const [statusGroups, connectGroups, trialsEndingSoon, subUsers, recent] = await Promise.all([
    prisma.user.groupBy({ by: ["subscriptionStatus"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["stripeAccountStatus"], _count: { _all: true } }),
    prisma.user.count({ where: { subscriptionStatus: "trial", trialEndsAt: { lte: soon } } }),
    prisma.user.findMany({
      where: { subscriptionStatus: { in: ["active", "trial", "canceling"] } },
      select: {
        subscriptionStatus: true, subscriptionPlan: true, subscriptionInterval: true,
        trialEndsAt: true, subscriptionEndsAt: true,
      },
    }),
    prisma.user.findMany({
      where: { subscriptionStatus: { in: ["active", "trial", "canceling"] } },
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: {
        username: true, subscriptionStatus: true, subscriptionPlan: true,
        subscriptionInterval: true, trialEndsAt: true, subscriptionEndsAt: true,
      },
    }),
  ])

  // Plan + interval breakdown + MRR (trials excluded from MRR).
  const planCounts: Record<PlanId, number> = { free: 0, pro: 0, ultra: 0 }
  let monthly = 0
  let yearly = 0
  let mrrCents = 0
  for (const u of subUsers) {
    const plan = resolveUserPlan(u)
    if (plan === "free") continue
    planCounts[plan]++
    if (u.subscriptionInterval === "yearly") yearly++
    else monthly++
    if (u.subscriptionStatus === "trial") continue
    mrrCents += u.subscriptionInterval === "yearly" ? Math.round(PLANS[plan].yearly / 12) : PLANS[plan].monthly
  }

  return (
    <>
      <PageTitle title="Subscriptions" subtitle="Read-only. MRR is an estimate — Stripe is the source of truth." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="MRR estimate" value={money(mrrCents)} sub="excl. trials" />
        <StatCard label="Pro / Ultra" value={`${nf(planCounts.pro)} / ${nf(planCounts.ultra)}`} sub="active + trial" />
        <StatCard label="Monthly / Yearly" value={`${nf(monthly)} / ${nf(yearly)}`} sub="billing interval" />
        <StatCard label="Trials ending ≤3d" value={nf(trialsEndingSoon)} />
      </div>

      <Card title="By subscription status">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusGroups.map((g) => (
            <StatCard
              key={g.subscriptionStatus ?? "null"}
              label={g.subscriptionStatus ?? "free / none"}
              value={nf(g._count._all)}
            />
          ))}
        </div>
      </Card>

      <Card title="Stripe Connect status">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {connectGroups.map((g) => (
            <StatCard
              key={g.stripeAccountStatus ?? "null"}
              label={g.stripeAccountStatus ?? "not connected"}
              value={nf(g._count._all)}
            />
          ))}
        </div>
      </Card>

      <Card title="Recent subscribers">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-[#555] text-left border-b border-white/[0.06]">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Interval</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Ends</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((u, i) => (
                <tr key={i} className="border-b border-white/[0.04] text-[#d0d0d0]">
                  <td className="py-2 pr-4">
                    {u.username ? (
                      <Link href={`/${u.username}`} target="_blank" className="text-[#00ff88] hover:underline">
                        @{u.username}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="py-2 pr-4">{resolveUserPlan(u)}</td>
                  <td className="py-2 pr-4">{u.subscriptionInterval ?? "—"}</td>
                  <td className="py-2 pr-4">{u.subscriptionStatus ?? "—"}</td>
                  <td className="py-2 pr-4">{fmtDate(u.trialEndsAt ?? u.subscriptionEndsAt ?? null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
