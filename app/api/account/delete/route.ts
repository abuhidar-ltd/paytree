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

    // Require explicit server-side confirmation — do not rely on the client's
    // typed-DELETE check alone.
    let confirmation: unknown
    try {
      const body = await req.json()
      confirmation = body?.confirmation
    } catch {
      confirmation = undefined
    }
    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'Confirmation required. Send { "confirmation": "DELETE" }.' },
        { status: 400 }
      )
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`[DELETE ACCOUNT] Starting account deletion for user: ${currentUser.id}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    // Get user's full data. Stripe IDs are used for best-effort cleanup AFTER
    // the database deletion succeeds.
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

    // Step 1: Database deletion FIRST. Remove referral rows that would otherwise
    // block the delete (their FK relations have no cascade), then delete the
    // user — Session/Account/Link/Block/Click/etc. cascade via FK.
    await prisma.referral.deleteMany({
      where: { OR: [{ referrerId: user.id }, { referredId: user.id }] },
    })
    console.log(`[DELETE ACCOUNT] Deleting user and cascading dependents...`)
    await prisma.user.delete({ where: { id: user.id } })
    console.log(`[DELETE ACCOUNT] ✅ Deleted user record`)

    // Step 2: Best-effort Stripe cleanup — only AFTER the DB user is gone, so a
    // failed DB delete can never leave a canceled subscription on a live account.
    if (user.stripeSubscriptionId) {
      try {
        console.log(`[DELETE ACCOUNT] Canceling Stripe subscription: ${user.stripeSubscriptionId}`)
        await stripe.subscriptions.cancel(user.stripeSubscriptionId)
        console.log(`[DELETE ACCOUNT] ✅ Stripe subscription canceled`)
      } catch (stripeError: unknown) {
        console.error(`[DELETE ACCOUNT] ⚠️  Failed to cancel Stripe subscription:`, (stripeError as Error).message)
      }
    }
    if (user.stripeCustomerId) {
      try {
        console.log(`[DELETE ACCOUNT] Deleting Stripe customer: ${user.stripeCustomerId}`)
        await stripe.customers.del(user.stripeCustomerId)
        console.log(`[DELETE ACCOUNT] ✅ Stripe customer deleted`)
      } catch (stripeError: unknown) {
        console.error(`[DELETE ACCOUNT] ⚠️  Failed to delete Stripe customer:`, (stripeError as Error).message)
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`[DELETE ACCOUNT] ✅ Account deletion complete: ${user.username}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })

  } catch (error: unknown) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.error("[DELETE ACCOUNT] ❌ Error deleting account:", (error as Error).message)
    console.error("[DELETE ACCOUNT] Stack:", (error as Error).stack)
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    )
  }
}
