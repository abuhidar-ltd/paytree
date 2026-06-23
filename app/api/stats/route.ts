import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

// GET - Get current stats
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        statsStudents: true,
        statsWinRate: true,
        statsFollowers: true,
        statsLabel1: true,
        statsLabel2: true,
        statsLabel3: true,
      }
    })

    return NextResponse.json({
      statsStudents: user?.statsStudents ?? 0,
      statsWinRate: Number(user?.statsWinRate ?? 0),
      statsFollowers: user?.statsFollowers ?? 0,
      statsLabel1: user?.statsLabel1 ?? null,
      statsLabel2: user?.statsLabel2 ?? null,
      statsLabel3: user?.statsLabel3 ?? null,
    })
  } catch (error) {
    console.error("Error getting stats:", error)
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 })
  }
}

// PATCH - Update stats
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { 
      statsStudents, 
      statsWinRate, 
      statsFollowers,
      statsLabel1,
      statsLabel2,
      statsLabel3 
    } = body

    const updateData: {
      statsStudents?: number
      statsWinRate?: number
      statsFollowers?: number
      statsLabel1?: string
      statsLabel2?: string
      statsLabel3?: string
    } = {}
    
    if (typeof statsStudents === "number") {
      updateData.statsStudents = Math.max(0, statsStudents)
    }
    
    if (typeof statsWinRate === "number") {
      updateData.statsWinRate = Math.min(100, Math.max(0, statsWinRate))
    }
    
    if (typeof statsFollowers === "number") {
      updateData.statsFollowers = Math.max(0, statsFollowers)
    }
    
    if (typeof statsLabel1 === "string") {
      updateData.statsLabel1 = statsLabel1.slice(0, 50)
    }
    
    if (typeof statsLabel2 === "string") {
      updateData.statsLabel2 = statsLabel2.slice(0, 50)
    }
    
    if (typeof statsLabel3 === "string") {
      updateData.statsLabel3 = statsLabel3.slice(0, 50)
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        statsStudents: true,
        statsWinRate: true,
        statsFollowers: true,
        statsLabel1: true,
        statsLabel2: true,
        statsLabel3: true,
      },
    })

    return NextResponse.json({
      ...updatedUser,
      statsWinRate: Number(updatedUser.statsWinRate),
    })
  } catch (error) {
    console.error("Error updating stats:", error)
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 })
  }
}

// POST - Increment a specific stat
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { stat, amount = 1 } = body

    if (!["statsStudents", "statsFollowers"].includes(stat)) {
      return NextResponse.json({ error: "Invalid stat" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        [stat]: { increment: amount },
      },
      select: {
        statsStudents: true,
        statsWinRate: true,
        statsFollowers: true,
      },
    })

    return NextResponse.json({
      ...updatedUser,
      statsWinRate: Number(updatedUser.statsWinRate),
    })
  } catch (error) {
    console.error("Error incrementing stat:", error)
    return NextResponse.json({ error: "Failed to increment stat" }, { status: 500 })
  }
}

