import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"

// GET - Get audience statistics
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Run all queries in parallel
    const [
      total,
      last7Days,
      last30Days,
      bySource,
    ] = await Promise.all([
      prisma.audience.count({
        where: { userId: user.id }
      }),
      prisma.audience.count({
        where: {
          userId: user.id,
          capturedAt: { gte: sevenDaysAgo }
        }
      }),
      prisma.audience.count({
        where: {
          userId: user.id,
          capturedAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.audience.groupBy({
        by: ["source"],
        where: { userId: user.id },
        _count: true,
      }),
    ])
    
    // Format source breakdown
    const sources = bySource.map(s => ({
      source: s.source || "unknown",
      count: s._count,
    }))
    
    return NextResponse.json({
      total,
      last7Days,
      last30Days,
      sources,
    })
  } catch (error) {
    console.error("Audience stats error:", error)
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    )
  }
}

