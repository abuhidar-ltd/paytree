import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"

/**
 * GET /api/audience/export?linkId=xxx
 *
 * Exports audience data as CSV.
 * If `linkId` is provided, exports only emails captured by that specific locked link.
 * Otherwise exports all audience emails.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const linkId = req.nextUrl.searchParams.get("linkId")

    // Build where clause
    const where: any = { userId: user.id }
    if (linkId) {
      where.vaultItemId = linkId
    }

    // Get all audience data
    const audience = await prisma.audience.findMany({
      where,
      include: {
        vaultItem: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { capturedAt: "desc" },
    })

    // Generate CSV
    const headers = ["Email", "Source", "Vault Item", "Captured At"]
    const rows = audience.map((member) => [
      member.email,
      member.source || "unknown",
      member.vaultItem?.title || "",
      member.capturedAt.toISOString(),
    ])

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n")

    const suffix = linkId ? `-link-${linkId}` : ""
    const filename = `paytree-audience${suffix}-${new Date().toISOString().split("T")[0]}.csv`

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export audience error:", error)
    return NextResponse.json({ error: "Failed to export" }, { status: 500 })
  }
}
