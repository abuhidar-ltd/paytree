import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"
import type { PlanId, BillingInterval } from "@/lib/plans"

/**
 * POST /api/create-checkout-session
 *
 * Creates a Stripe checkout session for a Pro or Ultra subscription.
 *
 * Body: { plan: "pro" | "ultra", interval: "monthly" | "yearly" }
 * Legacy: "starter" is accepted and normalized to "pro" for back-compat with
 * any cached client bundles still posting the old name.
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

    // Parse plan + interval from body. Accept "pro" (canonical) or legacy
    // "starter" — both route to the same Stripe price.
    const body = await req.json().catch(() => ({}))
    const plan: PlanId = body.plan === "ultra" ? "ultra" : "pro"
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

    // Resolve Stripe price ID — env var names stay STARTER_* for back-compat
    // with the existing Vercel deployment; "pro" is the canonical plan name.
    const PRICE_IDS: Record<string, string | undefined> = {
      pro_monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
      pro_yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
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
      } catch (error: unknown) {
        if ((error as { code?: string }).code === "resource_missing") {
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
  } catch (error: unknown) {
    const e = error as { message?: string; type?: string; code?: string }
    console.error("[checkout] Error:", e.message)

    let errorMessage = e.message || "Failed to create checkout session"
    if (e.type === "StripeInvalidRequestError") {
      errorMessage = `Stripe configuration error: ${e.message}`
    }

    return NextResponse.json(
      { error: errorMessage, type: e.type, code: e.code },
      { status: 500 }
    )
  }
}
