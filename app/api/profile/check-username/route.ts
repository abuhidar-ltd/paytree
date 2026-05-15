import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const username = request.nextUrl.searchParams.get("username")

    if (!username || !/^[a-z0-9_-]{3,30}$/.test(username)) {
      return NextResponse.json({ available: false, error: "Invalid username format" })
    }

    // Always available if it's their own current username
    if (username === currentUser.username) {
      return NextResponse.json({ available: true })
    }

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    return NextResponse.json({ available: !existing })
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
