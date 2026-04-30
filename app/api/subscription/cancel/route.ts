import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * POST /api/subscription/cancel
 * 
 * Allows users to cancel their subscription
 * Cancels at period end (keeps access until billing cycle ends)
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's subscription info
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        username: true,
      }
    })

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      )
    }

    if (user.subscriptionStatus === 'canceled' || user.subscriptionStatus === 'free') {
      return NextResponse.json(
        { error: "Subscription already canceled or not active" },
        { status: 400 }
      )
    }

    console.log(`[CANCEL] Canceling subscription for user: ${user.username}`)
    console.log(`[CANCEL] Subscription ID: ${user.stripeSubscriptionId}`)

    // Cancel subscription at period end (user keeps access until billing cycle ends)
    const subscriptionResponse = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    )
    
    // Cast to access timestamp properties safely
    const subscription = subscriptionResponse as {
      current_period_end?: number | null
      cancel_at?: number | null
    }

    // Safely get the end date - handle cases where current_period_end might be missing
    let accessUntilDate: Date
    
    if (subscription.current_period_end && typeof subscription.current_period_end === 'number' && subscription.current_period_end > 0) {
      accessUntilDate = new Date(subscription.current_period_end * 1000)
    } else if (subscription.cancel_at && typeof subscription.cancel_at === 'number' && subscription.cancel_at > 0) {
      accessUntilDate = new Date(subscription.cancel_at * 1000)
    } else {
      // Fallback: give 30 days access from now
      accessUntilDate = new Date()
      accessUntilDate.setDate(accessUntilDate.getDate() + 30)
      console.log(`[CANCEL] Warning: No period end found, defaulting to 30 days from now`)
    }

    // Validate the date is valid
    if (isNaN(accessUntilDate.getTime())) {
      // If still invalid, use 30 days from now
      accessUntilDate = new Date()
      accessUntilDate.setDate(accessUntilDate.getDate() + 30)
      console.log(`[CANCEL] Warning: Invalid date detected, defaulting to 30 days from now`)
    }

    console.log(`[CANCEL] Subscription set to cancel at: ${accessUntilDate.toISOString()}`)

    // Update user status
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        subscriptionStatus: 'canceling', // Custom status to show it's set to cancel
        subscriptionEndsAt: accessUntilDate,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Subscription canceled successfully",
      accessUntil: accessUntilDate.toISOString(),
    })

  } catch (error: any) {
    console.error("[CANCEL] Error canceling subscription:", error.message)
    console.error("[CANCEL] Full error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    )
  }
}
