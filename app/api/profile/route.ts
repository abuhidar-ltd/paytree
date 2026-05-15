import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().nullable().optional(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/).optional(),
  bio: z.string().max(200).nullable().optional(),
  image: z.string().nullable().optional().or(z.literal("")), // Allow data URLs and null
  theme: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
  buttonStyle: z.string().nullable().optional(),
  fontFamily: z.string().nullable().optional(),
  backgroundStyle: z.string().nullable().optional(),
  backgroundImageUrl: z.string().nullable().optional().or(z.literal("")), // Allow data URLs and null
  accentColor: z.string().nullable().optional(),
  textColor: z.string().nullable().optional(),
  socialIconPosition: z.string().nullable().optional(),
  heroStyle: z.string().nullable().optional(),
  onboarded: z.boolean().optional(),
}).strict() // Reject any extra fields to prevent pageStatus injection

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        theme: true,
        primaryColor: true,
        backgroundColor: true,
        buttonStyle: true,
        fontFamily: true,
        backgroundStyle: true,
        backgroundImageUrl: true,
        accentColor: true,
        textColor: true,
        socialIconPosition: true,
        heroStyle: true,
        subscriptionStatus: true,
        pageStatus: true, // Include for polling after checkout
        // Obsidian Terminal fields
        liveStatus: true,
        liveMessage: true,
        statsStudents: true,
        statsWinRate: true,
        statsFollowers: true,
        statsLabel1: true,
        statsLabel2: true,
        statsLabel3: true,
      }
    })
    
    // Convert Decimal to number for JSON serialization
    const serializedUser = user ? {
      ...user,
      statsWinRate: user.statsWinRate ? Number(user.statsWinRate) : 0,
    } : null

    return NextResponse.json(serializedUser)
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // SECURITY: Explicitly reject attempts to modify protected fields
    if ('pageStatus' in body || 'subscriptionStatus' in body || 'publishedAt' in body || 'clerkId' in body) {
      return NextResponse.json(
        { error: "Cannot modify protected fields" },
        { status: 403 }
      )
    }
    
    const {
      name, username, bio, image, theme, primaryColor, backgroundColor, buttonStyle, fontFamily,
      backgroundStyle, backgroundImageUrl, accentColor, textColor, socialIconPosition, heroStyle,
      onboarded,
    } = profileSchema.parse(body)

    // Check username uniqueness if being changed
    if (username && username !== currentUser.username) {
      const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } })
      if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 })
      }
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        ...(username !== undefined && { username }),
        bio,
        image: image || null,
        theme,
        primaryColor,
        backgroundColor,
        buttonStyle,
        fontFamily,
        backgroundStyle,
        backgroundImageUrl: backgroundImageUrl || null,
        accentColor,
        textColor,
        socialIconPosition,
        heroStyle,
        ...(onboarded !== undefined && { onboarded }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        theme: true,
        primaryColor: true,
        backgroundColor: true,
        buttonStyle: true,
        fontFamily: true,
        backgroundStyle: true,
        backgroundImageUrl: true,
        accentColor: true,
        textColor: true,
        socialIconPosition: true,
        heroStyle: true,
        subscriptionStatus: true,
      }
    })

    revalidatePath(`/${user.username}`)

    return NextResponse.json(user)
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
