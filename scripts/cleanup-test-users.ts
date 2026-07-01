import "dotenv/config"
import { prisma } from "../lib/prisma"

/**
 * Test-account cleanup.
 *
 * DRY RUN BY DEFAULT — lists matching accounts and exits without touching
 * anything. Pass --confirm to actually delete.
 *
 *   npx tsx scripts/cleanup-test-users.ts            # list only
 *   npx tsx scripts/cleanup-test-users.ts --confirm  # DELETE
 *
 * Deletion cascades through blocks, links, sessions, accounts, clicks, etc.
 * via the schema's onDelete: Cascade rules.
 *
 * ADMIN_EMAILS (comma-separated env, same list lib/admin.ts uses) are always
 * excluded as a safety net, even if they match a pattern.
 */

const EMAIL_PATTERNS: Array<{ label: string; test: (email: string) => boolean }> = [
  { label: "y720183*",            test: (e) => e.startsWith("y720183") },
  { label: "fatimaissa*",         test: (e) => e.startsWith("fatimaissa") },
  { label: "ggggg*",              test: (e) => e.startsWith("ggggg") },
  { label: "admin@gmail.com",     test: (e) => e === "admin@gmail.com" },
  { label: "paytree@gmail.com",   test: (e) => e === "paytree@gmail.com" },
  { label: "*@paytree.to",        test: (e) => e.endsWith("@paytree.to") },
  // Playwright / browser-automation accounts created by the test suite
  { label: "*@paytree-e2e.test",  test: (e) => e.endsWith("@paytree-e2e.test") },
]

function matchPattern(email: string): string | null {
  const lower = email.toLowerCase()
  for (const p of EMAIL_PATTERNS) {
    if (p.test(lower)) return p.label
  }
  return null
}

async function main() {
  const confirm = process.argv.includes("--confirm")

  const protectedEmails = new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      pageStatus: true,
      _count: { select: { blocks: true, links: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const matches = users
    .map((u) => ({ ...u, pattern: matchPattern(u.email) }))
    .filter((u): u is typeof u & { pattern: string } => u.pattern !== null)
    .filter((u) => {
      if (protectedEmails.has(u.email.toLowerCase())) {
        console.log(`🛡️  Skipping ${u.email} — listed in ADMIN_EMAILS`)
        return false
      }
      return true
    })

  if (matches.length === 0) {
    console.log("No test accounts matched. Nothing to do.")
    return
  }

  console.log(`\n${confirm ? "DELETING" : "DRY RUN — would delete"} ${matches.length} account(s):\n`)
  for (const u of matches) {
    console.log(
      `  ${u.email.padEnd(42)} @${(u.username || "-").padEnd(20)} ` +
      `${u.createdAt.toISOString().slice(0, 10)}  ` +
      `plan=${u.subscriptionPlan || "free"}/${u.subscriptionStatus || "-"} ` +
      `page=${u.pageStatus || "-"} blocks=${u._count.blocks} links=${u._count.links} ` +
      `[${u.pattern}]`,
    )
  }

  if (!confirm) {
    console.log(`\nDry run only. Re-run with --confirm to delete these ${matches.length} account(s).`)
    return
  }

  // Paying accounts should never be bulk-deleted by pattern — bail loudly.
  const paying = matches.filter((u) => u.subscriptionStatus === "active" || u.subscriptionStatus === "trial")
  if (paying.length > 0) {
    console.error(`\n❌ Refusing to delete: ${paying.length} matched account(s) have an active/trial subscription:`)
    paying.forEach((u) => console.error(`   ${u.email}`))
    console.error("   Cancel their subscriptions in Stripe first, or delete them individually.")
    process.exitCode = 1
    return
  }

  let deleted = 0
  for (const u of matches) {
    try {
      await prisma.user.delete({ where: { id: u.id } })
      deleted++
      console.log(`  ✅ deleted ${u.email}`)
    } catch (err) {
      console.error(`  ❌ failed to delete ${u.email}:`, err instanceof Error ? err.message : err)
    }
  }
  console.log(`\nDone. Deleted ${deleted}/${matches.length}.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
