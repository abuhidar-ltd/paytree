import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"

// DELETE - Remove vault item
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Verify ownership
    const vaultItem = await prisma.link.findFirst({
      where: { id, userId: user.id, isVaultItem: true }
    })
    
    if (!vaultItem) {
      return NextResponse.json({ error: "Vault item not found" }, { status: 404 })
    }
    
    await prisma.link.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete vault item error:", error)
    return NextResponse.json(
      { error: "Failed to delete vault item" },
      { status: 500 }
    )
  }
}

// PATCH - Update vault item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { title, icon, url, downloadUrl, downloadName, vaultContent, isEmailLocked, enabled } = body
    
    // Verify ownership
    const existing = await prisma.link.findFirst({
      where: { id, userId: user.id, isVaultItem: true }
    })
    
    if (!existing) {
      return NextResponse.json({ error: "Vault item not found" }, { status: 404 })
    }
    
    const updateData: Record<string, unknown> = {}
    
    if (typeof title === "string") updateData.title = title
    if (typeof icon === "string") updateData.icon = icon
    if (typeof url === "string") updateData.url = url
    if (typeof downloadUrl === "string") updateData.downloadUrl = downloadUrl
    if (typeof downloadName === "string") updateData.downloadName = downloadName
    if (typeof vaultContent === "string") updateData.vaultContent = vaultContent
    if (typeof isEmailLocked === "boolean") updateData.isEmailLocked = isEmailLocked
    if (typeof enabled === "boolean") updateData.enabled = enabled
    
    const updated = await prisma.link.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update vault item error:", error)
    return NextResponse.json(
      { error: "Failed to update vault item" },
      { status: 500 }
    )
  }
}

