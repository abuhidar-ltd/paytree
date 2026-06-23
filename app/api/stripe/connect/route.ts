import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { resolveUserPlan } from "@/lib/plans"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      stripeAccountId: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
    },
  })

  const plan = resolveUserPlan({
    subscriptionStatus: dbUser?.subscriptionStatus,
    subscriptionPlan: dbUser?.subscriptionPlan,
    trialEndsAt: dbUser?.trialEndsAt,
    subscriptionEndsAt: dbUser?.subscriptionEndsAt,
  })

  if (plan === "free") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return NextResponse.redirect(`${appUrl}/pricing?reason=connect`)
  }

  let stripeAccountId: string = dbUser?.stripeAccountId ?? ""

  if (!stripeAccountId || stripeAccountId === "") {
    const res = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "type=express",
    })
    const account = await res.json()
    stripeAccountId = account.id
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId, stripeAccountStatus: "pending" },
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const res = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      account: stripeAccountId,
      refresh_url: `${appUrl}/api/stripe/connect`,
      return_url: `${appUrl}/dashboard/payments?stripe=success`,
      type: "account_onboarding",
    }).toString(),
  })
  const accountLink = await res.json()

  if (!accountLink.url || accountLink.error) {
    console.error("Stripe account_links error:", accountLink)
    return NextResponse.json(
      { error: "Failed to create onboarding link", details: accountLink },
      { status: 500 }
    )
  }

  return NextResponse.redirect(accountLink.url)
}
