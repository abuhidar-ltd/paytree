// DEPRECATED — use /api/blocks with type="social_link". The SocialLink table
// is no longer queried by the public profile; route preserved for legacy
// integrations.
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const socialLinkSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url(),
  enabled: z.boolean().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const socialLinks = await prisma.socialLink.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(socialLinks)
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { platform, url, enabled } = socialLinkSchema.parse(body)

    // Get the highest order number
    const lastLink = await prisma.socialLink.findFirst({
      where: { userId: user.id },
      orderBy: { order: 'desc' }
    })

    const socialLink = await prisma.socialLink.create({
      data: {
        platform,
        url,
        enabled: enabled ?? true,
        userId: user.id,
        order: (lastLink?.order ?? -1) + 1,
      }
    })

    return NextResponse.json(socialLink, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error("Failed to create social link:", error)
    return NextResponse.json(
      { error: "Failed to create social link. Please try again." },
      { status: 500 }
    )
  }
}
