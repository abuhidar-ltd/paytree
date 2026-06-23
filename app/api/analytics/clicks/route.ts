import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const period = url.searchParams.get("period") || "30"
    const days = Math.min(parseInt(period), 90)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get links with click counts
    const links = await prisma.link.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { clicks: true }
        },
        clicks: {
          where: {
            timestamp: { gte: startDate }
          },
          select: {
            timestamp: true,
          }
        }
      },
      orderBy: { order: "asc" }
    })
    
    // Daily clicks aggregate
    const dailyClicks: Record<string, number> = {}
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      dailyClicks[dateStr] = 0
    }
    
    links.forEach(link => {
      link.clicks.forEach(click => {
        const dateStr = click.timestamp.toISOString().split("T")[0]
        if (dailyClicks[dateStr] !== undefined) {
          dailyClicks[dateStr]++
        }
      })
    })
    
    // Format link stats (top links by clicks)
    const linkStats = links
      .map(link => ({
        id: link.id,
        title: link.title,
        icon: link.icon,
        url: link.url,
        totalClicks: link._count.clicks,
        recentClicks: link.clicks.length,
        isFolder: link.isFolder,
        isVaultItem: link.isVaultItem,
      }))
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 10) // Top 10
    
    // Chart data
    const chartData = Object.entries(dailyClicks)
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const totalClicks = links.reduce((sum, link) => sum + link._count.clicks, 0)
    const recentClicks = links.reduce((sum, link) => sum + link.clicks.length, 0)
    
    return NextResponse.json({
      totalClicks,
      recentClicks,
      linkStats,
      chartData,
    })
  } catch (error) {
    console.error("Click analytics error:", error)
    return NextResponse.json(
      { error: "Failed to get click analytics" },
      { status: 500 }
    )
  }
}

