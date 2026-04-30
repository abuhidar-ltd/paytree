import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for reordering
const reorderSchema = z.object({
  moduleIds: z.array(z.string()),
})

// POST - Reorder modules
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { moduleIds } = reorderSchema.parse(body)

    // Verify all modules belong to user
    const modules = await prisma.module.findMany({
      where: {
        id: { in: moduleIds },
        userId: user.id,
      },
      select: { id: true },
    })

    if (modules.length !== moduleIds.length) {
      return NextResponse.json(
        { error: "Invalid module IDs" },
        { status: 400 }
      )
    }

    // Update order for each module
    await Promise.all(
      moduleIds.map((id, index) =>
        prisma.module.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    // Fetch updated modules
    const updatedModules = await prisma.module.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(updatedModules)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Reorder modules error:", error)
    return NextResponse.json(
      { error: "Failed to reorder modules" },
      { status: 500 }
    )
  }
}
