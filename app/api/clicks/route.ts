import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const clickSchema = z.object({
  linkId: z.string(),
})

export async function POST(req: Request) {
  try {
    // Generous limit so normal visitors are not blocked, but scripted click-
    // flooding is throttled. Shared bucket with /api/track-click.
    const ip = getClientIp(req)
    const limit = rateLimit(`clicks:${ip}`, 60, 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      )
    }

    const body = await req.json()
    const { linkId } = clickSchema.parse(body)

    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true }
    })

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    await prisma.click.create({
      data: {
        linkId,
        userId: link.userId,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

