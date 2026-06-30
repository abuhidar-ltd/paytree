import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { uploadProfileImage } from "@/lib/upload"
import { prisma } from "@/lib/prisma"

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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    const result = await uploadProfileImage(file, user.id)

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: statusForUploadCode(result.code) }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { image: result.url },
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      size: result.size,
    })
  } catch (error) {
    console.error("Profile image upload error:", error)
    return NextResponse.json(
      { error: "Upload failed unexpectedly. Try again." },
      { status: 500 }
    )
  }
}
