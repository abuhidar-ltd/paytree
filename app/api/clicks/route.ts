import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const clickSchema = z.object({
  linkId: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { linkId } = clickSchema.parse(body)

    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true }
    })

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    await prisma.click.create({
      data: {
        linkId,
        userId: link.userId,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

