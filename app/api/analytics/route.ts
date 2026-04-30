import { getCurrentUser } from "@/lib/clerk-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range") || "7d"
    
    // Calculate date range
    const now = new Date()
    const daysAgo = range === "7d" ? 7 : range === "30d" ? 30 : 90
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    // Get total views
    const totalViews = await prisma.view.count({
      where: {
        userId: user.id,
        timestamp: { gte: startDate }
      }
    })

    // Get total clicks
    const totalClicks = await prisma.click.count({
      where: {
        userId: user.id,
        timestamp: { gte: startDate }
      }
    })

    // Get today's stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const viewsToday = await prisma.view.count({
      where: {
        userId: user.id,
        timestamp: { gte: todayStart }
      }
    })

    const clicksToday = await prisma.click.count({
      where: {
        userId: user.id,
        timestamp: { gte: todayStart }
      }
    })

    // Calculate conversion rate
    const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0

    // Get top links
    const clicksByLink = await prisma.click.groupBy({
      by: ['linkId'],
      where: {
        userId: user.id,
        timestamp: { gte: startDate }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    })

    const topLinks = await Promise.all(
      clicksByLink.map(async (item) => {
        const link = await prisma.link.findUnique({
          where: { id: item.linkId },
          select: { id: true, title: true, url: true }
        })
        return {
          ...link,
          clicks: item._count.id
        }
      })
    )

    // Get chart data (daily breakdown)
    const chartData = []
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const views = await prisma.view.count({
        where: {
          userId: user.id,
          timestamp: { gte: dayStart, lte: dayEnd }
        }
      })

      const clicks = await prisma.click.count({
        where: {
          userId: user.id,
          timestamp: { gte: dayStart, lte: dayEnd }
        }
      })

      chartData.push({
        date: dayStart.toISOString(),
        views,
        clicks
      })
    }

    // Get recent activity
    const recentViews = await prisma.view.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: { timestamp: true }
    })

    const recentClicks = await prisma.click.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: { link: { select: { title: true } } }
    })

    const recentActivity = [
      ...recentViews.map(v => ({ type: 'view' as const, timestamp: v.timestamp.toISOString() })),
      ...recentClicks.map(c => ({ type: 'click' as const, timestamp: c.timestamp.toISOString(), linkTitle: c.link.title }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json({
      totalViews,
      totalClicks,
      conversionRate: parseFloat(conversionRate as string),
      viewsToday,
      clicksToday,
      topLinks,
      chartData,
      recentActivity
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
