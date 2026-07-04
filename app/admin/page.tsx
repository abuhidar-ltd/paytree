import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { resolveUserPlan, PLANS, type PlanId } from "@/lib/plans"
import { StatCard, Card, PageTitle, nf, pct, money } from "./ui"
import { BarsChart, DonutChart } from "./charts"

export const dynamic = "force-dynamic"

// ─── Time ranges ─────────────────────────────────────────────────────────────

type RangeId = "24h" | "7d" | "30d"

const RANGES: { id: RangeId; label: string; ms: number }[] = [
  { id: "24h", label: "24h", ms: 24 * 60 * 60 * 1000 },
  { id: "7d", label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "30d", label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
]

function parseRange(raw: string | undefined): RangeId {
  return raw === "24h" || raw === "30d" ? raw : "7d"
}

// Bucket timestamps for the signups chart — hourly for 24h, daily otherwise.
// UTC on purpose: matches the DB and Vercel logs, and never shifts on deploy.
function bucketLabel(d: Date, range: RangeId): string {
  if (range === "24h") return `${String(d.getUTCHours()).padStart(2, "0")}:00`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

function bucketSeries(dates: Date[], since: Date, range: RangeId): { label: string; count: number }[] {
  const stepMs = range === "24h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  const buckets: { label: string; count: number }[] = []
  const index = new Map<string, number>()
  for (let t = since.getTime(); t <= Date.now(); t += stepMs) {
    const label = bucketLabel(new Date(t), range)
    index.set(label, buckets.length)
    buckets.push({ label, count: 0 })
  }
  for (const d of dates) {
    const i = index.get(bucketLabel(d, range))
    if (i !== undefined) buckets[i].count++
  }
  return buckets
}

// Referrer → hostname, dropping our own domains (internal navigation).
function referrerHost(ref: string): string | null {
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "")
    if (!host || host === "paytree.to" || host === "localhost") return null
    return host
  } catch {
    return null
  }
}

const HYDRATION_BUCKETS = [
  { label: "<1s", max: 1000 },
  { label: "1–2.5s", max: 2500 },
  { label: "2.5–5s", max: 5000 },
  { label: "5–10s", max: 10000 },
  { label: ">10s", max: Infinity },
]

