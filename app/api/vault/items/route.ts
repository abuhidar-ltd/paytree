import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"
import { z } from "zod"

// GET - List vault items for current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const vaultItems = await prisma.link.findMany({
      where: {
        userId: user.id,
        isVaultItem: true,
      },
      include: {
        _count: {
          select: { vaultUnlocks: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(vaultItems)
  } catch (error) {
    console.error("Get vault items error:", error)
    return NextResponse.json(
      { error: "Failed to get vault items" },
      { status: 500 }
    )
  }
}

const createVaultItemSchema = z.object({
  title: z.string().min(1).max(100),
  icon: z.string().optional(),
  url: z.string().url().optional(),
  downloadUrl: z.string().url().optional(),
  downloadName: z.string().max(100).optional(),
  vaultContent: z.string().max(5000).optional(),
  isEmailLocked: z.boolean().optional().default(true),
})

// POST - Create new vault item
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const data = createVaultItemSchema.parse(body)
    
    // Get max order
    const maxOrder = await prisma.link.findFirst({
      where: { userId: user.id, parentId: null },
      orderBy: { order: "desc" },
      select: { order: true }
    })
    
    const vaultItem = await prisma.link.create({
      data: {
        userId: user.id,
        title: data.title,
        url: data.url || "",
        icon: data.icon || "🔒",
        downloadUrl: data.downloadUrl,
        downloadName: data.downloadName,
        vaultContent: data.vaultContent,
        isVaultItem: true,
        isEmailLocked: data.isEmailLocked,
        order: (maxOrder?.order ?? -1) + 1,
      }
    })
    
    return NextResponse.json(vaultItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error("Create vault item error:", error)
    return NextResponse.json(
      { error: "Failed to create vault item" },
      { status: 500 }
    )
  }
}

