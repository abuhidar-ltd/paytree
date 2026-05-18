import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeAccountId: null,
      stripeAccountStatus: "not_connected",
    },
  })

  return NextResponse.json({ success: true })
}
