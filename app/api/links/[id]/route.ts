import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const linkSchema = z.object({
  title:    z.string().min(1).max(100).optional(),
  url:      z.string().url().optional(),
  enabled:  z.boolean().optional(),
  style:    z.string().optional(),
  cardSize: z.string().optional(),
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
    const data = linkSchema.parse(body)

    // Verify ownership
    const link = await prisma.link.findUnique({
      where: { id }
    })

    if (!link || link.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updatedLink = await prisma.link.update({
      where: { id },
      data
    })

    return NextResponse.json(updatedLink)
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
    const link = await prisma.link.findUnique({
      where: { id }
    })

    if (!link || link.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.link.delete({
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

