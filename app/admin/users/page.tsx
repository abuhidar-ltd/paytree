import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { resolveUserPlan } from "@/lib/plans"
import { Card, PageTitle, nf, fmtDate } from "../ui"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 25

type SearchParams = {
  q?: string
  page?: string
  status?: string
  onboarded?: string
  published?: string
  comped?: string
}

// Plan is a *computed* value (resolveUserPlan: legacy starter→pro + trial expiry),
// not a single DB column, so it is intentionally NOT a DB filter here. Filters
// below are all direct, indexed-or-cheap columns — safe and accurate.
function buildWhere(sp: SearchParams): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = []

  const q = sp.q?.trim()
  if (q) {
    and.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    })
  }

  if (sp.status) {
    if (sp.status === "free") {
      and.push({ OR: [{ subscriptionStatus: "free" }, { subscriptionStatus: null }] })
    } else {
      and.push({ subscriptionStatus: sp.status })
    }
  }

  if (sp.onboarded === "yes") and.push({ onboarded: true })
  else if (sp.onboarded === "no") and.push({ onboarded: false })

  if (sp.published === "yes") {
    and.push({ pageStatus: "published" })
  } else if (sp.published === "no") {
    and.push({ OR: [{ pageStatus: { not: "published" } }, { pageStatus: null }] })
  }

  if (sp.comped === "yes") and.push({ isComped: true })
  else if (sp.comped === "no") and.push({ isComped: false })

  return and.length ? { AND: and } : {}
}

// Preserve the active filters when building pagination links.
function qs(sp: SearchParams, overrides: Partial<SearchParams>): string {
  const merged = { ...sp, ...overrides }
  const params = new URLSearchParams()
  if (merged.q) params.set("q", merged.q)
  if (merged.status) params.set("status", merged.status)
  if (merged.onboarded) params.set("onboarded", merged.onboarded)
  if (merged.published) params.set("published", merged.published)
  if (merged.comped) params.set("comped", merged.comped)
  if (merged.page) params.set("page", merged.page)
  const s = params.toString()
  return s ? `?${s}` : ""
}

