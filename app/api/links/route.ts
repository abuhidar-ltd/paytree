import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getUserFeatures, isLimitReached } from "@/lib/plans"
import { detectLinkType } from "@/lib/link-type"

const linkSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().url().optional(), // Optional for folders
  enabled: z.boolean().optional(),
  icon: z.string().optional(),
  style: z.string().optional(),
  parentId: z.string().optional(), // For nesting in portals
  isStarred: z.boolean().optional(),
  scheduledFrom: z.string().datetime().optional().nullable(),
  scheduledTo: z.string().datetime().optional().nullable(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const links = await prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(links)
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, url, enabled, icon, style, parentId, isStarred, scheduledFrom, scheduledTo } = linkSchema.parse(body)

    // Get user with subscription info for feature gating
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
      }
    })

    const features = getUserFeatures(user || {})

    // Count existing links (excluding folders)
    const linkCount = await prisma.link.count({
      where: { userId: currentUser.id, isFolder: false, isVaultItem: false }
    })

    // Enforce plan link limits
    if (isLimitReached(linkCount, features.limits.links)) {
      return NextResponse.json(
        { 
          error: `${features.name} plan limited to ${features.limits.links} links. Upgrade for more.`,
          code: 'LIMIT_REACHED'
        },
        { status: 403 }
      )
    }

    // Check scheduling permission
    if ((scheduledFrom || scheduledTo) && !features.hasScheduling) {
      return NextResponse.json(
        { error: 'Link scheduling requires a Starter or Pro plan.', code: 'UPGRADE_REQUIRED' },
        { status: 403 }
      )
    }

    // Auto-detect link type from URL
    const linkType = url ? detectLinkType(url) : "generic"

    // Get the highest order number for the same parent
    const lastLink = await prisma.link.findFirst({
      where: { userId: currentUser.id, parentId: parentId || null },
      orderBy: { order: 'desc' }
    })

    const link = await prisma.link.create({
      data: {
        title,
        url: url || '',
        enabled: enabled ?? true,
        icon,
        style,
        type: linkType,
        isStarred: isStarred ?? false,
        scheduledFrom: scheduledFrom ? new Date(scheduledFrom) : null,
        scheduledTo: scheduledTo ? new Date(scheduledTo) : null,
        userId: currentUser.id,
        order: (lastLink?.order ?? -1) + 1,
        parentId: parentId || null,
      }
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error("Failed to create link:", error)
    return NextResponse.json(
      { error: "Failed to create link. Please try again." },
      { status: 500 }
    )
  }
}
