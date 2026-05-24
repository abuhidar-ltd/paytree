import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blockId } = await params

    const block = await prisma.block.findUnique({
      where: { id: blockId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            stripeAccountId: true,
            platformFeePercent: true,
          },
        },
      },
    })

    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 })
    }

    if (block.type !== "product") {
      return NextResponse.json({ error: "Block is not a product" }, { status: 400 })
    }

    if (!block.user.stripeAccountId) {
      return NextResponse.json(
        { error: "Creator hasn't connected their Stripe account yet" },
        { status: 400 }
      )
    }

    const cfg = (block.config as Record<string, any>) || {}
    const price = cfg.price as number | undefined

    if (!price || price <= 0) {
      return NextResponse.json({ error: "Product has no price configured" }, { status: 400 })
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const feePercent = block.user.platformFeePercent ?? 5
    const applicationFeeAmount = Math.round(price * feePercent / 100)

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: (cfg.currency as string) || "usd",
              product_data: {
                name: block.title,
                description: block.description || undefined,
                images: block.thumbnail ? [block.thumbnail] : undefined,
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount > 0 ? applicationFeeAmount : undefined,
        },
        metadata: {
          type: "block_product_purchase",
          blockId: block.id,
          sellerId: block.userId,
        },
        success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/${block.user.username}`,
      },
      { stripeAccount: block.user.stripeAccountId }
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Block checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
