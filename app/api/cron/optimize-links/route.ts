import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { applyOptimizedOrder } from "@/lib/ai-optimizer"

/**
 * GET /api/cron/optimize-links
 *
 * Vercel Cron job — runs hourly.
 * Optimizes link ordering for all Pro users with active subscriptions.
 *
 * Add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/optimize-links", "schedule": "0 * * * *" }] }
 *
 * Secured with CRON_SECRET header.
 */
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find all Pro users with active subscriptions
    const proUsers = await prisma.user.findMany({
      where: {
        subscriptionPlan: "pro",
        subscriptionStatus: { in: ["active", "trial"] },
      },
      select: { id: true, username: true },
    })

    console.log(`[cron/optimize] Processing ${proUsers.length} Pro users...`)

    let optimized = 0
    for (const user of proUsers) {
      try {
        const count = await applyOptimizedOrder(user.id)
        if (count > 0) {
          optimized++
          console.log(`[cron/optimize] ${user.username}: ${count} links reordered`)
        }
      } catch (error: any) {
        console.error(`[cron/optimize] Failed for ${user.username}:`, error.message)
      }
    }

    return NextResponse.json({
      success: true,
      totalUsers: proUsers.length,
      optimizedUsers: optimized,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[cron/optimize] Error:", error.message)
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
  }
}
