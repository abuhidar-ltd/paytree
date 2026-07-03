import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

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

