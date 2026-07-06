import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { rateLimit } from "@/lib/rate-limit"
import { redeemPromoCode, PROMO_GENERIC_ERROR } from "@/lib/promo"

export const dynamic = "force-dynamic"

/**
 * POST /api/promo/redeem — { code: string }
 *
 * All failure modes except "you already have a plan" return the same generic
 * message (never a 404 vs 400 split) so the endpoint can't be used to probe
 * which codes exist. Rate limited per user: 5 attempts / hour.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Please sign in to redeem a code." }, { status: 401 })
  }

  const limited = rateLimit(`promo-redeem:${user.id}`, 5, 60 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  let code = ""
  try {
    const body = await req.json()
    code = typeof body?.code === "string" ? body.code : ""
  } catch {
    // fall through — empty code fails the generic check below
  }
  if (!code.trim()) {
    return NextResponse.json({ error: PROMO_GENERIC_ERROR }, { status: 400 })
  }

  try {
    const result = await redeemPromoCode(user.id, code)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({
      ok: true,
      plan: result.plan,
      expiresAt: result.expiresAt ? result.expiresAt.toISOString() : null,
    })
  } catch (err) {
    console.error("[promo] redeem failed:", err)
    return NextResponse.json({ error: PROMO_GENERIC_ERROR }, { status: 500 })
  }
}
