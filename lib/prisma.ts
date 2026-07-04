import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// ────────────────────────────────────────────────────────────────────────────
// Production-database guard.
//
// On 2026-07-04 we discovered local dev, the Playwright suite, and the
// cleanup/seed scripts were all writing to the LIVE production database,
// because .env carried the production DATABASE_URL. The pre-July-2 user data
// is gone, most plausibly to a local reset or cleanup run.
//
// The fingerprint below is the production Neon endpoint ID — the one part of
// the connection string that uniquely identifies the production instance
// (the database *name* is "neondb", which every fresh Neon project also uses,
// so matching on the name would false-positive on paytree-test). A hostname
// is not a credential; committing it leaks nothing usable.
//
// NODE_ENV === "production" covers Vercel runtime AND `next build` — both are
// legitimate users of the production URL. Everything else (next dev, tsx
// scripts, Playwright) gets the banner.
// ────────────────────────────────────────────────────────────────────────────
const PROD_DB_ENDPOINT_ID = "ep-polished-credit-asp3j0lj"

if (
  process.env.NODE_ENV !== "production" &&
  (process.env.DATABASE_URL || "").includes(PROD_DB_ENDPOINT_ID)
) {
  console.error(
    [
      "",
      "┌────────────────────────────────────────────────────────────────────┐",
      "│  ⚠️  DANGER: THIS LOCAL PROCESS IS USING THE PRODUCTION DATABASE   │",
      "│                                                                    │",
      "│  DATABASE_URL points at the production Neon endpoint               │",
      `│  (${PROD_DB_ENDPOINT_ID}) while NODE_ENV is not "production".     │`,
      "│                                                                    │",
      "│  Every write — dev server, Playwright, seed/cleanup scripts,       │",
      "│  prisma db push — hits LIVE USER DATA.                             │",
      "│                                                                    │",
      "│  Fix: point DATABASE_URL in .env at the paytree-test Neon project. │",
      "│  The production URL belongs ONLY in Vercel env vars.               │",
      "└────────────────────────────────────────────────────────────────────┘",
      "",
    ].join("\n")
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

// Cap pool size for Vercel Fluid Compute + Neon. Fluid Compute reuses function
// instances, so each instance opens its own pg.Pool. Neon caps concurrent
// connections per project, and a signup spike with the default max=10 across
// 20 warm instances = 200 connections = "sorry, too many clients already" →
// signups silently 500. max=2 gives us ~40 headroom on a modest Neon plan.
//
// Statement / connection timeouts also matter: without them, a stalled query
// during a signup burst holds a connection indefinitely, so healthy retries
// starve on the pool. 10s connect / 30s statement is long enough for cold
// Neon starts, short enough that a wedged signup releases resources fast.
const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 30_000,
    idleTimeoutMillis: 30_000,
  })

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.pgPool = pool
}

