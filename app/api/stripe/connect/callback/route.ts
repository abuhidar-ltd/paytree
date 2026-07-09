import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * GET /api/stripe/connect/callback — lands here via `return_url` after the
 * user finishes (or abandons) Stripe's hosted onboarding.
 *
 * IMPORTANT: `return_url` fires whether or not onboarding actually completed —
 * a user can close the tab halfway through and still get redirected here.
 * So this route doesn't just trust that and show "success" — it asks Stripe
 * directly what state the account is really in, and updates our DB to match
 * before redirecting to the dashboard.
 *
 * This is a synchronous, best-effort status check for instant UI feedback.
 * It does NOT replace the `account.updated` webhook — the webhook is the
 * source of truth for status changes that happen without the user in the
 * loop (e.g. Stripe requesting more info days later). See Issue 3.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const toPayments = (status: string) =>
    NextResponse.redirect(`${appUrl}/dashboard/payments?stripe=${status}`)

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeAccountId: true },
  })

  if (!dbUser?.stripeAccountId) {
    console.error(`[stripe-connect-callback] no stripeAccountId on record userId=${user.id}`)
    return toPayments("error")
  }

  let account: Stripe.Account
  try {
    account = await stripe.accounts.retrieve(dbUser.stripeAccountId)
  } catch (err) {
    console.error(
      `[stripe-connect-callback] accounts.retrieve FAILED account=${dbUser.stripeAccountId} userId=${user.id}:`,
      err instanceof Error ? err.message : err
    )
    return toPayments("error")
  }

  let status: "active" | "restricted" | "pending"
  if (account.charges_enabled && account.payouts_enabled) {
    status = "active"
  } else if (account.details_submitted) {
    status = "restricted"
  } else {
    status = "pending"
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeAccountStatus: status },
  })

  console.log(
    `[stripe-connect-callback] userId=${user.id} account=${account.id} status=${status} charges_enabled=${account.charges_enabled} payouts_enabled=${account.payouts_enabled} details_submitted=${account.details_submitted}`
  )

  return toPayments(status)
}
