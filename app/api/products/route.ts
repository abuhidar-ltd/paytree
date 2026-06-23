// DEPRECATED — use /api/blocks. Product blocks (type "product") replace the
// Product table on the public profile. Route preserved for legacy integrations
// and Stripe webhooks that still reference Product/Purchase rows.
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for creating a product
const createProductSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(100, "Minimum price is $1.00").max(99999900, "Maximum price is $999,999"),
  currency: z.string().default("usd"),
  downloadUrl: z.string().url().optional(),
  downloadName: z.string().max(100).optional(),
  imageUrl: z.string().url().optional(),
  enabled: z.boolean().default(true),
})

// GET - List all products for the authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { purchases: { where: { status: "completed" } } },
        },
      },
    })

    // Calculate total revenue for each product
    const productsWithRevenue = await Promise.all(
      products.map(async (product) => {
        const revenue = await prisma.purchase.aggregate({
          where: { productId: product.id, status: "completed" },
          _sum: { amount: true },
        })
        return {
          ...product,
          totalRevenue: revenue._sum.amount || 0,
          salesCount: product._count.purchases,
        }
      })
    )

    return NextResponse.json(productsWithRevenue)
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Pro users can create products
    const isPro = user.subscriptionStatus === "active" || 
                  user.subscriptionStatus === "trial" ||
                  user.subscriptionStatus === "canceling"
    
    if (!isPro) {
      return NextResponse.json(
        { error: "Upgrade to sell digital products" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        currency: validatedData.currency,
        downloadUrl: validatedData.downloadUrl,
        downloadName: validatedData.downloadName,
        imageUrl: validatedData.imageUrl,
        enabled: validatedData.enabled,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Create product error:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}
