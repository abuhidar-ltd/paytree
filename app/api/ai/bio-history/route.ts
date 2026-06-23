import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/ai/bio-history
 *
 * Returns the user's AI-generated bio history (most recent first).
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const history = await prisma.bioHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        bio: true,
        prompt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(history)
  } catch (error: any) {
    console.error("[ai/bio-history] Error:", error.message)
    return NextResponse.json({ error: "Failed to fetch bio history" }, { status: 500 })
  }
}
