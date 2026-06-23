import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma } from "@prisma/client"

// Validation schema for updating a module
const updateModuleSchema = z.object({
  type: z.enum([
    "youtube", "tiktok", "spotify", "apple_music", "image",
    "twitch", "youtube_live", "social_hub", "rss",
    "vault_teaser", "quick_tip", "payment", "podcast"
  ]).optional(),
  title: z.string().optional().nullable(),
  span: z.number().min(1).max(4).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
  order: z.number().optional(),
})

// PATCH - Update a module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if module belongs to user
    const existingModule = await prisma.module.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateModuleSchema.parse(body)

    const updatedModule = await prisma.module.update({
      where: { id },
      data: {
        ...(validatedData.type !== undefined && { type: validatedData.type }),
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.span !== undefined && { span: validatedData.span }),
        ...(validatedData.config !== undefined && { config: validatedData.config as Prisma.InputJsonValue }),
        ...(validatedData.enabled !== undefined && { enabled: validatedData.enabled }),
        ...(validatedData.order !== undefined && { order: validatedData.order }),
      },
    })

    return NextResponse.json(updatedModule)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Update module error:", error)
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if module belongs to user
    const existingModule = await prisma.module.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    await prisma.module.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete module error:", error)
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 }
    )
  }
}
