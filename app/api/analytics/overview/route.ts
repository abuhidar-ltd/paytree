import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get date ranges
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Run all queries in parallel
    const [
      totalViews,
      totalViewsLast7Days,
      uniqueViews,
      uniqueViewsLast7Days,
      totalClicks,
      totalClicksLast7Days,
      totalAudience,
      vaultUnlocks,
      deviceRaw,
      referrerRaw,
    ] = await Promise.all([
      // Total views (all time)
      prisma.view.count({
        where: { userId: user.id }
      }),
      // Views in last 7 days
      prisma.view.count({
        where: {
          userId: user.id,
          timestamp: { gte: sevenDaysAgo }
        }
      }),
      // Unique views (based on fingerprint)
      prisma.view.count({
        where: {
          userId: user.id,
          isUnique: true
        }
      }),
      // Unique views in last 7 days
      prisma.view.count({
        where: {
          userId: user.id,
          isUnique: true,
          timestamp: { gte: sevenDaysAgo }
        }
      }),
      // Total clicks
      prisma.click.count({
        where: { userId: user.id }
      }),
      // Clicks in last 7 days
      prisma.click.count({
        where: {
          userId: user.id,
          timestamp: { gte: sevenDaysAgo }
        }
      }),
      // Total audience emails
      prisma.audience.count({
        where: { userId: user.id }
      }),
      // Vault unlocks
      prisma.audience.count({
        where: {
          userId: user.id,
          source: "vault"
        }
      }),
      // Device breakdown (last 30 days)
      prisma.view.groupBy({
        by: ["device"],
        where: {
          userId: user.id,
          timestamp: { gte: thirtyDaysAgo },
        },
        _count: { device: true },
      }),
      // Referrer breakdown (last 30 days)
      prisma.view.groupBy({
        by: ["referrer"],
        where: {
          userId: user.id,
          timestamp: { gte: thirtyDaysAgo },
        },
        _count: { referrer: true },
      }),
    ])
    
    // Calculate trends (percent change from previous 7 days)
    const previousSevenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const [previousViews, previousClicks] = await Promise.all([
      prisma.view.count({
        where: {
          userId: user.id,
          timestamp: {
            gte: previousSevenDaysAgo,
            lt: sevenDaysAgo
          }
        }
      }),
      prisma.click.count({
        where: {
          userId: user.id,
          timestamp: {
            gte: previousSevenDaysAgo,
            lt: sevenDaysAgo
          }
        }
      }),
    ])
    
    const viewsTrend = previousViews > 0 
      ? Math.round(((totalViewsLast7Days - previousViews) / previousViews) * 100)
      : totalViewsLast7Days > 0 ? 100 : 0
      
    const clicksTrend = previousClicks > 0
      ? Math.round(((totalClicksLast7Days - previousClicks) / previousClicks) * 100)
      : totalClicksLast7Days > 0 ? 100 : 0
    
    // Calculate CTR (Click Through Rate)
    const ctr = totalViews > 0 
      ? Math.round((totalClicks / totalViews) * 100 * 100) / 100 
      : 0
    
    // Vault conversion rate
    const vaultConversionRate = uniqueViews > 0
      ? Math.round((vaultUnlocks / uniqueViews) * 100 * 100) / 100
      : 0
    
    // Normalize groupBy results into stable shapes for the client
    const deviceBreakdown = deviceRaw.map((row) => ({
      device: row.device ?? "unknown",
      count: row._count.device,
    }))
    const referrerBreakdown = referrerRaw.map((row) => ({
      source: row.referrer ?? "direct",
      count: row._count.referrer,
    }))

    return NextResponse.json({
      totalViews,
      totalViewsLast7Days,
      viewsTrend,
      uniqueViews,
      uniqueViewsLast7Days,
      totalClicks,
      totalClicksLast7Days,
      clicksTrend,
      ctr,
      totalAudience,
      vaultUnlocks,
      vaultConversionRate,
      deviceBreakdown,
      referrerBreakdown,
    })
  } catch (error) {
    console.error("Analytics overview error:", error)
    return NextResponse.json(
      { error: "Failed to get analytics overview" },
      { status: 500 }
    )
  }
}

