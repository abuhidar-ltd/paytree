import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// POST - Create a Stripe checkout session for a product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: {
            username: true,
            name: true,
            stripeCustomerId: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!product.enabled) {
      return NextResponse.json({ error: "Product is not available" }, { status: 400 })
    }

    // Create a pending purchase record
    const purchase = await prisma.purchase.create({
      data: {
        productId: product.id,
        buyerEmail: "", // Will be updated from webhook
        amount: product.price,
        status: "pending",
      },
    })

    // Get the origin for redirect URLs
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.title,
              description: product.description || undefined,
              images: product.imageUrl ? [product.imageUrl] : undefined,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "product_purchase",
        purchaseId: purchase.id,
        productId: product.id,
        sellerId: product.userId,
      },
      success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${product.user.username}`,
      customer_email: undefined, // Let user enter their email
    })

    // Update purchase with session ID
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Create checkout session error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
