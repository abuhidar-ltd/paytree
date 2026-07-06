import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { StatCard, Card, PageTitle, nf, pct } from "../ui"

export const dynamic = "force-dynamic"

// Live per-IP rate-limit counters are in-memory (lib/rate-limit.ts) and not
// persisted, so this page shows DB-derived *proxies* for abuse, not the limiter
// state itself.
export default async function AdminAbusePage() {
  noStore()
  await requireAdmin()

  const since1h = new Date(Date.now() - 60 * 60 * 1000)
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [
    tokensTotal, tokens24h, tokensVerified,
    newUsers1h, newUsers24h, unverifiedEmails,
    noSession, noAccount,
    topAi,
  ] = await Promise.all([
    prisma.linkUnlockToken.count(),
    prisma.linkUnlockToken.count({ where: { createdAt: { gte: since24h } } }),
    prisma.linkUnlockToken.count({ where: { verified: true } }),
    prisma.user.count({ where: { createdAt: { gte: since1h } } }),
    prisma.user.count({ where: { createdAt: { gte: since24h } } }),
    prisma.user.count({ where: { emailVerified: false } }),
    prisma.user.count({ where: { sessions: { none: {} } } }),
    prisma.user.count({ where: { accounts: { none: {} } } }),
    prisma.user.findMany({
      where: { aiChatMessages: { gt: 0 } },
      orderBy: { aiChatMessages: "desc" },
      take: 10,
      select: { username: true, aiChatMessages: true, aiChatSessions: true, aiAgentEnabled: true },
    }),
  ])

  return (
    <>
      <PageTitle title="Abuse signals" subtitle="Heuristic DB proxies. Live rate-limit counters are in-memory and not shown here." />

      <Card title="Vault / send-code (email + Resend cost)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Tokens (24h)" value={nf(tokens24h)} />
          <StatCard label="Tokens total" value={nf(tokensTotal)} />
          <StatCard label="Verified" value={nf(tokensVerified)} sub={`${pct(tokensVerified, tokensTotal)} of total`} />
          <StatCard label="Unverified" value={nf(tokensTotal - tokensVerified)} sub="sent but never confirmed" />
        </div>
      </Card>

      <Card title="Signup integrity">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="New users (1h)" value={nf(newUsers1h)} sub="burst indicator" />
          <StatCard label="New users (24h)" value={nf(newUsers24h)} />
          <StatCard label="Unverified emails" value={nf(unverifiedEmails)} />
          <StatCard label="No auth account" value={nf(noAccount)} sub="cannot log in" />
          <StatCard label="No session ever" value={nf(noSession)} sub="signup/cookie issue" />
        </div>
      </Card>

      <Card title="Top AI usage (Anthropic cost)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-[#c9c9d1] text-left border-b border-white/[0.06]">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4 text-right">Messages</th>
                <th className="py-2 pr-4 text-right">Sessions</th>
                <th className="py-2 pr-4">Agent</th>
              </tr>
            </thead>
            <tbody>
              {topAi.length === 0 ? (
                <tr><td className="py-2 text-[#c9c9d1]" colSpan={4}>No AI usage yet.</td></tr>
              ) : (
                topAi.map((u, i) => (
                  <tr key={i} className="border-b border-white/[0.04] text-[#d0d0d0]">
                    <td className="py-2 pr-4">
                      {u.username ? (
                        <Link href={`/${u.username}`} target="_blank" className="text-[#00ff88] hover:underline">
                          @{u.username}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right">{nf(u.aiChatMessages)}</td>
                    <td className="py-2 pr-4 text-right">{nf(u.aiChatSessions)}</td>
                    <td className="py-2 pr-4">{u.aiAgentEnabled ? "on" : "off"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
