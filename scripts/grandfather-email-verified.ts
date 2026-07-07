import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

/**
 * ONE-TIME migration for the July 2026 email-verification hard gate.
 *
 * Verification used to be visibility-only, so every pre-gate account —
 * the collab signups, comped/promo users, Muhammad's own accounts — has
 * emailVerified=false through no fault of its own. Once the gate ships,
 * those rows would be locked out of the dashboard on their next visit.
 * This script grandfathers them: emailVerified=true for every user
 * created before the cutoff.
 *
 * Report first, apply second — the apply re-uses the cutoff printed by the
 * report so it touches exactly the rows that were shown, even if someone
 * signs up in between (that new row keeps emailVerified=false and goes
 * through the normal verify flow).
 *
 * The production DATABASE_URL is never in local .env — pass it inline
 * (same pattern as scripts/verify-admin-email.ts); it isn't written to disk.
 *
 *   # 1. Report only (no changes) — prints count, emails, and the apply command:
 *   DATABASE_URL='postgresql://…prod…' npx tsx scripts/grandfather-email-verified.ts
 *
 *   # 2. Apply, using the cutoff the report printed:
 *   DATABASE_URL='postgresql://…prod…' npx tsx scripts/grandfather-email-verified.ts --apply --cutoff=<iso>
 */

async function main() {
  const apply = process.argv.includes("--apply")
  const cutoffArg = process.argv.find((a) => a.startsWith("--cutoff="))?.slice("--cutoff=".length)

  if (apply && !cutoffArg) {
    console.error("--apply requires --cutoff=<iso> (run without --apply first to get it)")
    process.exit(1)
  }
  const cutoff = cutoffArg ? new Date(cutoffArg) : new Date()
  if (Number.isNaN(cutoff.getTime())) {
    console.error(`Invalid --cutoff value: "${cutoffArg}"`)
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  try {
    const where = { emailVerified: false, createdAt: { lt: cutoff } }
    const affected = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: { email: true, username: true, createdAt: true, onboarded: true, pageStatus: true },
    })
    const totalUsers = await prisma.user.count()
    const alreadyVerified = await prisma.user.count({ where: { emailVerified: true } })

    console.log(`\nDatabase: ${totalUsers} users total, ${alreadyVerified} already verified.`)
    console.log(`Cutoff:   createdAt < ${cutoff.toISOString()}`)
    console.log(`\n${affected.length} unverified user(s) would be grandfathered:\n`)
    for (const u of affected) {
      console.log(
        `  ${u.createdAt.toISOString()}  ${u.email.padEnd(40)} @${u.username ?? "-"}` +
          `  ${u.onboarded ? "onboarded" : "new"}${u.pageStatus === "published" ? " · published" : ""}`
      )
    }

    if (!apply) {
      console.log(`\nReport only — nothing changed. To apply exactly this set:`)
      console.log(
        `  DATABASE_URL='…' npx tsx scripts/grandfather-email-verified.ts --apply --cutoff=${cutoff.toISOString()}\n`
      )
      return
    }

    const result = await prisma.user.updateMany({ where, data: { emailVerified: true } })
    const remaining = await prisma.user.count({ where: { emailVerified: false } })
    console.log(`\n✅ Grandfathered ${result.count} user(s) (emailVerified=true).`)
    console.log(`   ${remaining} unverified user(s) remain (created after the cutoff — normal flow).\n`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
