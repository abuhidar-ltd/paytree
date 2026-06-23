import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

// DELETE - Remove audience member
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
    const audienceMember = await prisma.audience.findFirst({
      where: { id, userId: user.id }
    })
    
    if (!audienceMember) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    
    await prisma.audience.delete({ where: { id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete audience error:", error)
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    )
  }
}

