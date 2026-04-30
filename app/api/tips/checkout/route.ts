import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"
import { z } from "zod"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const tipSchema = z.object({
  amount: z.number().min(100, "Minimum tip is $1.00").max(100000, "Maximum tip is $1,000"),
  userId: z.string(),
  recipientName: z.string().optional(),
})

// POST - Create a Stripe checkout session for a tip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, userId, recipientName } = tipSchema.parse(body)

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        stripeCustomerId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tip for ${recipientName || user.name || user.username}`,
              description: "Thank you for your support!",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "tip",
        recipientUserId: user.id,
        recipientUsername: user.username,
      },
      success_url: `${origin}/${user.username}?tip=success`,
      cancel_url: `${origin}/${user.username}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Create tip checkout session error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
