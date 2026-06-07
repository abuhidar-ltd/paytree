// DEPRECATED — use /api/blocks with type="drop". The Drop table is no longer
// queried by the public profile; route preserved for legacy integrations.
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const dropSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().optional().nullable(),
  dropAt: z.string().datetime(),
  revealUrl: z.string().url().optional().nullable(),
  revealText: z.string().optional().nullable(),
  status: z.string().optional(),
  limitedSpots: z.number().int().positive().optional().nullable(),
  spotsLeft: z.number().int().min(0).optional().nullable(),
  enabled: z.boolean().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const drops = await prisma.drop.findMany({
      where: { userId: user.id },
      orderBy: { dropAt: "asc" },
    })

    return NextResponse.json(drops)
  } catch (error) {
    console.error("Failed to load drops:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = dropSchema.parse(body)

    const drop = await prisma.drop.create({
      data: {
        userId: currentUser.id,
        title: data.title,
        description: data.description ?? null,
        dropAt: new Date(data.dropAt),
        revealUrl: data.revealUrl ?? null,
        revealText: data.revealText ?? null,
        status: data.status ?? "scheduled",
        limitedSpots: data.limitedSpots ?? null,
        spotsLeft:
          data.spotsLeft ?? (data.limitedSpots ? data.limitedSpots : null),
        enabled: data.enabled ?? true,
      },
    })

    return NextResponse.json(drop, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Failed to create drop:", error)
    return NextResponse.json(
      { error: "Failed to create drop. Please try again." },
      { status: 500 }
    )
  }
}
