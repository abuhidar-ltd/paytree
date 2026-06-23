import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { getUserFeatures } from "@/lib/plans"
import { applyOptimizedOrder } from "@/lib/ai-optimizer"

/**
 * POST /api/ai/optimize-links
 *
 * Runs the rule-based link optimizer for Pro users.
 * Reorders the user's top-level links for maximum engagement.
 */
export async function POST() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check Ultra plan
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
      },
    })

    const features = getUserFeatures(user || {})
    if (!features.hasAiFeatures) {
      return NextResponse.json(
        { error: "AI features require an Ultra plan.", code: "UPGRADE_REQUIRED" },
        { status: 403 }
      )
    }

    const count = await applyOptimizedOrder(currentUser.id)

    return NextResponse.json({
      success: true,
      message: `Optimized ${count} links based on engagement rules.`,
      optimizedCount: count,
    })
  } catch (error: unknown) {
    console.error("[ai/optimize-links] Error:", (error as Error).message)
    return NextResponse.json({ error: "Failed to optimize links" }, { status: 500 })
  }
}
