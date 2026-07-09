import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"
import { paymentsUnderMaintenance, PAYMENTS_MAINTENANCE_RESPONSE } from "@/lib/payments-live"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TEMPORARY: live payments paused while Stripe reviews our live application.
    // Enforced here too so hitting the endpoint directly returns the same
    // friendly state. Test mode is never gated. See lib/payments-live.ts.
    if (paymentsUnderMaintenance()) {
      return NextResponse.json(PAYMENTS_MAINTENANCE_RESPONSE, { status: 503 })
    }

    const { id: productId } = await params

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: {
            username: true,
            name: true,
            stripeCustomerId: true,
            stripeAccountId: true,
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

    if (!product.user.stripeAccountId) {
      return NextResponse.json(
        { error: "Creator hasn't connected their Stripe account yet" },
        { status: 400 }
      )
    }

    const purchase = await prisma.purchase.create({
      data: {
        productId: product.id,
        buyerEmail: "",
        amount: product.price,
        status: "pending",
      },
    })

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // No application_fee_amount — Paytree charges 0% platform fees on every plan.
    // Revenue comes from subscriptions, not from skimming creator sales.
    const session = await stripe.checkout.sessions.create(
      {
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
        customer_email: undefined,
      },
      { stripeAccount: product.user.stripeAccountId }
    )

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
