import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const reorderSchema = z.object({
  blocks: z
    .array(
      z.object({
        id: z.string(),
        position: z.number().int(),
      })
    )
    .min(1),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { blocks } = reorderSchema.parse(body)

    const ids = blocks.map((b) => b.id)
    const owned = await prisma.block.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    })

    if (owned.length !== ids.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.$transaction(
      blocks.map((b) =>
        prisma.block.update({
          where: { id: b.id },
          data: { position: b.position },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Failed to reorder blocks:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
