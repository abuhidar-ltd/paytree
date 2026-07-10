import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeAccountId: true },
  })

  if (!dbUser?.stripeAccountId) {
    return NextResponse.json({ status: "not_connected" })
  }

  const res = await fetch(`https://api.stripe.com/v1/accounts/${dbUser.stripeAccountId}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  })
  const account = await res.json()

  if (account.charges_enabled) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountStatus: "active" },
    })
    return NextResponse.json({ status: "active", charges_enabled: true })
  }

  return NextResponse.json({ status: "pending", charges_enabled: false })
}
