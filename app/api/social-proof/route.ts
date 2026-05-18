import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")
  if (!username) return NextResponse.json({ events: [] })

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })

  if (!user) return NextResponse.json({ events: [] })

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const events = await prisma.socialProof.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      type: true,
      message: true,
      country: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ events })
}
