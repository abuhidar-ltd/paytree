import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * POST /api/subscription/reactivate
 * 
 * Allows users to reactivate a canceled subscription
 * (before the cancellation takes effect at period end)
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
        { error: "No subscription found" },
        { status: 400 }
      )
    }

    console.log(`[REACTIVATE] Reactivating subscription for user: ${user.username}`)
    console.log(`[REACTIVATE] Subscription ID: ${user.stripeSubscriptionId}`)

    // Reactivate subscription (remove cancel_at_period_end)
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    ) as Stripe.Subscription & { current_period_end?: number | null }

    console.log(`[REACTIVATE] Subscription reactivated successfully`)

    // Update user status back to active
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        subscriptionStatus: subscription.status === 'trialing' ? 'trial' : 'active',
      }
    })

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated successfully",
    })

  } catch (error: unknown) {
    console.error("[REACTIVATE] Error reactivating subscription:", (error as Error).message)
    return NextResponse.json(
      { error: (error as Error).message || "Failed to reactivate subscription" },
      { status: 500 }
    )
  }
}
