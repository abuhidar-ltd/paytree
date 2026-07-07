import { auth } from "@/lib/auth"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

/**
 * Lightweight poll target for /verify-pending: "has my email been verified
 * yet?" for the CALLER'S OWN session — one indexed session lookup, no body,
 * no params, so there is nothing to enumerate.
 *
 * Lives at a static path under /api/auth/ on purpose: Next routes it ahead
 * of Better Auth's [...all] catch-all.
 *
 * The client polls every 4s; 40/min per IP leaves headroom for the
 * visibilitychange-triggered immediate checks without letting a scripted
 * client turn this into a session-oracle firehose.
 */
export async function GET(req: Request) {
  if (!rateLimit(`check-verified:${getClientIp(req)}`, 40, 60_000).ok) {
    return Response.json({ verified: false }, { status: 429 })
  }

  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    return Response.json({ verified: false }, { status: 401 })
  }

  return Response.json(
    { verified: session.user.emailVerified },
    { headers: { "Cache-Control": "no-store" } }
  )
}
