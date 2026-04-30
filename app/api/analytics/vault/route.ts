import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"

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
    
    // Get vault items with unlock counts
    const vaultItems = await prisma.link.findMany({
      where: {
        userId: user.id,
        isVaultItem: true,
      },
      include: {
        _count: {
          select: { vaultUnlocks: true }
        },
        vaultUnlocks: {
          where: {
            capturedAt: { gte: startDate }
          },
          select: {
            id: true,
            capturedAt: true,
          }
        }
      }
    })
    
    // Get daily unlock data
    const dailyUnlocks: Record<string, number> = {}
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      dailyUnlocks[dateStr] = 0
    }
    
    vaultItems.forEach(item => {
      item.vaultUnlocks.forEach(unlock => {
        const dateStr = unlock.capturedAt.toISOString().split("T")[0]
        if (dailyUnlocks[dateStr] !== undefined) {
          dailyUnlocks[dateStr]++
        }
      })
    })
    
    // Format item stats
    const itemStats = vaultItems.map(item => ({
      id: item.id,
      title: item.title,
      icon: item.icon,
      totalUnlocks: item._count.vaultUnlocks,
      recentUnlocks: item.vaultUnlocks.length,
      isEmailLocked: item.isEmailLocked,
    }))
    
    // Calculate totals
    const totalUnlocks = vaultItems.reduce((sum, item) => sum + item._count.vaultUnlocks, 0)
    const recentUnlocks = vaultItems.reduce((sum, item) => sum + item.vaultUnlocks.length, 0)
    
    // Chart data
    const chartData = Object.entries(dailyUnlocks)
      .map(([date, unlocks]) => ({ date, unlocks }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    return NextResponse.json({
      totalUnlocks,
      recentUnlocks,
      itemStats,
      chartData,
      itemCount: vaultItems.length,
    })
  } catch (error) {
    console.error("Vault analytics error:", error)
    return NextResponse.json(
      { error: "Failed to get vault analytics" },
      { status: 500 }
    )
  }
}

