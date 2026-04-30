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
    const period = url.searchParams.get("period") || "30" // days
    const days = Math.min(parseInt(period), 90) // Max 90 days
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)
    
    // Get views grouped by day
    const views = await prisma.view.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: startDate }
      },
      select: {
        timestamp: true,
        isUnique: true,
      },
      orderBy: { timestamp: "asc" }
    })
    
    // Aggregate by day
    const dailyData: Record<string, { date: string; views: number; unique: number }> = {}
    
    // Initialize all days
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      dailyData[dateStr] = { date: dateStr, views: 0, unique: 0 }
    }
    
    // Populate with actual data
    views.forEach(view => {
      const dateStr = view.timestamp.toISOString().split("T")[0]
      if (dailyData[dateStr]) {
        dailyData[dateStr].views++
        if (view.isUnique) {
          dailyData[dateStr].unique++
        }
      }
    })
    
    // Convert to array and sort
    const chartData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    
    return NextResponse.json(chartData)
  } catch (error) {
    console.error("Analytics views error:", error)
    return NextResponse.json(
      { error: "Failed to get view analytics" },
      { status: 500 }
    )
  }
}

