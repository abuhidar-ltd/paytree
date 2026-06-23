import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      referralCode: true,
      referralEarnings: true,
      _count: { select: { referralsGiven: true } },
    },
  })

  const convertedReferrals = await prisma.referral.count({
    where: { referrerId: user.id, status: "converted" },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"
  const referralCode = dbUser?.referralCode ?? null

  return NextResponse.json({
    referralCode,
    // /start (not /join) — referral links get shared in DMs, on Twitter, in
    // TikTok bios. /join is on TikTok's auth-keyword safety blocklist, /start
    // is neutral. Same SignUpScreen renders either way.
    referralLink: referralCode ? `${appUrl}/start?ref=${referralCode}` : null,
    totalReferrals: dbUser?._count.referralsGiven ?? 0,
    convertedReferrals,
    totalEarnings: ((dbUser?.referralEarnings ?? 0) / 100).toFixed(2),
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { referralCode } = body as { referralCode?: string }
  if (!referralCode) return NextResponse.json({ error: "No referral code" }, { status: 400 })

  const referrer = await prisma.user.findUnique({
    where: { referralCode },
    select: { id: true },
  })

  if (!referrer) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
  if (referrer.id === user.id) return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 })

  // Idempotent — ignore if already recorded
  const existing = await prisma.referral.findUnique({
    where: { referredId: user.id },
  })
  if (existing) return NextResponse.json({ success: true })

  await Promise.all([
    prisma.referral.create({
      data: { referrerId: referrer.id, referredId: user.id, status: "pending" },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { referredBy: referralCode },
    }),
  ])

  return NextResponse.json({ success: true })
}
