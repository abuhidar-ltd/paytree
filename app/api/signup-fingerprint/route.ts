/**
 * Receiver for lib/device-fingerprint.ts beacons — attaches the client-side
 * FingerprintJS deviceHash to the SignupFingerprint row the auth hook created
 * moments earlier (lib/auth.ts user.create.after).
 *
 * Same contract as /api/signup-telemetry: always 204, never throws, never
 * gives probers an error surface. Hardening on top of that:
 *  - session-gated: the beacon rides the signup's fresh session cookie, so
 *    the hash can only ever attach to the caller's OWN account
 *  - write-once: only accepted while deviceHash is null AND the account is
 *    < 1h old — a fraudster can't later overwrite their hash with junk to
 *    unlink their cluster, and ordinary logins never touch this
 *  - format-validated: FingerprintJS visitorIds are hex; anything else drops
 */

import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/get-user"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const DEVICE_HASH_RE = /^[a-f0-9]{16,64}$/i
const ACCEPT_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  try {
    if (!rateLimit(`signup-fingerprint:${getClientIp(req)}`, 10, 60_000).ok) {
      return new Response(null, { status: 204 })
    }

    const raw = await req.text()
    if (raw.length === 0 || raw.length > 512) return new Response(null, { status: 204 })

    const data = JSON.parse(raw) as Record<string, unknown>
    const deviceHash = typeof data.deviceHash === "string" ? data.deviceHash.toLowerCase() : ""
    if (!DEVICE_HASH_RE.test(deviceHash)) return new Response(null, { status: 204 })

    const userId = await getUserId()
    if (!userId) return new Response(null, { status: 204 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, signupFingerprint: { select: { deviceHash: true } } },
    })
    if (!user) return new Response(null, { status: 204 })
    if (Date.now() - user.createdAt.getTime() > ACCEPT_WINDOW_MS) {
      return new Response(null, { status: 204 })
    }
    if (user.signupFingerprint?.deviceHash) return new Response(null, { status: 204 })

    // Upsert, not update: covers the rare row-less case (hook had no request
    // ctx, or the beacon somehow beat the hook's write). IP/geo/UA from THIS
    // request are equivalent — it's the same device seconds after signup.
    const h = req.headers
    await prisma.signupFingerprint.upsert({
      where: { userId },
      update: { deviceHash },
      create: {
        userId,
        deviceHash,
        ip: (h.get("x-forwarded-for") || "").split(",")[0]?.trim() || null,
        country: h.get("x-vercel-ip-country") || null,
        region: h.get("x-vercel-ip-country-region") || null,
        city: decodeGeoHeader(h.get("x-vercel-ip-city")),
        latitude: parseCoord(h.get("x-vercel-ip-latitude")),
        longitude: parseCoord(h.get("x-vercel-ip-longitude")),
        userAgent: (h.get("user-agent") || "").slice(0, 500) || null,
      },
    })
    console.log(`[signup] fingerprint device=${deviceHash.slice(0, 12)}… userId=${userId}`)
  } catch {
    // Malformed beacon or DB hiccup — drop silently, same as signup-telemetry.
  }
  return new Response(null, { status: 204 })
}

function decodeGeoHeader(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function parseCoord(value: string | null): number | null {
  if (!value) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
