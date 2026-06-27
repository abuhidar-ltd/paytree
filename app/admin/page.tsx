import { unstable_noStore as noStore } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { resolveUserPlan, PLANS, type PlanId } from "@/lib/plans"
import { StatCard, Card, PageTitle, nf, pct, money } from "./ui"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  noStore()
  await requireAdmin()

  const now = Date.now()
  const since24 = new Date(now - 24 * 60 * 60 * 1000)
  const since7 = new Date(now - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers, new24, new7, onboarded, published,
    links, blocks, clicks, views, ai,
    activeUsers, tokensTotal, connectActive,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since24 } } }),
    prisma.user.count({ where: { createdAt: { gte: since7 } } }),
    prisma.user.count({ where: { onboarded: true } }),
    prisma.user.count({ where: { pageStatus: "published" } }),
    prisma.link.count(),
    prisma.block.count(),
    prisma.click.count(),
    prisma.view.count(),
    prisma.user.aggregate({ _sum: { aiChatMessages: true, aiChatSessions: true } }),
    prisma.user.findMany({
      where: { subscriptionStatus: { in: ["active", "trial", "canceling"] } },
      select: {
        subscriptionStatus: true, subscriptionPlan: true, subscriptionInterval: true,
        trialEndsAt: true, subscriptionEndsAt: true,
      },
    }),
    prisma.linkUnlockToken.count(),
    prisma.user.count({ where: { stripeAccountStatus: "active" } }),
  ])

  // Derive plan breakdown + MRR estimate (trials excluded from MRR).
  const planCounts: Record<PlanId, number> = { free: 0, pro: 0, ultra: 0 }
  let trialing = 0
  let mrrCents = 0
  for (const u of activeUsers) {
    const plan = resolveUserPlan(u)
    if (plan === "free") continue
    planCounts[plan]++
    if (u.subscriptionStatus === "trial") {
      trialing++
      continue
    }
    mrrCents += u.subscriptionInterval === "yearly" ? Math.round(PLANS[plan].yearly / 12) : PLANS[plan].monthly
  }
  const activePaid = planCounts.pro + planCounts.ultra

  return (
    <>
      <PageTitle title="Overview" subtitle="Read-only snapshot from the database. Event-level funnel rates live in Vercel Analytics." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total users" value={nf(totalUsers)} sub={`+${nf(new24)} (24h) · +${nf(new7)} (7d)`} />
        <StatCard label="Onboarded" value={nf(onboarded)} sub={`${pct(onboarded, totalUsers)} of users`} />
        <StatCard label="Published pages" value={nf(published)} sub={`${pct(published, totalUsers)} of users`} />
        <StatCard label="Paid + trial" value={nf(activePaid)} sub={`${nf(trialing)} on trial`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="MRR estimate" value={money(mrrCents)} sub="excl. trials · Stripe is source of truth" />
        <StatCard label="Pro / Ultra" value={`${nf(planCounts.pro)} / ${nf(planCounts.ultra)}`} sub="active + trial" />
        <StatCard label="Stripe Connect" value={nf(connectActive)} sub="accounts active" />
        <StatCard label="Vault codes" value={nf(tokensTotal)} sub="unlock tokens created" />
      </div>

      <Card title="Content & engagement">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Links" value={nf(links)} />
          <StatCard label="Blocks" value={nf(blocks)} />
          <StatCard label="Total clicks" value={nf(clicks)} />
          <StatCard label="Page views" value={nf(views)} />
          <StatCard label="AI sessions" value={nf(ai._sum.aiChatSessions ?? 0)} />
          <StatCard label="AI messages" value={nf(ai._sum.aiChatMessages ?? 0)} />
        </div>
      </Card>
    </>
  )
}
