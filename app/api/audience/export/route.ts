import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"
import { getUserFeatures } from "@/lib/plans"

/**
 * GET /api/audience/export
 *
 * Query params (all optional):
 *   linkId  — export only emails captured by this vault item
 *   ids     — comma-separated audience IDs (used for "Export selected")
 *
 * Email export is gated to Starter+ plans.
 */
export async function GET(req: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: current.id },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        subscriptionEndsAt: true, isComped: true, compedExpiresAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const features = getUserFeatures(user)
    if (!features.hasEmailExport) {
      return NextResponse.json(
        {
          error: "Upgrade to Pro to export emails",
          code: "UPGRADE_REQUIRED",
          upgrade: true,
        },
        { status: 403 },
      )
    }

    const linkId = req.nextUrl.searchParams.get("linkId")
    const idsParam = req.nextUrl.searchParams.get("ids")
    const ids = idsParam
      ? idsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : null

    const where: Prisma.AudienceWhereInput = { userId: user.id }
    if (linkId) where.vaultItemId = linkId
    if (ids && ids.length > 0) where.id = { in: ids }

    const audience = await prisma.audience.findMany({
      where,
      include: { vaultItem: { select: { title: true } } },
      orderBy: { capturedAt: "desc" },
    })

    const dateFmt = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const headers = ["Email", "Source", "Vault Item", "Captured Date"]
    const rows = audience.map((m) => [
      m.email,
      m.source || "unknown",
      m.vaultItem?.title || "",
      dateFmt.format(m.capturedAt),
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n")

    const today = new Date().toISOString().split("T")[0]
    const suffix = linkId ? `-link-${linkId}` : ids ? "-selected" : ""
    const filename = `paytree-audience${suffix}-${today}.csv`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Export audience error:", error)
    return NextResponse.json({ error: "Failed to export" }, { status: 500 })
  }
}
