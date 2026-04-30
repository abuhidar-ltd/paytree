import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"
import { z } from "zod"

// GET - List audience with pagination and search
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100)
    const search = url.searchParams.get("search") || ""
    const source = url.searchParams.get("source") || ""
    const sortBy = url.searchParams.get("sortBy") || "capturedAt"
    const sortOrder = url.searchParams.get("sortOrder") || "desc"
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: Record<string, unknown> = { userId: user.id }
    
    if (search) {
      where.email = { contains: search, mode: "insensitive" }
    }
    
    if (source) {
      where.source = source
    }
    
    // Get total count
    const total = await prisma.audience.count({ where })
    
    // Get paginated results
    const audience = await prisma.audience.findMany({
      where,
      include: {
        vaultItem: {
          select: {
            id: true,
            title: true,
            icon: true,
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit,
    })
    
    return NextResponse.json({
      audience,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error("Get audience error:", error)
    return NextResponse.json(
      { error: "Failed to get audience" },
      { status: 500 }
    )
  }
}

// POST - Manually add email to audience
const addEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  source: z.string().optional().default("manual"),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { email, source } = addEmailSchema.parse(body)
    
    // Check for existing
    const existing = await prisma.audience.findUnique({
      where: {
        userId_email: {
          userId: user.id,
          email: email.toLowerCase(),
        }
      }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: "Email already exists in your audience" },
        { status: 409 }
      )
    }
    
    const audienceMember = await prisma.audience.create({
      data: {
        userId: user.id,
        email: email.toLowerCase(),
        source,
      }
    })
    
    return NextResponse.json(audienceMember, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error("Add audience error:", error)
    return NextResponse.json(
      { error: "Failed to add email" },
      { status: 500 }
    )
  }
}

