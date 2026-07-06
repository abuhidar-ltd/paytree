import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { computeAffiliateStats } from "@/lib/affiliate-server"
import { Card, PageTitle, money, nf, fmtDate } from "../ui"

export const dynamic = "force-dynamic"

export default async function AffiliatesPage() {
  noStore()
  await requireAdmin()

  const affiliates = await prisma.affiliate.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
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

  const rows = affiliates.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    active: a.active,
    commission: Number(a.commissionPercent),
    createdAt: a.createdAt,
    stats: computeAffiliateStats(a.users, Number(a.commissionPercent)),
  }))

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageTitle
          title="Affiliates"
          subtitle="Partner referral tracking. Each row's payout is CURRENT MRR × commission %."
        />
        <Link
          href="/admin/affiliates/new"
          className="rounded-lg px-4 py-2 text-xs font-mono font-bold text-black bg-[#00ff88] hover:brightness-110 transition-all"
        >
          + New affiliate
        </Link>
      </div>

      <Card>
        {rows.length === 0 ? (
          <p className="text-xs font-mono text-[#c9c9d1] py-8 text-center">
            No affiliates yet. Create one to hand out a referral link.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="text-left text-[10px] uppercase tracking-widest text-[#b0b0b0] border-b border-white/[0.06]">
                <tr>
                  <Th>Name</Th>
                  <Th>Slug</Th>
                  <Th align="right">Commission</Th>
                  <Th align="right">Referred</Th>
                  <Th align="right">Paid / Free</Th>
                  <Th align="right">Est. monthly payout</Th>
                  <Th>Created</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <Td>
                      <Link href={`/admin/affiliates/${r.id}`} className="text-white hover:text-[#00ff88]">
                        {r.name}
                      </Link>
                    </Td>
                    <Td>
                      <span className="text-[#c9c9d1]">/?ref={r.slug}</span>
                    </Td>
                    <Td align="right">{r.commission.toFixed(2)}%</Td>
                    <Td align="right">{nf(r.stats.total)}</Td>
                    <Td align="right">
                      <span className="text-[#00ff88]">{nf(r.stats.paid)}</span>
                      <span className="text-[#b0b0b0]"> / {nf(r.stats.free)}</span>
                    </Td>
                    <Td align="right">{money(r.stats.monthlyCommissionCents)}</Td>
                    <Td>{fmtDate(r.createdAt)}</Td>
                    <Td>
                      {r.active ? (
                        <span className="text-[#00ff88]">active</span>
                      ) : (
                        <span className="text-[#f59e0b]">paused</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <th className={`py-2 px-2 ${align === "right" ? "text-right" : "text-left"} font-normal`}>{children}</th>
}
function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <td className={`py-2.5 px-2 ${align === "right" ? "text-right" : "text-left"}`}>{children}</td>
}
