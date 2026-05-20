import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { getUserFeatures } from "@/lib/plans"

/**
 * POST /api/publish
 * 
 * CRITICAL MONETIZATION ENDPOINT
 * 
 * Publishes a user's page. Only users on Starter or Ultra (active/trial) can publish.
 * Enforced server-side — frontend cannot bypass.
 */
export async function POST() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    // Get user with subscription status
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        username: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        pageStatus: true,
        stripeSubscriptionId: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      )
    }

    // Use plan-based feature check
    const features = getUserFeatures(user)
    
    if (!features.canPublish) {
      console.log(`[PUBLISH BLOCKED] User ${user.id} on ${features.name} attempted to publish`)
      return NextResponse.json(
        { 
          error: "Upgrade to Starter to publish your page", 
          code: "UPGRADE_REQUIRED",
          upgrade: true,
        },
        { status: 403 }
      )
    }

    // All checks passed - publish the page
    console.log(`[PUBLISH SUCCESS] User ${user.id} (${user.username}) page published on ${features.name}`)
    
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        pageStatus: 'published',
        publishedAt: new Date(),
      },
      select: {
        username: true,
        pageStatus: true,
        publishedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Your page is now live!",
      username: updatedUser.username,
      pageStatus: updatedUser.pageStatus,
      publishedAt: updatedUser.publishedAt,
      permanentUrl: `/${updatedUser.username}`,
    })

  } catch (error: any) {
    console.error("Publish error:", error)
    return NextResponse.json(
      { error: "Failed to publish", code: "PUBLISH_FAILED" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/publish
 * 
 * Unpublishes the user's page (sets to draft).
 */
export async function DELETE() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        pageStatus: 'draft',
      }
    })

    return NextResponse.json({
      success: true,
      message: "Page unpublished",
    })

  } catch (error) {
    console.error("Unpublish error:", error)
    return NextResponse.json(
      { error: "Failed to unpublish" },
      { status: 500 }
    )
  }
}
