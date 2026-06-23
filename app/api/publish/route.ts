import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/publish
 *
 * Publishes a user's page. All plans can publish — features are gated, not publishing.
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

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        username: true,
        pageStatus: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      )
    }

    console.log(`[PUBLISH] User ${user.id} (${user.username}) publishing page`)

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
