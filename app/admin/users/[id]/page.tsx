import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { resolveUserPlan } from "@/lib/plans"
import { StatCard, Card, PageTitle, nf, money, fmtDate, fmtDateTime, maskId } from "../../ui"

export const dynamic = "force-dynamic"

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  noStore()
  await requireAdmin()

  const { id } = await params

  // Explicit select — never expose password hashes, raw session/account tokens,
  // or auth secrets. Stripe IDs are masked at render time.
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      bio: true,
      image: true,
      emailVerified: true,
      onboarded: true,
      pageStatus: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionInterval: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripeAccountId: true,
      stripeAccountStatus: true,
      platformFeePercent: true,
      aiAgentEnabled: true,
      aiChatSessions: true,
      aiChatMessages: true,
      referralCode: true,
      referredBy: true,
      referralEarnings: true,
      _count: {
        select: {
          links: true,
          blocks: true,
          products: true,
          clicks: true,
          views: true,
          socialLinks: true,
        },
      },
    },
  })

  if (!user) notFound()

  // Purchases have no direct userId — they belong to the user's products.
  const [purchaseCount, recentLinks, recentProducts, recentPurchases] = await Promise.all([
    prisma.purchase.count({ where: { product: { userId: id } } }),
    prisma.link.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, url: true, enabled: true, createdAt: true },
    }),
    prisma.product.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, price: true, currency: true, enabled: true, createdAt: true },
    }),
    prisma.purchase.findMany({
      where: { product: { userId: id } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        buyerEmail: true,
        product: { select: { title: true } },
      },
    }),
  ])

  const plan = resolveUserPlan(user)
  const ends = user.trialEndsAt ?? user.subscriptionEndsAt ?? null

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/users" className="text-xs font-mono text-[#888] hover:text-white">
          ← Back to Users
        </Link>
      </div>

      <PageTitle
        title={user.username ? `@${user.username}` : "(no username)"}
        subtitle={`${user.email} · read-only`}
      />

      {/* Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <StatCard label="Links" value={nf(user._count.links)} />
        <StatCard label="Blocks" value={nf(user._count.blocks)} />
        <StatCard label="Products" value={nf(user._count.products)} />
        <StatCard label="Purchases" value={nf(purchaseCount)} />
        <StatCard label="Clicks" value={nf(user._count.clicks)} />
        <StatCard label="Views" value={nf(user._count.views)} />
        <StatCard label="Socials" value={nf(user._count.socialLinks)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6">
        <Card title="Profile">
          <dl className="space-y-2">
            <Row label="User ID" value={user.id} mono />
            <Row label="Name" value={user.name ?? "—"} />
            <Row label="Username" value={user.username ? `@${user.username}` : "—"} />
            <Row label="Email" value={user.email} />
            <Row label="Email verified" value={user.emailVerified ? "yes" : "no"} />
            <Row label="Onboarded" value={user.onboarded ? "yes" : "no"} />
            <Row label="Page status" value={user.pageStatus ?? "—"} />
            <Row label="Published at" value={fmtDateTime(user.publishedAt)} />
            <Row label="Bio" value={user.bio ? truncate(user.bio, 140) : "—"} />
            <Row label="Created" value={fmtDateTime(user.createdAt)} />
            <Row label="Updated" value={fmtDateTime(user.updatedAt)} />
          </dl>
        </Card>

        <Card title="Subscription & Stripe">
          <dl className="space-y-2">
            <Row label="Resolved plan" value={plan} />
            <Row label="Status" value={user.subscriptionStatus ?? "free"} />
            <Row label="Plan (raw)" value={user.subscriptionPlan ?? "—"} />
            <Row label="Interval" value={user.subscriptionInterval ?? "—"} />
            <Row label="Trial ends" value={fmtDate(user.trialEndsAt)} />
            <Row label="Sub ends" value={fmtDate(user.subscriptionEndsAt)} />
            <Row label="Ends (effective)" value={fmtDate(ends)} />
            <Row label="Stripe customer" value={maskId(user.stripeCustomerId)} mono />
            <Row label="Stripe subscription" value={maskId(user.stripeSubscriptionId)} mono />
            <Row label="Connect account" value={maskId(user.stripeAccountId)} mono />
            <Row label="Connect status" value={user.stripeAccountStatus ?? "—"} />
            <Row label="Platform fee %" value={user.platformFeePercent != null ? `${user.platformFeePercent}%` : "—"} />
          </dl>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6">
        <Card title="AI usage">
          <dl className="space-y-2">
            <Row label="Agent enabled" value={user.aiAgentEnabled ? "yes" : "no"} />
            <Row label="Chat sessions" value={nf(user.aiChatSessions)} />
            <Row label="Chat messages" value={nf(user.aiChatMessages)} />
          </dl>
        </Card>

        <Card title="Referral">
          <dl className="space-y-2">
            <Row label="Referral code" value={user.referralCode ?? "—"} mono />
            <Row label="Referred by" value={user.referredBy ?? "—"} mono />
            <Row label="Earnings (cents)" value={nf(user.referralEarnings)} />
          </dl>
        </Card>
      </div>

      <Card title="Recent links">
        {recentLinks.length === 0 ? (
          <Empty>No links.</Empty>
        ) : (
          <table className="w-full text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-[#555] text-left border-b border-white/[0.06]">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">URL</th>
                <th className="py-2 pr-4">Enabled</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentLinks.map((l) => (
                <tr key={l.id} className="border-b border-white/[0.04] text-[#d0d0d0]">
                  <td className="py-2 pr-4">{truncate(l.title, 40)}</td>
                  <td className="py-2 pr-4 text-[#888]">{truncate(l.url, 50)}</td>
                  <td className="py-2 pr-4">{l.enabled ? "✓" : <span className="text-[#666]">off</span>}</td>
                  <td className="py-2 pr-4">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Recent products">
        {recentProducts.length === 0 ? (
          <Empty>No products.</Empty>
        ) : (
          <table className="w-full text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-[#555] text-left border-b border-white/[0.06]">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4 text-right">Price</th>
                <th className="py-2 pr-4">Enabled</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.04] text-[#d0d0d0]">
                  <td className="py-2 pr-4">{truncate(p.title, 40)}</td>
                  <td className="py-2 pr-4 text-right">{money(p.price)}</td>
                  <td className="py-2 pr-4">{p.enabled ? "✓" : <span className="text-[#666]">off</span>}</td>
                  <td className="py-2 pr-4">{fmtDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Recent purchases">
        {recentPurchases.length === 0 ? (
          <Empty>No purchases.</Empty>
        ) : (
          <table className="w-full text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-[#555] text-left border-b border-white/[0.06]">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Buyer</th>
                <th className="py-2 pr-4 text-right">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPurchases.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.04] text-[#d0d0d0]">
                  <td className="py-2 pr-4">{truncate(p.product?.title ?? "—", 40)}</td>
                  <td className="py-2 pr-4 text-[#888]">{p.buyerEmail}</td>
                  <td className="py-2 pr-4 text-right">{money(p.amount)}</td>
                  <td className="py-2 pr-4">{p.status}</td>
                  <td className="py-2 pr-4">{fmtDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <dt className="font-mono text-[#666] flex-shrink-0">{label}</dt>
      <dd className={`text-right text-[#d0d0d0] break-all ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-mono text-[#555]">{children}</p>
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s
}
