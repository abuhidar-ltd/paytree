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
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Upload image
    const result = await uploadProfileImage(file, user.id)
    
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      )
    }

    // Update user profile with new image URL
    await prisma.user.update({
      where: { id: user.id },
      data: { image: result.url }
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      size: result.size,
    })
  } catch (error) {
    console.error("Profile image upload error:", error)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
