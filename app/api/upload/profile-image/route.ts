import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { uploadProfileImage } from "@/lib/upload"
import { prisma } from "@/lib/prisma"

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
      // Map validation/storage errors to 4xx/5xx so the client can branch on status.
      const status =
        result.code === "INVALID_TYPE" || result.code === "FILE_TOO_LARGE" ? 400
        : result.code === "STORAGE_NOT_CONFIGURED" ? 503
        : 500
      return NextResponse.json({ error: result.error, code: result.code }, { status })
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
