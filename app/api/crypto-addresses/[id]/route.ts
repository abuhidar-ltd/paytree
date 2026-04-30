import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"

// GET - Get single address
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const address = await prisma.cryptoAddress.findFirst({
      where: { id, userId: user.id },
    })

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    return NextResponse.json(address)
  } catch (error) {
    console.error("Error getting crypto address:", error)
    return NextResponse.json({ error: "Failed to get address" }, { status: 500 })
  }
}

// PATCH - Update address
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
    const { enabled, label, address: newAddress } = body

    // Verify ownership
    const existing = await prisma.cryptoAddress.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const updateData: { enabled?: boolean; label?: string | null; address?: string } = {}

    if (typeof enabled === "boolean") {
      updateData.enabled = enabled
    }

    if (typeof label === "string") {
      updateData.label = label.trim() || null
    }

    if (typeof newAddress === "string" && newAddress.trim()) {
      updateData.address = newAddress.trim()
    }

    const updated = await prisma.cryptoAddress.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating crypto address:", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}

// DELETE - Remove address
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
    const existing = await prisma.cryptoAddress.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    await prisma.cryptoAddress.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting crypto address:", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}

// POST - Increment copy count
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // This can be called without auth (for tracking)
    await prisma.cryptoAddress.update({
      where: { id },
      data: { copyCount: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking copy:", error)
    return NextResponse.json({ error: "Failed to track" }, { status: 500 })
  }
}

