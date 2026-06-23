import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

/**
 * POST /api/verify-checkout
 *
 * Called from the studio after a successful Stripe checkout redirect.
 * Retrieves the session directly from Stripe and activates the subscription
 * without waiting for a webhook — makes local dev and fast redirects reliable.
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = await req.json()
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey)

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })

    // Security: confirm this session belongs to the calling user
    const sessionUserId = session.client_reference_id || session.metadata?.userId
    if (sessionUserId !== currentUser.id) {
      return NextResponse.json({ error: "Session does not belong to this user" }, { status: 403 })
    }

    // Session must be complete — this covers both paid and free-trial checkouts.
    // For trials, payment_status is "no_payment_required" (not "paid"), but
    // Stripe only sets session.status = "complete" after the checkout fully succeeds.
    if (session.status !== "complete") {
      return NextResponse.json({ error: "Checkout not yet complete" }, { status: 400 })
    }

    const subscription = session.subscription as Stripe.Subscription
    if (!subscription) {
      return NextResponse.json({ error: "No subscription in session" }, { status: 400 })
    }

    const sub = subscription as Stripe.Subscription & {
      status: string
      trial_end: number | null
      current_period_end: number
      items: { data: { price: { id: string } }[] }
    }

    // Resolve plan from subscription metadata → price ID fallback
    const meta = (sub.metadata || session.metadata || {}) as Record<string, string>
    let plan = meta.plan
    const interval = meta.interval || "monthly"

    // Accept legacy "starter" alongside the canonical "pro". Anything else
    // falls back to inferring the plan from the Stripe price ID.
    if (!plan || !["pro", "starter", "ultra"].includes(plan)) {
      const priceId = sub.items?.data?.[0]?.price?.id
      if (priceId === process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID ||
          priceId === process.env.STRIPE_ULTRA_YEARLY_PRICE_ID) {
        plan = "ultra"
      } else {
        plan = "pro"
      }
    }
    // Normalize legacy DB-stored "starter" so new rows write the canonical name.
    if (plan === "starter") plan = "pro"

    let status: string
    let trialEndsAt: Date | null = null
    let subscriptionEndsAt: Date | null = null

    if (sub.status === "trialing") {
      status = "trial"
      trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000) : null
    } else if (sub.status === "active") {
      status = "active"
      subscriptionEndsAt = new Date(sub.current_period_end * 1000)
    } else {
      status = sub.status
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        subscriptionStatus: status,
        subscriptionPlan: plan,
        subscriptionInterval: interval,
        stripeSubscriptionId: subscription.id,
        // Persist customer ID in case create-checkout-session DB write raced/failed
        ...(session.customer ? { stripeCustomerId: session.customer as string } : {}),
        trialEndsAt,
        subscriptionEndsAt,
        pageStatus: "published",
        publishedAt: new Date(),
      },
      select: {
        username: true,
        pageStatus: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
      },
    })

    console.log(`[verify-checkout] ✅ Activated ${updatedUser.username}: ${status} / ${plan}`)

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "unknown"
    console.error("[verify-checkout] Error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