const STATUS_OPTIONS = ["", "free", "trial", "active", "canceling", "canceled"]

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  noStore()
  await requireAdmin()

  const sp = await searchParams
  const where = buildWhere(sp)

  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1)
  const skip = (pageNum - 1) * PAGE_SIZE

  const [total, users, recentGrants] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      // Explicit select — never expose password hashes, tokens, or secrets.
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
        emailVerified: true,
        onboarded: true,
        pageStatus: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionInterval: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        isComped: true,
        compedExpiresAt: true,
        stripeAccountStatus: true,
        aiChatMessages: true,
        _count: { select: { links: true, blocks: true, clicks: true } },
      },
    }),
    prisma.planGrantLog.findMany({ orderBy: { grantedAt: "desc" }, take: 20 }),
  ])

  // The audit log stores userId only (rows must outlive account deletion) —
  // resolve emails for display in one lookup.
  const grantUsers = recentGrants.length
    ? await prisma.user.findMany({
        where: { id: { in: [...new Set(recentGrants.map((g) => g.userId))] } },
        select: { id: true, email: true, username: true },
      })
    : []
  const grantUserById = new Map(grantUsers.map((u) => [u.id, u]))

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = pageNum > 1
  const hasNext = pageNum < totalPages
  const showingFrom = total === 0 ? 0 : skip + 1
  const showingTo = Math.min(skip + PAGE_SIZE, total)

  return (
    <>
      <PageTitle
        title="Users"
        subtitle={`${nf(total)} match · showing ${nf(showingFrom)}–${nf(showingTo)} · page ${pageNum}/${totalPages}`}
      />

      <Card>
        {/* Search + filters (GET form, no client JS) */}
        <form method="get" className="flex flex-wrap items-end gap-3 mb-5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#b0b0b0]">Search</label>
            <input
              type="text"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="email, username, name"
              className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#f0f0f0] outline-none w-56"
            />
          </div>

          <FilterSelect name="status" label="Status" value={sp.status ?? ""} options={STATUS_OPTIONS} />
          <FilterSelect name="onboarded" label="Onboarded" value={sp.onboarded ?? ""} options={["", "yes", "no"]} />
          <FilterSelect name="published" label="Published" value={sp.published ?? ""} options={["", "yes", "no"]} />
          <FilterSelect name="comped" label="Comped" value={sp.comped ?? ""} options={["", "yes", "no"]} />

          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-xs font-mono font-bold text-black bg-[#00ff88] cursor-pointer"
          >
            Apply
          </button>
          <Link
            href="/admin/users"
            className="rounded-lg px-4 py-2 text-xs font-mono text-[#c9c9d1] border border-white/[0.1] hover:text-white"
          >
            Reset
          </Link>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-[#c9c9d1] text-left border-b border-white/[0.06]">
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
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="py-4 text-[#c9c9d1]" colSpan={14}>No users match these filters.</td>
                </tr>
              ) : (
                users.map((u) => {
                  const plan = resolveUserPlan(u)
                  const ends = u.trialEndsAt ?? u.subscriptionEndsAt ?? null
                  return (
                    <tr key={u.id} className="border-b border-white/[0.04] text-[#d0d0d0]">
                      <td className="py-2 pr-4">
                        <Link href={`/admin/users/${u.id}`} className="text-[#00ff88] hover:underline">
                          {u.username ? `@${u.username}` : "(no username)"}
                        </Link>
                        {u.username ? (
                          <Link
                            href={`/${u.username}`}
                            target="_blank"
                            className="ml-2 text-[#c9c9d1] hover:text-[#c9c9d1]"
                            title="Open public profile"
                          >
                            ↗
                          </Link>
                        ) : null}
                        <div className="text-[#c9c9d1]">
                          <Link href={`/admin/users/${u.id}`} className="hover:text-[#c9c9d1]">
                            {u.email}
                          </Link>
                        </div>
                      </td>
                      <td className="py-2 pr-4">{fmtDate(u.createdAt)}</td>
                      <td className="py-2 pr-4">{u.emailVerified ? "✓" : <span className="text-[#f59e0b]">no</span>}</td>
                      <td className="py-2 pr-4">{u.onboarded ? "✓" : <span className="text-[#b0b0b0]">no</span>}</td>
                      <td className="py-2 pr-4">{u.pageStatus ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {plan}
                        {u.isComped ? (
                          <span className="ml-1.5 text-[10px] uppercase tracking-widest text-[#f59e0b] border border-[#f59e0b]/30 rounded px-1 py-0.5">
                            comped
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-4">{u.subscriptionStatus ?? "free"}</td>
                      <td className="py-2 pr-4">{fmtDate(u.isComped ? u.compedExpiresAt : ends)}</td>
                      <td className="py-2 pr-4">{u.stripeAccountStatus ?? "—"}</td>
                      <td className="py-2 pr-4 text-right">{nf(u._count.links)}</td>
                      <td className="py-2 pr-4 text-right">{nf(u._count.blocks)}</td>
                      <td className="py-2 pr-4 text-right">{nf(u._count.clicks)}</td>
                      <td className="py-2 pr-4 text-right">{nf(u.aiChatMessages)}</td>
                      <td className="py-2 pr-4">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-[#00ff88] border border-[#00ff88]/25 rounded-lg px-2.5 py-1 hover:bg-[#00ff88]/10"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-5 text-xs font-mono">
          <span className="text-[#c9c9d1]">
            {nf(total)} total · page {pageNum} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {hasPrev ? (
              <Link
                href={`/admin/users${qs(sp, { page: String(pageNum - 1) })}`}
                className="rounded-lg px-3 py-1.5 text-[#d0d0d0] border border-white/[0.1] hover:text-white"
              >
                ← Prev
              </Link>
            ) : (
              <span className="rounded-lg px-3 py-1.5 text-[#b8b8b8] border border-white/[0.04]">← Prev</span>
            )}
            {hasNext ? (
              <Link
                href={`/admin/users${qs(sp, { page: String(pageNum + 1) })}`}
                className="rounded-lg px-3 py-1.5 text-[#d0d0d0] border border-white/[0.1] hover:text-white"
              >
                Next →
              </Link>
            ) : (
              <span className="rounded-lg px-3 py-1.5 text-[#b8b8b8] border border-white/[0.04]">Next →</span>
            )}
          </div>
        </div>
      </Card>

      {/* Accountability record: every manual grant/revoke, newest first. */}
      <Card title="Plan grant audit log (latest 20)">
        {recentGrants.length === 0 ? (
          <p className="text-xs font-mono text-[#c9c9d1]">No manual plan grants yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono whitespace-nowrap">
              <thead>
                <tr className="text-[#c9c9d1] text-left border-b border-white/[0.06]">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Duration</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Granted by</th>
                  <th className="py-2 pr-4">Granted</th>
                  <th className="py-2 pr-4">Ended</th>
                </tr>
              </thead>
              <tbody>
                {recentGrants.map((g) => {
                  const u = grantUserById.get(g.userId)
                  return (
                    <tr key={g.id} className="border-b border-white/[0.04] text-[#d0d0d0]">
                      <td className="py-2 pr-4">
                        {u ? (
                          <Link href={`/admin/users/${g.userId}`} className="text-[#00ff88] hover:underline">
                            {u.username ? `@${u.username}` : u.email}
                          </Link>
                        ) : (
                          <span className="text-[#c9c9d1]">(deleted account)</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 uppercase">{g.plan}</td>
                      <td className="py-2 pr-4">{g.duration}</td>
                      <td className="py-2 pr-4 whitespace-normal max-w-[240px]">{g.reason}</td>
                      <td className="py-2 pr-4 text-[#c9c9d1]">{g.grantedBy}</td>
                      <td className="py-2 pr-4">{fmtDate(g.grantedAt)}</td>
                      <td className="py-2 pr-4">
                        {g.revokedAt ? fmtDate(g.revokedAt) : <span className="text-[#00ff88]">active</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string
  label: string
  value: string
  options: string[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-mono uppercase tracking-widest text-[#b0b0b0]">{label}</label>
      <select
        name={name}
        defaultValue={value}
        className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#f0f0f0] outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#080808]">
            {o === "" ? "any" : o}
          </option>
        ))}
      </select>
    </div>
  )
}
