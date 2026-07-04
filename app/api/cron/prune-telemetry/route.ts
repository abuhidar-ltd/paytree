import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/cron/prune-telemetry
 *
 * Vercel Cron job — runs daily. Deletes Visit and SignupTelemetry rows older
 * than the retention window so the beacon tables can't grow without bound
 * (they take one unauthenticated write per landing-page view / signup stage).
 * 90 days comfortably covers the admin dashboard's longest range (30d).
 *
 * Registered in vercel.json:
 *   { "crons": [{ "path": "/api/cron/prune-telemetry", "schedule": "30 3 * * *" }] }
 *
 * Secured with CRON_SECRET header.
 */

const RETENTION_DAYS = 90

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  // Fail closed: a missing secret or a non-matching header is unauthorized.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
    const [visits, telemetry] = await Promise.all([
      prisma.visit.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.signupTelemetry.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    ])

    console.log(
      `[cron:prune-telemetry] deleted ${visits.count} Visit + ${telemetry.count} SignupTelemetry rows older than ${RETENTION_DAYS}d`
    )
    return NextResponse.json({
      ok: true,
      deleted: { visits: visits.count, signupTelemetry: telemetry.count },
      cutoff: cutoff.toISOString(),
    })
  } catch (err) {
    console.error("[cron:prune-telemetry] failed:", err)
    return NextResponse.json({ error: "Prune failed" }, { status: 500 })
  }
}
