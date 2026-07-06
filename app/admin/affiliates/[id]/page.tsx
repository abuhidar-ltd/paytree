import Link from "next/link"
import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import {
  computeAffiliateStats,
  referralPath,
  statsPath,
} from "@/lib/affiliate-server"
import { Card, PageTitle, StatCard, money, nf, fmtDate, fmtDateTime } from "../../ui"
import {
  EditAffiliateForm,
  RegenerateSlugForm,
  CopyLinkRow,
} from "../affiliate-forms"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function AffiliateDetailPage({ params, searchParams }: Props) {
  noStore()
  await requireAdmin()

  const { id } = await params
  const { created } = await searchParams

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
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
      auditLogs: {
        orderBy: { performedAt: "desc" },
        take: 20,
      },
    },
  })
  if (!affiliate) notFound()

  const commission = Number(affiliate.commissionPercent)
  const stats = computeAffiliateStats(affiliate.users, commission)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"
  const referralUrl = `${baseUrl}${referralPath(affiliate.slug)}`
  const statsUrl = `${baseUrl}${statsPath(affiliate.statsToken)}`

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/affiliates" className="text-xs font-mono text-[#c9c9d1] hover:text-white">
          ← Affiliates
        </Link>
      </div>
      <PageTitle
        title={affiliate.name}
        subtitle={`Created ${fmtDate(affiliate.createdAt)} · Status: ${affiliate.active ? "active" : "paused"}`}
      />

      {created ? (
        <p className="text-xs font-mono text-[#00ff88] mb-4">
          ✓ Affiliate created — share the referral link with the partner and keep the stats link private.
        </p>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Referred users" value={nf(stats.total)} />
        <StatCard label="Paid / Free" value={`${nf(stats.paid)} / ${nf(stats.free)}`} />
        <StatCard label="Commission" value={`${commission.toFixed(2)}%`} />
        <StatCard label="Est. monthly payout" value={money(stats.monthlyCommissionCents)} sub="MRR × commission %" />
      </div>

      <Card title="Two links (share the right one)">
        <div className="grid gap-4">
          <CopyLinkRow label="Public referral link — give this to the partner" url={referralUrl} />
          <CopyLinkRow label="Private stats link — partner opens to check their numbers" url={statsUrl} />
          <p className="text-[11px] font-mono text-[#b0b0b0] leading-relaxed">
            The referral link tracks new signups. The stats link shows aggregate numbers without any user PII.
            The stats token is <span className="text-[#f0f0f0]">never editable</span> — that would silently break the partner&apos;s saved link.
          </p>
        </div>
      </Card>

      <Card title="Edit">
        <EditAffiliateForm
          id={affiliate.id}
          initialCommission={commission}
          initialActive={affiliate.active}
        />
      </Card>

      <Card title="Change slug (destructive)">
        <RegenerateSlugForm id={affiliate.id} currentSlug={affiliate.slug} />
      </Card>

      <Card title="Audit log">
        {affiliate.auditLogs.length === 0 ? (
          <p className="text-xs font-mono text-[#b0b0b0]">No entries yet.</p>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className="text-left text-[10px] uppercase tracking-widest text-[#b0b0b0] border-b border-white/[0.06]">
              <tr>
                <th className="py-2 pr-2 font-normal">When</th>
                <th className="py-2 pr-2 font-normal">Action</th>
                <th className="py-2 pr-2 font-normal">By</th>
                <th className="py-2 font-normal">Changes</th>
              </tr>
            </thead>
            <tbody>
              {affiliate.auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-white/[0.04] align-top">
                  <td className="py-2 pr-2 text-[#c9c9d1]">{fmtDateTime(log.performedAt)}</td>
                  <td className="py-2 pr-2 text-white">{log.action}</td>
                  <td className="py-2 pr-2 text-[#c9c9d1] truncate max-w-[220px]">{log.performedBy}</td>
                  <td className="py-2 text-[#b0b0b0] break-all">
                    {log.changes ? (
                      <code className="text-[10px]">{JSON.stringify(log.changes)}</code>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}
