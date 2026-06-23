// DEPRECATED — use /api/blocks. The Module table is no longer queried by the
// public profile or dashboard; this route is preserved only for any external
// integrations still pointing at it.
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { getUserFeatures, isLimitReached } from "@/lib/plans"

// Validation schema for creating a module
const createModuleSchema = z.object({
  type: z.enum([
    "youtube", "tiktok", "spotify", "apple_music", "image",
    "twitch", "youtube_live", "social_hub", "rss",
    "vault_teaser", "quick_tip", "payment", "podcast"
  ]),
  title: z.string().optional(),
  span: z.number().min(1).max(4).default(1),
  config: z.record(z.string(), z.unknown()).default({}),
  enabled: z.boolean().default(true),
})

// GET - List all modules for the authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const modules = await prisma.module.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(modules)
  } catch (error) {
    console.error("Get modules error:", error)
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    )
  }
}

// POST - Create a new module
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createModuleSchema.parse(body)

    // Check module limits based on plan
    const features = getUserFeatures(user)
    const moduleCount = await prisma.module.count({
      where: { userId: user.id },
    })

    if (isLimitReached(moduleCount, features.limits.modules)) {
      return NextResponse.json(
        { error: `${features.name} plan limited to ${features.limits.modules} modules. Upgrade for unlimited.` },
        { status: 403 }
      )
    }

    // Get the highest order number
    const lastModule = await prisma.module.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const newOrder = (lastModule?.order ?? -1) + 1

    const moduleItem = await prisma.module.create({
      data: {
        userId: user.id,
        type: validatedData.type,
        title: validatedData.title,
        span: validatedData.span,
        config: validatedData.config as Prisma.InputJsonValue,
        enabled: validatedData.enabled,
        order: newOrder,
      },
    })

    return NextResponse.json(moduleItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Create module error:", error)
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 }
    )
  }
}
