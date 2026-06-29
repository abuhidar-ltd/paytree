import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { uploadBackgroundImage } from "@/lib/upload"
import { prisma } from "@/lib/prisma"
import { resolveUserPlan } from "@/lib/plans"

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Canonical plan check — handles trial / canceled / legacy "starter" too.
    const plan = resolveUserPlan({
      subscriptionStatus: currentUser.subscriptionStatus,
      subscriptionPlan: currentUser.subscriptionPlan,
      trialEndsAt: currentUser.trialEndsAt,
      subscriptionEndsAt: currentUser.subscriptionEndsAt,
    })

    if (plan === "free") {
      return NextResponse.json(
        {
          error: "Custom backgrounds are a Pro feature. Upgrade to unlock.",
          code: "UPGRADE_REQUIRED",
        },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    const result = await uploadBackgroundImage(file, currentUser.id)

    if ("error" in result) {
      const status =
        result.code === "INVALID_TYPE" || result.code === "FILE_TOO_LARGE" ? 400
        : result.code === "STORAGE_NOT_CONFIGURED" ? 503
        : 500
      return NextResponse.json({ error: result.error, code: result.code }, { status })
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        backgroundImageUrl: result.url,
        backgroundStyle: "custom",
      },
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      size: result.size,
    })
  } catch (error) {
    console.error("Background image upload error:", error)
    return NextResponse.json(
      { error: "Upload failed unexpectedly. Try again." },
      { status: 500 }
    )
  }
}
