import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

// GET - Get current live status
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        liveStatus: true,
        liveMessage: true,
      }
    })

    return NextResponse.json({
      liveStatus: user?.liveStatus ?? false,
      liveMessage: user?.liveMessage ?? null,
    })
  } catch (error) {
    console.error("Error getting live status:", error)
    return NextResponse.json({ error: "Failed to get live status" }, { status: 500 })
  }
}

// POST - Update live status
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { liveStatus, liveMessage } = body

    const updateData: { liveStatus?: boolean; liveMessage?: string } = {}
    
    if (typeof liveStatus === "boolean") {
      updateData.liveStatus = liveStatus
    }
    
    if (typeof liveMessage === "string") {
      updateData.liveMessage = liveMessage
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        liveStatus: true,
        liveMessage: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating live status:", error)
    return NextResponse.json({ error: "Failed to update live status" }, { status: 500 })
  }
}

