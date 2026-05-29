import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"
import type { PlanId, BillingInterval } from "@/lib/plans"

/**
 * POST /api/create-checkout-session
 *
 * Creates a Stripe checkout session for a Starter or Pro subscription.
 *
 * Body: { plan: "starter" | "ultra", interval: "monthly" | "yearly" }
 *
 * IMPORTANT: Does NOT publish the page — publishing happens via webhook.
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Payment system not configured - Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey)

    // Parse plan + interval from body
    const body = await req.json().catch(() => ({}))
    const plan: PlanId = body.plan === "ultra" ? "ultra" : "starter"
    const interval: BillingInterval = body.interval === "yearly" ? "yearly" : "monthly"

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        username: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Already subscribed guard
    if (
      user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trial" ||
      user.subscriptionStatus === "canceling"
    ) {
      return NextResponse.json(
        { error: "Already subscribed", redirect: "/dashboard/studio" },
        { status: 400 }
      )
    }

    // Resolve Stripe price ID
    const PRICE_IDS: Record<string, string | undefined> = {
      starter_monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
      starter_yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
      ultra_monthly: process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID,
      ultra_yearly: process.env.STRIPE_ULTRA_YEARLY_PRICE_ID,
    }

    const priceId = PRICE_IDS[`${plan}_${interval}`]

    if (!priceId) {
      return NextResponse.json(
        { error: "Plan not available. Please contact support." },
        { status: 400 }
      )
    }

    // Verify or create Stripe customer
    let customerId = user.stripeCustomerId

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch (error: any) {
        if (error.code === "resource_missing") {
          customerId = null
        } else {
          throw error
        }
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id, username: user.username },
      })
      customerId = customer.id

      await prisma.user.update({
        where: { id: currentUser.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: currentUser.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: currentUser.id,
          username: user.username,
          plan,
          interval,
        },
      },
      success_url: `${baseUrl}/dashboard/studio?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/upgrade?canceled=true`,
      allow_promotion_codes: true,
      metadata: {
        userId: currentUser.id,
        username: user.username,
        plan,
        interval,
      },
    })

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Failed to create checkout URL" }, { status: 500 })
    }

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error: any) {
    console.error("[checkout] Error:", error.message)

    let errorMessage = error.message || "Failed to create checkout session"
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = `Stripe configuration error: ${error.message}`
    }

    return NextResponse.json(
      { error: errorMessage, type: error.type, code: error.code },
      { status: 500 }
    )
  }
}
