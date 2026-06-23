import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * POST /api/account/delete
 *
 * Allows users to permanently delete their account
 * This will:
 * 1. Cancel their Stripe subscription immediately
 * 2. Delete all their data from the database — Session/Account/Click/View/etc.
 *    cascade automatically via FK onDelete: Cascade
 *
 * WARNING: This is irreversible!
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`[DELETE ACCOUNT] Starting account deletion for user: ${currentUser.id}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    // Get user's full data
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Step 1: Cancel Stripe subscription immediately (if exists)
    if (user.stripeSubscriptionId) {
      try {
        console.log(`[DELETE ACCOUNT] Canceling Stripe subscription: ${user.stripeSubscriptionId}`)
        await stripe.subscriptions.cancel(user.stripeSubscriptionId)
        console.log(`[DELETE ACCOUNT] ✅ Stripe subscription canceled`)
      } catch (stripeError: any) {
        console.error(`[DELETE ACCOUNT] ⚠️  Failed to cancel Stripe subscription:`, stripeError.message)
      }
    }

    // Step 2: Delete user's Stripe customer (if exists)
    if (user.stripeCustomerId) {
      try {
        console.log(`[DELETE ACCOUNT] Deleting Stripe customer: ${user.stripeCustomerId}`)
        await stripe.customers.del(user.stripeCustomerId)
        console.log(`[DELETE ACCOUNT] ✅ Stripe customer deleted`)
      } catch (stripeError: any) {
        console.error(`[DELETE ACCOUNT] ⚠️  Failed to delete Stripe customer:`, stripeError.message)
      }
    }

    // Step 3: Delete user — Session, Account, Click, View, etc. cascade via FK
    console.log(`[DELETE ACCOUNT] Deleting user and cascading dependents...`)
    await prisma.user.delete({ where: { id: user.id } })
    console.log(`[DELETE ACCOUNT] ✅ Deleted user record`)

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`[DELETE ACCOUNT] ✅ Account deletion complete: ${user.username}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })

  } catch (error: any) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.error("[DELETE ACCOUNT] ❌ Error deleting account:", error.message)
    console.error("[DELETE ACCOUNT] Stack:", error.stack)
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    )
  }
}
