import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { resolveUserPlan } from "@/lib/plans"
import { Card, PageTitle, nf, fmtDate } from "../ui"

export const dynamic = "force-dynamic"

// V1 is server-rendered with no pagination (fine for current volume). A capped
// take keeps the page bounded if the table grows unexpectedly.
const MAX_ROWS = 500

export default async function AdminUsersPage() {
  noStore()
  await requireAdmin()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    // Explicit select — never expose password hashes, tokens, or secrets.
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      emailVerified: true,
      onboarded: true,
      pageStatus: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionInterval: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      stripeAccountStatus: true,
      aiChatMessages: true,
      updatedAt: true,
      _count: { select: { links: true, blocks: true, clicks: true } },
    },
  })

  return (
    <>
      <PageTitle
        title="Users"
        subtitle={`${nf(users.length)} most recent${users.length >= MAX_ROWS ? ` (capped at ${MAX_ROWS})` : ""} · read-only`}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-[#555] text-left border-b border-white/[0.06]">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2 pr-4">Verified</th>
                <th className="py-2 pr-4">Onboarded</th>
                <th className="py-2 pr-4">Page</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Ends</th>
                <th className="py-2 pr-4">Connect</th>
                <th className="py-2 pr-4 text-right">Links</th>
                <th className="py-2 pr-4 text-right">Blocks</th>
                <th className="py-2 pr-4 text-right">Clicks</th>
                <th className="py-2 pr-4 text-right">AI msgs</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const plan = resolveUserPlan(u)
                const ends = u.trialEndsAt ?? u.subscriptionEndsAt ?? null
                return (
                  <tr key={u.id} className="border-b border-white/[0.04] text-[#d0d0d0]">
                    <td className="py-2 pr-4">
                      {u.username ? (
                        <Link href={`/${u.username}`} target="_blank" className="text-[#00ff88] hover:underline">
                          @{u.username}
                        </Link>
                      ) : (
                        <span className="text-[#666]">—</span>
                      )}
                      <div className="text-[#555]">{u.email}</div>
                    </td>
                    <td className="py-2 pr-4">{fmtDate(u.createdAt)}</td>
                    <td className="py-2 pr-4">{u.emailVerified ? "✓" : <span className="text-[#f59e0b]">no</span>}</td>
                    <td className="py-2 pr-4">{u.onboarded ? "✓" : <span className="text-[#666]">no</span>}</td>
                    <td className="py-2 pr-4">{u.pageStatus ?? "—"}</td>
                    <td className="py-2 pr-4">{plan}</td>
                    <td className="py-2 pr-4">{u.subscriptionStatus ?? "free"}</td>
                    <td className="py-2 pr-4">{fmtDate(ends)}</td>
                    <td className="py-2 pr-4">{u.stripeAccountStatus ?? "—"}</td>
                    <td className="py-2 pr-4 text-right">{nf(u._count.links)}</td>
                    <td className="py-2 pr-4 text-right">{nf(u._count.blocks)}</td>
                    <td className="py-2 pr-4 text-right">{nf(u._count.clicks)}</td>
                    <td className="py-2 pr-4 text-right">{nf(u.aiChatMessages)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
