import { unstable_noStore as noStore } from "next/cache"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Card, PageTitle, nf, fmtDate, fmtDateTime } from "../ui"
import { PromoCodeForm } from "./promo-code-form"
import { setPromoCodeActiveAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function PromoCodesPage() {
  noStore()
  await requireAdmin()

  const codes = await prisma.promoCode.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    include: { redemptions: { orderBy: { redeemedAt: "desc" } } },
  })

  // PromoRedemption.userId has no FK relation — resolve emails in one query.
  const userIds = [...new Set(codes.flatMap((c) => c.redemptions.map((r) => r.userId)))]
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, username: true },
      })
    : []
  const userById = new Map(users.map((u) => [u.id, u]))

  const now = new Date()

  return (
    <>
      <PageTitle
        title="Promo codes"
        subtitle="Self-serve plan unlocks. Redemptions are comped (excluded from MRR) and audit-logged in PlanGrantLog."
      />

      <Card title="Create a code">
        <PromoCodeForm />
      </Card>

      <Card title={`All codes (${nf(codes.length)})`}>
        {codes.length === 0 ? (
          <p className="text-xs font-mono text-[#c9c9d1] py-8 text-center">
            No promo codes yet. Create one above and share it — users redeem it in Settings or on
            the pricing page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="text-left text-[10px] uppercase tracking-widest text-[#b0b0b0] border-b border-white/[0.06]">
                <tr>
                  <Th>Code</Th>
                  <Th>Plan</Th>
                  <Th>Duration</Th>
                  <Th align="right">Redeemed</Th>
                  <Th>Code expiry</Th>
                  <Th>Note</Th>
                  <Th>Created</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const exhausted = c.maxRedemptions !== null && c.timesRedeemed >= c.maxRedemptions
                  const dateExpired = c.expiresAt !== null && now > c.expiresAt
                  return (
                    <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] align-top">
                      <Td>
                        <span className="text-white font-bold">{c.code}</span>
                        {c.redemptions.length > 0 ? (
                          <details className="mt-1.5">
                            <summary className="text-[#378add] cursor-pointer select-none text-[11px]">
                              View redemptions ({c.redemptions.length})
                            </summary>
                            <ul className="mt-1.5 space-y-1 text-[11px] text-[#c9c9d1]">
                              {c.redemptions.map((r) => {
                                const u = userById.get(r.userId)
                                return (
                                  <li key={r.id}>
                                    {u ? `@${u.username} · ${u.email}` : `user ${r.userId} (deleted)`}{" "}
                                    · {fmtDateTime(r.redeemedAt)} ·{" "}
                                    {r.expiresAt ? `until ${fmtDate(r.expiresAt)}` : "lifetime"}
                                  </li>
                                )
                              })}
                            </ul>
                          </details>
                        ) : null}
                      </Td>
                      <Td>
                        <span className="uppercase text-white">{c.plan}</span>
                      </Td>
                      <Td>{c.durationDays !== null ? `${c.durationDays}d` : "lifetime"}</Td>
                      <Td align="right">
                        <span className={exhausted ? "text-[#f59e0b]" : "text-[#00ff88]"}>
                          {nf(c.timesRedeemed)}
                        </span>
                        <span className="text-[#b0b0b0]"> / {c.maxRedemptions !== null ? nf(c.maxRedemptions) : "∞"}</span>
                      </Td>
                      <Td>
                        <span className={dateExpired ? "text-[#ff5555]" : undefined}>
                          {c.expiresAt ? fmtDate(c.expiresAt) : "—"}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[#c9c9d1] block max-w-[160px] truncate" title={c.note ?? undefined}>
                          {c.note ?? "—"}
                        </span>
                      </Td>
                      <Td>{fmtDate(c.createdAt)}</Td>
                      <Td>
                        {!c.active ? (
                          <span className="text-[#ff5555]">off</span>
                        ) : dateExpired ? (
                          <span className="text-[#f59e0b]">expired</span>
                        ) : exhausted ? (
                          <span className="text-[#f59e0b]">exhausted</span>
                        ) : (
                          <span className="text-[#00ff88]">active</span>
                        )}
                      </Td>
                      <Td>
                        <form action={setPromoCodeActiveAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="active" value={c.active ? "false" : "true"} />
                          <button
                            type="submit"
                            className={`rounded-md px-2.5 py-1 text-[11px] font-mono border cursor-pointer transition-colors ${
                              c.active
                                ? "text-[#ff5555] border-[#ff5555]/30 hover:bg-[#ff5555]/10"
                                : "text-[#00ff88] border-[#00ff88]/30 hover:bg-[#00ff88]/10"
                            }`}
                          >
                            {c.active ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] font-mono text-[#c9c9d1] mt-4">
          Deactivating stops future redemptions — users who already redeemed keep their plan until
          it expires. History is never deleted.
        </p>
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
