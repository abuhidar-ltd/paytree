import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const dropSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().optional().nullable(),
  dropAt: z.string().datetime().optional(),
  revealUrl: z.string().url().optional().nullable(),
  revealText: z.string().optional().nullable(),
  status: z.string().optional(),
  limitedSpots: z.number().int().positive().optional().nullable(),
  spotsLeft: z.number().int().min(0).optional().nullable(),
  enabled: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const data = dropSchema.parse(body)

    const drop = await prisma.drop.findUnique({ where: { id } })

    if (!drop || drop.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.drop.update({
      where: { id },
      data: {
        ...data,
        dropAt: data.dropAt ? new Date(data.dropAt) : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Failed to update drop:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const drop = await prisma.drop.findUnique({ where: { id } })

    if (!drop || drop.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.drop.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete drop:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
