import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

/**
 * Test-only stand-in for clicking the verification link: flips
 * emailVerified on the LOCAL test database, which is exactly (and only)
 * what Better Auth's /verify-email endpoint does to the User row. The
 * /verify-pending polling then has to notice the flip on its own — so specs
 * using this helper genuinely exercise the poll → auto-redirect path.
 *
 * HARD-refuses the production endpoint (same fingerprint lib/prisma.ts
 * warns on) — specs must never be able to verify a real account.
 */

const PROD_DB_ENDPOINT_ID = "ep-polished-credit-asp3j0lj"

export async function markEmailVerified(email: string): Promise<void> {
  const url = process.env.DATABASE_URL || ""
  if (!url) throw new Error("markEmailVerified: DATABASE_URL is not set (load .env)")
  if (url.includes(PROD_DB_ENDPOINT_ID)) {
    throw new Error("markEmailVerified: refusing to run against the PRODUCTION database")
  }

  const pool = new Pool({ connectionString: url, max: 1 })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    await prisma.user.update({
      where: { email: email.trim().toLowerCase() },
      data: { emailVerified: true },
    })
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
