import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
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

  if (!dbUser?.stripeAccountId) {
    return NextResponse.json({ status: "not_connected" })
  }

  const res = await fetch(`https://api.stripe.com/v1/accounts/${dbUser.stripeAccountId}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  })
  const account = await res.json()

  if (account.charges_enabled) {
    const plan = resolveUserPlan(dbUser)
    const platformFeePercent = plan === "ultra" ? 0 : plan === "starter" ? 5 : 0
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountStatus: "active", platformFeePercent },
    })
    return NextResponse.json({ status: "active", charges_enabled: true })
  }

  return NextResponse.json({ status: "pending", charges_enabled: false })
}
