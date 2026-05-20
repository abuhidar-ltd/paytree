import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z
  .object({
    title:    z.string().min(1).max(200).optional(),
    type:     z.string().min(1).max(50).optional(),
    enabled:  z.boolean().optional(),
    position: z.number().int().optional(),
    url:         z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    thumbnail:   z.string().optional().nullable(),
    config:   z.record(z.string(), z.any()).optional(),
    layout:   z.string().optional(),
    style:    z.string().optional(),
    size:     z.string().optional(),
    priority: z.string().optional(),
    scheduleStart: z.string().datetime().optional().nullable(),
    scheduleEnd:   z.string().datetime().optional().nullable(),
    lockType:  z.string().optional(),
    lockValue: z.string().optional().nullable(),
    parentId:  z.string().optional().nullable(),
  })
  .strict()

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
    const data = updateSchema.parse(body)

    const block = await prisma.block.findUnique({ where: { id } })

    if (!block || block.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.block.update({
      where: { id },
      data: {
        ...data,
        scheduleStart:
          data.scheduleStart === undefined
            ? undefined
            : data.scheduleStart
              ? new Date(data.scheduleStart)
              : null,
        scheduleEnd:
          data.scheduleEnd === undefined
            ? undefined
            : data.scheduleEnd
              ? new Date(data.scheduleEnd)
              : null,
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

    console.error("Failed to update block:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const block = await prisma.block.findUnique({ where: { id } })

    if (!block || block.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.block.deleteMany({ where: { parentId: id } }),
      prisma.block.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete block:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
