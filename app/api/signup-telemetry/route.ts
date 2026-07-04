/**
 * Receiver for lib/signup-telemetry.ts beacons.
 *
 * Prints exactly one `[signup:client] <stage> {...}` line per client-side
 * signup stage so Vercel logs can reconstruct a full signup attempt —
 * including attempts that die BEFORE any /api/auth call (the failure class
 * that caused the July 2026 zero-signup outage).
 *
 * Hardening:
 *  - field whitelist: only known keys are echoed into logs, so a malicious
 *    or buggy payload can never smuggle a password/token into log output
 *  - 2KB body cap, unknown stages dropped
 *  - always 204, never throws — this endpoint must never produce log noise
 *    of its own or give bots an error surface to probe
 */

import { rateLimit, getClientIp } from "@/lib/rate-limit"

const STAGES = new Set([
  "hydrated",
  "step_done",
  "validation_failed",
  "submit",
  "submit_result",
])

// The only step values the signup flow emits. Persisting anything else would
// let a bot mint unbounded distinct groupBy keys in the admin dashboard.
const STEPS = new Set(["name", "email", "password"])

// Only these keys are ever written to logs. Everything else is discarded.
const FIELD_WHITELIST = [
  "ms",
  "step",
  "reason",
  "detail",
  "code",
  "status",
  "attempt",
  "ok",
  "recovered",
] as const

export async function POST(req: Request) {
  try {
    // A real signup emits ~8 beacons; 40/min per IP is generous headroom while
    // capping what a curl loop can write to the DB. Always 204 — never give
    // abusers a distinguishable rejection signal.
    if (!rateLimit(`signup-telemetry:${getClientIp(req)}`, 40, 60_000).ok) {
      return new Response(null, { status: 204 })
    }

    const raw = await req.text()
    if (raw.length === 0 || raw.length > 2048) return new Response(null, { status: 204 })

    const data = JSON.parse(raw) as Record<string, unknown>
    const stage = typeof data.stage === "string" ? data.stage : ""
    if (!STAGES.has(stage)) return new Response(null, { status: 204 })

    const fields: Record<string, string | number | boolean | null> = {}
    for (const key of FIELD_WHITELIST) {
      const v = data[key]
      if (typeof v === "number" || typeof v === "boolean" || v === null) fields[key] = v
      else if (typeof v === "string") fields[key] = v.slice(0, 80)
    }
    fields.country = req.headers.get("x-vercel-ip-country") || "-"
    fields.ua = (req.headers.get("user-agent") || "").slice(0, 140)

    console.log(`[signup:client] ${stage}`, JSON.stringify(fields))

    // Persist for /admin (hydration-time distribution + signup step funnel).
    // Console lines expire; these rows are the queryable record. Same 204
    // contract: a DB failure is swallowed — telemetry must never error out.
    const { prisma } = await import("@/lib/prisma")
    await prisma.signupTelemetry
      .create({
        data: {
          event: stage,
          ms: typeof fields.ms === "number" && Number.isFinite(fields.ms) ? Math.round(fields.ms) : null,
          step: typeof fields.step === "string" && STEPS.has(fields.step) ? fields.step : null,
          ok: typeof fields.ok === "boolean" ? fields.ok : null,
          country: fields.country === "-" ? null : String(fields.country),
          ua: String(fields.ua),
        },
      })
      .catch((err) => console.error("[signup:client] persist failed:", err))
  } catch {
    // Malformed beacon — drop silently.
  }
  return new Response(null, { status: 204 })
}
