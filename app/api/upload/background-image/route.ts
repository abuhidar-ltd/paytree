import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { uploadBackgroundImage } from "@/lib/upload"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has Pro subscription
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { subscriptionStatus: true }
    })

    if (user?.subscriptionStatus === 'free') {
      return NextResponse.json(
        { 
          error: "Background image upload requires a paid plan. Upgrade to unlock.",
          code: "UPGRADE_REQUIRED"
        },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Upload image
    const result = await uploadBackgroundImage(file, currentUser.id)
    
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      )
    }

    // Update user profile with new background image URL
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { 
        backgroundImageUrl: result.url,
        backgroundStyle: 'custom'  // Automatically switch to custom background
      }
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      size: result.size,
    })
  } catch (error) {
    console.error("Background image upload error:", error)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
