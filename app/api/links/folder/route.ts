import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

// POST - Create a new folder/portal
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, icon } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Get max order for top-level items
    const maxOrder = await prisma.link.findFirst({
      where: { userId: user.id, parentId: null },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const folder = await prisma.link.create({
      data: {
        userId: user.id,
        title: title.trim(),
        url: "", // Folders don't have URLs
        icon: icon || "📁",
        isFolder: true,
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error("Error creating folder:", error)
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}

