import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for updating a product
const updateProductSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().min(100).max(99999900).optional(),
  currency: z.string().optional(),
  downloadUrl: z.string().url().optional().nullable(),
  downloadName: z.string().max(100).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  enabled: z.boolean().optional(),
})

// GET - Get a single product (public endpoint for checkout page)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        currency: true,
        imageUrl: true,
        enabled: true,
        user: {
          select: {
            username: true,
            name: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

// PATCH - Update a product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if product belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.price !== undefined && { price: validatedData.price }),
        ...(validatedData.currency !== undefined && { currency: validatedData.currency }),
        ...(validatedData.downloadUrl !== undefined && { downloadUrl: validatedData.downloadUrl }),
        ...(validatedData.downloadName !== undefined && { downloadName: validatedData.downloadName }),
        ...(validatedData.imageUrl !== undefined && { imageUrl: validatedData.imageUrl }),
        ...(validatedData.enabled !== undefined && { enabled: validatedData.enabled }),
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Update product error:", error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if product belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}
