import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { detectDevice, normalizeReferrer } from "@/lib/tracking"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Generous limit so normal visitors clicking several links are not blocked,
    // but scripted click-flooding is throttled. Shared bucket with /api/clicks.
    const ip = getClientIp(req)
    const limit = rateLimit(`clicks:${ip}`, 60, 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      )
    }

    const { linkId, isPortalOpen, isLiveClick } = await req.json()

    if (!linkId) {
      return NextResponse.json({ error: "Link ID required" }, { status: 400 })
    }

    // Get link to find userId
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true }
    })

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    const userAgent = req.headers.get("user-agent")
    const referer = req.headers.get("referer")

    // Track click with metadata
    await prisma.click.create({
      data: {
        linkId,
        userId: link.userId,
        userAgent: userAgent || undefined,
        referrer: normalizeReferrer(referer),
        device: detectDevice(userAgent),
        isPortalOpen: isPortalOpen ?? false,
        isLiveClick: isLiveClick ?? false,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to track click:", error)
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    )
  }
}
