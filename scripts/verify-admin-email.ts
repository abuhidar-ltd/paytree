import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

/**
 * Diagnose (and optionally fix) admin access for a single email.
 *
 * Admin access requires BOTH: the email is in ADMIN_EMAILS *and* the account's
 * emailVerified is true. This app has no email-verification flow, so a freshly
 * registered admin account has emailVerified=false and 404s at /admin until
 * this flag is set once. That's intentional: it means admin access needs
 * DB-level action, so nobody can gain admin just by registering an
 * allowlisted address.
 *
 * The production DATABASE_URL is never in local .env — pass it inline for this
 * one command; it isn't written to disk.
 *
 *   # Report only (no changes):
 *   DATABASE_URL='postgresql://…prod…' npx tsx scripts/verify-admin-email.ts you@email.com
 *
 *   # Report AND set emailVerified=true:
 *   DATABASE_URL='postgresql://…prod…' npx tsx scripts/verify-admin-email.ts you@email.com --fix
 *
 * ADMIN_EMAILS lives only in Vercel, so this script can't see it — it checks
 * the DB side (does the account exist? is it verified?) and prints the exact
 * email string so you can eyeball it against the Vercel value yourself.
 */

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  const fix = process.argv.includes("--fix")

  if (!email || email.startsWith("--")) {
    console.error("Usage: npx tsx scripts/verify-admin-email.ts <email> [--fix]")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true, username: true, createdAt: true },
    })

    if (!user) {
      console.log(`\n❌ No account exists with email "${email}".`)
      console.log("   → Register an account with EXACTLY this email first, then re-run with --fix.")
      console.log("   → Also confirm this string matches ADMIN_EMAILS in Vercel (case/spacing).\n")
      return
    }

    console.log("\nAccount found:")
    console.log(`  email          : ${user.email}`)
    console.log(`  username       : @${user.username}`)
    console.log(`  emailVerified  : ${user.emailVerified ? "✅ true" : "❌ false"}`)
    console.log(`  created        : ${user.createdAt.toISOString()}`)

    if (user.emailVerified) {
      console.log("\n✅ This account already satisfies the emailVerified requirement.")
      console.log("   If /admin still 404s, the cause is ADMIN_EMAILS in Vercel — make sure it")
      console.log(`   contains "${user.email}" (comma-separated, exact match) and the deployment`)
      console.log("   that reads it is the current production one.\n")
      return
    }

    if (!fix) {
      console.log("\n⚠️  emailVerified is false → /admin will 404 for this account.")
      console.log("   Re-run with --fix to set emailVerified=true:")
      console.log(`   DATABASE_URL='…' npx tsx scripts/verify-admin-email.ts ${email} --fix\n`)
      return
    }

    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } })
    console.log("\n✅ Set emailVerified=true.")
    console.log("   Reload /admin — you should be in (assuming ADMIN_EMAILS contains this email).\n")
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
