import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"
import { clerkClient } from "@clerk/nextjs/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * POST /api/account/delete
 * 
 * Allows users to permanently delete their account
 * This will:
 * 1. Cancel their Stripe subscription immediately
 * 2. Delete all their data from the database
 * 3. Delete their Clerk account
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
        clerkId: true,
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
        // Continue with deletion even if Stripe fails
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
        // Continue with deletion even if Stripe fails
      }
    }

    // Step 3: Delete all user data from database
    console.log(`[DELETE ACCOUNT] Deleting all data from database...`)
    
    // Delete in order (respecting foreign key constraints)
    await prisma.click.deleteMany({ where: { userId: user.id } })
    console.log(`[DELETE ACCOUNT] ✅ Deleted clicks`)
    
    await prisma.view.deleteMany({ where: { userId: user.id } })
    console.log(`[DELETE ACCOUNT] ✅ Deleted views`)
    
    await prisma.socialLink.deleteMany({ where: { userId: user.id } })
    console.log(`[DELETE ACCOUNT] ✅ Deleted social links`)
    
    await prisma.link.deleteMany({ where: { userId: user.id } })
    console.log(`[DELETE ACCOUNT] ✅ Deleted links`)
    
    await prisma.user.delete({ where: { id: user.id } })
    console.log(`[DELETE ACCOUNT] ✅ Deleted user record`)

    // Step 4: Delete Clerk account
    if (user.clerkId) {
      try {
        console.log(`[DELETE ACCOUNT] Deleting Clerk user: ${user.clerkId}`)
        const clerk = await clerkClient()
        await clerk.users.deleteUser(user.clerkId)
        console.log(`[DELETE ACCOUNT] ✅ Clerk user deleted`)
      } catch (clerkError: any) {
        console.error(`[DELETE ACCOUNT] ⚠️  Failed to delete Clerk user:`, clerkError.message)
        // User data already deleted from our DB, so this is just cleanup
      }
    }

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
