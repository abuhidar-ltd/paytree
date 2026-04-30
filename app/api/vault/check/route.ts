import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get("email")
    const vaultItemId = url.searchParams.get("vaultItemId")
    const ownerId = url.searchParams.get("ownerId")
    
    if (!email || !vaultItemId || !ownerId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }
    
    // Check if email has unlocked this vault item
    const audience = await prisma.audience.findFirst({
      where: {
        userId: ownerId,
        email: email.toLowerCase(),
        vaultItemId,
      }
    })
    
    if (!audience) {
      return NextResponse.json({ unlocked: false })
    }
    
    // Get the vault item content
    const vaultItem = await prisma.link.findUnique({
      where: { id: vaultItemId },
      select: {
        url: true,
        downloadUrl: true,
        downloadName: true,
        vaultContent: true,
      }
    })
    
    return NextResponse.json({
      unlocked: true,
      content: vaultItem
    })
  } catch (error) {
    console.error("Vault check error:", error)
    return NextResponse.json(
      { error: "Failed to check vault status" },
      { status: 500 }
    )
  }
}

