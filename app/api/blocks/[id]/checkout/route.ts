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

    const cfg = (block.config as Record<string, unknown>) || {}
    const price = cfg.price as number | undefined

    if (!price || price <= 0) {
      return NextResponse.json({ error: "Product has no price configured" }, { status: 400 })
    }

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
        metadata: {
          type: "block_product_purchase",
          blockId: block.id,
          sellerId: block.userId,
        },
        // block id lets /purchase/success → /api/purchase/verify resolve the
        // seller's connected account (the session lives on it, not the platform)
        // and load download details — block products have no Purchase row.
        success_url: `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}&block=${block.id}`,
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
