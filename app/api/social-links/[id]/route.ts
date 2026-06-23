import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  platform: z.string().min(1).optional(),
  url: z.string().url().optional(),
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
    const data = updateSchema.parse(body)

    // Verify ownership
    const socialLink = await prisma.socialLink.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!socialLink || socialLink.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.socialLink.update({
      where: { id },
      data
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      )
    }
    
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

    // Verify ownership
    const socialLink = await prisma.socialLink.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!socialLink || socialLink.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.socialLink.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
