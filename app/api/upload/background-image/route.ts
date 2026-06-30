import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { uploadBackgroundImage } from "@/lib/upload"
import { prisma } from "@/lib/prisma"
import { resolveUserPlan } from "@/lib/plans"

function statusForUploadCode(code: string): number {
  switch (code) {
    case "INVALID_TYPE":
    case "FILE_TOO_LARGE":
    case "INVALID_IMAGE":
      return 400
    case "STORAGE_RATE_LIMITED":
      return 429
    case "STORAGE_NOT_CONFIGURED":
    case "STORAGE_NOT_FOUND":
    case "STORAGE_SUSPENDED":
    case "STORAGE_ACCESS_DENIED":
    case "STORAGE_UNAVAILABLE":
      return 503
    default:
      return 500
  }
}

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
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusForUploadCode(result.code) }
      )
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
