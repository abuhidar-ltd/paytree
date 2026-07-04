import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { getUserFeatures } from "@/lib/plans"
import { z } from "zod"

const blockSchema = z.object({
  title:    z.string().min(1).max(200).optional(),
  type:     z.string().min(1).max(50),
  enabled:  z.boolean().optional(),
  url:      z.string().optional(),
  description: z.string().optional(),
  thumbnail:   z.string().optional(),
  config:   z.record(z.string(), z.any()).optional(),
  layout:   z.string().optional(),
  style:    z.string().optional(),
  size:     z.string().optional(),
  priority: z.string().optional(),
  scheduleStart: z.string().datetime().optional().nullable(),
  scheduleEnd:   z.string().datetime().optional().nullable(),
  lockType:  z.string().optional(),
  lockValue: z.string().optional(),
  parentId:  z.string().optional().nullable(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Exclude blocks that are someone's revealBlock — they live inside their parent,
    // not in the main canvas grid. They are still reachable via the parent's revealBlock include.
    const blocks = await prisma.block.findMany({
      where: { userId: user.id, revealedBy: { none: {} } },
      orderBy: { position: "asc" },
      include: {
        children: {
          orderBy: { position: "asc" },
        },
        revealBlock: true,
      },
    })

    return NextResponse.json(blocks)
  } catch (error) {
    console.error("Failed to list blocks:", error)
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
    const data = blockSchema.parse(body)

    // Feature gates — free plan restrictions
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionStatus: true, subscriptionPlan: true, trialEndsAt: true, subscriptionEndsAt: true, isComped: true, compedExpiresAt: true },
    })
    const features = getUserFeatures(dbUser ?? {})

    // Pro-and-up features: drop cards, vault cards, and any lock type that
    // gates a card behind email / password / payment. Product selling is
    // available on every plan.
    if ((data.type === "drop" || data.type === "vault") && !features.hasDrops) {
      return NextResponse.json(
        {
          error: `${data.type === "drop" ? "Drop" : "Vault"} cards require a Pro plan.`,
          code: "UPGRADE_REQUIRED",
        },
        { status: 403 }
      )
    }
    if (data.lockType && data.lockType !== "none" && !features.hasLockedLinks) {
      return NextResponse.json(
        { error: "Locked cards require a Pro plan.", code: "UPGRADE_REQUIRED" },
        { status: 403 }
      )
    }

    const NON_LOCKABLE = ["youtube", "spotify", "podcast", "twitch", "live_status", "stats", "text", "image", "social_link"]
    if (NON_LOCKABLE.includes(data.type)) {
      data.lockType = "none"
    }

    const count = await prisma.block.count({
      where: { userId: user.id, parentId: data.parentId ?? null },
    })

    const block = await prisma.block.create({
      data: {
        userId: user.id,
        title:   data.title ?? "Untitled",
        type:    data.type,
        enabled: data.enabled ?? true,
        position: count,
        url:         data.url ?? null,
        description: data.description ?? null,
        thumbnail:   data.thumbnail ?? null,
        config:  data.config ?? {},
        layout:  data.layout   ?? "classic",
        style:   data.style    ?? "glass",
        size:    data.size     ?? "full",
        priority: data.priority ?? "none",
        scheduleStart: data.scheduleStart ? new Date(data.scheduleStart) : null,
        scheduleEnd:   data.scheduleEnd   ? new Date(data.scheduleEnd)   : null,
        lockType:  data.lockType  ?? "none",
        lockValue: data.lockValue ?? null,
        parentId:  data.parentId  ?? null,
      },
    })

    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Failed to create block:", error)
    return NextResponse.json(
      { error: "Failed to create block. Please try again." },
      { status: 500 }
    )
  }
}