function quantile(sorted: number[], q: number): number | null {
  if (sorted.length === 0) return null
  const i = Math.min(sorted.length - 1, Math.floor(q * sorted.length))
  return sorted[i]
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  noStore()
  await requireAdmin()

  const range = parseRange((await searchParams).range)
  const since = new Date(Date.now() - RANGES.find((r) => r.id === range)!.ms)

  const [
    totalUsers,
    cohort,
    publishedInRange,
    planUsers,
    visitTotal,
    visitBots,
    countryGroups,
    referrerGroups,
    clickIdVisits,
    hydrationRows,
    telemetryGroups,
    connectActive,
  ] = await Promise.all([
    prisma.user.count(),
    // Users created in range — drives new-signup count, chart, and the funnel.
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        onboarded: true,
        onboardingOutcome: true,
        pageStatus: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        isComped: true,
      },
    }),
    prisma.user.count({ where: { publishedAt: { gte: since } } }),
    // Everyone with a live-ish subscription row — plan distribution + MRR.
    prisma.user.findMany({
      where: { subscriptionStatus: { in: ["active", "trial", "canceling"] } },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionInterval: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        isComped: true,
        compedExpiresAt: true,
      },
    }),
    prisma.visit.count({ where: { createdAt: { gte: since } } }),
    prisma.visit.count({ where: { createdAt: { gte: since }, bot: true } }),
    prisma.visit.groupBy({
      by: ["country"],
      where: { createdAt: { gte: since }, bot: false, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.visit.groupBy({
      by: ["referrer"],
      where: { createdAt: { gte: since }, bot: false, referrer: { not: null } },
      _count: { _all: true },
    }),
    prisma.visit.count({
      where: { createdAt: { gte: since }, bot: false, clickIds: { not: null } },
    }),
    prisma.signupTelemetry.findMany({
      where: { event: "hydrated", createdAt: { gte: since }, ms: { not: null } },
      select: { ms: true },
    }),
    prisma.signupTelemetry.groupBy({
      by: ["event", "step", "ok"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.user.count({ where: { stripeAccountStatus: "active" } }),
  ])

  // Key metrics from the cohort.
  const newSignups = cohort.length
  const onbSkipped = cohort.filter((u) => u.onboardingOutcome === "skipped").length
  const onbCompleted = cohort.filter((u) => u.onboarded && u.onboardingOutcome !== "skipped").length
  const onbAbandoned = newSignups - onbSkipped - onbCompleted

  // Funnel: what the cohort did after signing up. "Upgraded" means REAL money —
  // a Stripe subscription — never a comp.
  const cohortOnboarded = cohort.filter((u) => u.onboarded).length
  const cohortPublished = cohort.filter((u) => u.pageStatus === "published").length
  const cohortUpgraded = cohort.filter(
    (u) =>
      u.stripeSubscriptionId &&
      ["active", "trial", "canceling"].includes(u.subscriptionStatus ?? "")
  ).length
  const funnel = [
    { label: "create_account", value: newSignups },
    { label: "complete_onboarding", value: cohortOnboarded },
    { label: "publish_page", value: cohortPublished },
    { label: "complete_upgrade (paid)", value: cohortUpgraded },
  ]

  // Plan distribution + MRR. Comped users are their own slice and are ALWAYS
  // excluded from MRR — they don't pay. Trials excluded from MRR as before.
  const paying: Record<Exclude<PlanId, "free">, number> = { pro: 0, ultra: 0 }
  let comped = 0
  let trialing = 0
  let mrrCents = 0
  for (const u of planUsers) {
    const plan = resolveUserPlan(u)
    if (plan === "free") continue // expired comps resolve free
    if (u.isComped) {
      comped++
      continue
    }
    paying[plan]++
    if (u.subscriptionStatus === "trial") {
      trialing++
      continue
    }
    mrrCents += u.subscriptionInterval === "yearly" ? Math.round(PLANS[plan].yearly / 12) : PLANS[plan].monthly
  }
  const freeUsers = totalUsers - paying.pro - paying.ultra - comped
  const planDonut = [
    { name: "Free", value: freeUsers, color: "#6b6b6b" },
    { name: "Pro", value: paying.pro, color: "#378add" },
    { name: "Ultra", value: paying.ultra, color: "#9146ff" },
    { name: "Comped", value: comped, color: "#f59e0b" },
  ].filter((d) => d.value > 0)

  // Traffic quality (bot=false only).
  const visitHumans = visitTotal - visitBots
  const referrerCounts = new Map<string, number>()
  for (const g of referrerGroups) {
    const host = g.referrer ? referrerHost(g.referrer) : null
    if (!host) continue
    referrerCounts.set(host, (referrerCounts.get(host) ?? 0) + g._count._all)
  }
  const topReferrers = [...referrerCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Signup health.
  const hydrationMs = hydrationRows
    .map((r) => r.ms)
    .filter((ms): ms is number => ms !== null)
    .sort((a, b) => a - b)
  const hydrationBuckets = HYDRATION_BUCKETS.map((b, i) => ({
    label: b.label,
    count: hydrationMs.filter((ms) => ms < b.max && (i === 0 || ms >= HYDRATION_BUCKETS[i - 1].max)).length,
  }))
  const p50 = quantile(hydrationMs, 0.5)
  const p90 = quantile(hydrationMs, 0.9)

  const tCount = (event: string, step?: string, ok?: boolean) =>
    telemetryGroups
      .filter(
        (g) =>
          g.event === event &&
          (step === undefined || g.step === step) &&
          (ok === undefined || g.ok === ok)
      )
      .reduce((sum, g) => sum + g._count._all, 0)
  const signupSteps = [
    { label: "form hydrated", value: tCount("hydrated") },
    { label: "name done", value: tCount("step_done", "name") },
    { label: "email done", value: tCount("step_done", "email") },
    { label: "submitted", value: tCount("submit") },
    { label: "succeeded", value: tCount("submit_result", undefined, true) },
  ]
  const submitFailed = tCount("submit_result", undefined, false)

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle
          title="Overview"
          subtitle="Own-database analytics. MRR is an estimate — Stripe is the source of truth for money."
        />
        {/* Range toggle — plain links, server-rendered */}
        <div className="flex gap-1 rounded-lg border border-white/[0.08] p-1">
          {RANGES.map((r) => (
            <Link
              key={r.id}
              href={`/admin?range=${r.id}`}
              className={`text-xs font-mono rounded-md px-3 py-1.5 transition-colors ${
                r.id === range
                  ? "bg-[#00ff88] text-black font-bold"
                  : "text-[#888] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label={`New signups (${range})`} value={nf(newSignups)} sub={`${nf(totalUsers)} users total`} />
        <StatCard
          label="Onboarding"
          value={pct(onbCompleted, newSignups)}
          sub={`${nf(onbCompleted)} done · ${nf(onbSkipped)} skipped · ${nf(onbAbandoned)} abandoned`}
        />
        <StatCard label={`Published (${range})`} value={nf(publishedInRange)} sub="pages went live in range" />
        <StatCard
          label="Estimated MRR"
          value={money(mrrCents)}
          sub={`excl. ${nf(comped)} comped + ${nf(trialing)} trialing`}
        />
      </div>

      <Card title={`Signups per ${range === "24h" ? "hour" : "day"}`}>
        <BarsChart data={bucketSeries(cohort.map((u) => u.createdAt), since, range)} />
      </Card>

      <Card title="Plan distribution (current, all users)">
        {planDonut.length === 0 ? (
          <p className="text-xs font-mono text-[#555]">No users yet.</p>
        ) : (
          <DonutChart data={planDonut} />
        )}
        <p className="text-[11px] font-mono text-[#555] mt-3">
          Comped = admin-granted plans (excluded from MRR). {nf(connectActive)} users have Stripe Connect active.
        </p>
      </Card>

      <Card title={`Signup → upgrade funnel (accounts created in the last ${range})`}>
        <FunnelBars steps={funnel} />
        <p className="text-[11px] font-mono text-[#555] mt-4">
          DB-state cohort funnel: each step counts users from this range&rsquo;s signups who reached
          that state. &ldquo;Upgraded&rdquo; = live Stripe subscription — comps never count.
        </p>
      </Card>

      <Card title="Traffic quality (landing pages: / · /register · /login)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Visits" value={nf(visitTotal)} sub={`last ${range}`} />
          <StatCard label="Human" value={nf(visitHumans)} sub={pct(visitHumans, visitTotal)} />
          <StatCard label="Bots" value={nf(visitBots)} sub={pct(visitBots, visitTotal)} />
          <StatCard label="From paid ads" value={nf(clickIdVisits)} sub="human visits w/ click IDs" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <TopList
            title="Top countries (human)"
            rows={countryGroups.map((g) => [g.country ?? "?", g._count._all] as const)}
            total={visitHumans}
          />
          <TopList title="Top referrers (human)" rows={topReferrers} total={visitHumans} />
        </div>
        {visitTotal === 0 ? (
          <p className="text-[11px] font-mono text-[#f59e0b] mt-4">
            No Visit rows yet — collection starts with the first deploy of this feature. Until then
            this section stays empty (the old [visit] console lines were never persisted).
          </p>
        ) : null}
      </Card>

      <Card title="Signup health (client telemetry)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#666] mb-3">
              Hydration time on /register
              {p50 !== null ? (
                <span className="text-[#00ff88] normal-case tracking-normal ml-2">
                  p50 {(p50 / 1000).toFixed(1)}s · p90 {p90 !== null ? (p90 / 1000).toFixed(1) : "—"}s
                </span>
              ) : null}
            </h3>
            {hydrationMs.length === 0 ? (
              <p className="text-xs font-mono text-[#555]">
                No hydration beacons persisted yet — collection starts with this deploy.
              </p>
            ) : (
              <BarsChart data={hydrationBuckets} color="#378add" height={150} />
            )}
          </div>
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#666] mb-3">
              Signup step funnel (event counts)
              {submitFailed > 0 ? (
                <span className="text-[#ff5555] normal-case tracking-normal ml-2">{nf(submitFailed)} failed submits</span>
              ) : null}
            </h3>
            <FunnelBars steps={signupSteps} />
          </div>
        </div>
        <p className="text-[11px] font-mono text-[#555] mt-4">
          Raw beacon counts, not unique sessions — retries and multi-attempt users count more than
          once. The slow-hydration tail is the class of failure behind the July 4 signup outage.
        </p>
      </Card>
    </>
  )
}

// ─── Presentational bits (server) ────────────────────────────────────────────

function FunnelBars({ steps }: { steps: { label: string; value: number }[] }) {
  const first = steps[0]?.value ?? 0
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const prev = i === 0 ? s.value : steps[i - 1].value
        const width = first ? Math.max(2, (s.value / first) * 100) : 0
        const drop = i > 0 && prev > 0 ? prev - s.value : 0
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-[#d0d0d0]">{s.label}</span>
              <span className="text-[#888]">
                {nf(s.value)}
                {i > 0 ? (
                  <>
                    <span className="text-[#555]"> · {pct(s.value, prev)} of prev</span>
                    {drop > 0 ? <span className="text-[#ff5555]"> · −{nf(drop)}</span> : null}
                  </>
                ) : null}
              </span>
            </div>
            <div className="h-2.5 rounded-md overflow-hidden bg-white/[0.04]">
              <div
                className="h-full rounded-md"
                style={{ width: `${width}%`, background: "rgba(0,255,136,0.35)" }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TopList({
  title,
  rows,
  total,
}: {
  title: string
  rows: readonly (readonly [string, number])[]
  total: number
}) {
  return (
    <div>
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#666] mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs font-mono text-[#555]">No data in range.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map(([label, count]) => (
            <li key={label} className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#d0d0d0] truncate mr-3">{label}</span>
              <span className="text-[#555] flex-shrink-0">
                {nf(count)} · {pct(count, total)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
