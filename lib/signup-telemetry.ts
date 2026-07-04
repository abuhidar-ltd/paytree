/**
 * Signup client-stage telemetry → server logs.
 *
 * The July 2026 outage was invisible in server logs because the failure lived
 * entirely client-side: users' pre-hydration keystrokes were erased and no
 * request ever left the page. console.log in a client component only reaches
 * the user's own browser console — never Vercel. This module beacons each
 * client-side stage of the signup flow to /api/signup-telemetry, which prints
 * one `[signup:client]` line per stage so a whole attempt reads as a story:
 *
 *   [visit] /register ...                      (middleware — page requested)
 *   [signup:client] hydrated {"ms":2100,...}   (form became interactive)
 *   [signup:client] step_done {"step":"name"}
 *   [signup:client] step_done {"step":"email"}
 *   [signup:client] submit {"attempt":0}
 *   [auth:req] POST /api/auth/sign-up/email    (server received request)
 *   [signup] user.create.before ...            (auth hooks)
 *   [signup:client] submit_result {"ok":true}
 *
 * Fire-and-forget: sendBeacon (survives the hard navigation to /onboarding),
 * falling back to keepalive fetch. Must NEVER throw or block the flow.
 * No secrets: stages carry step names, error codes, and timings — no
 * passwords, no emails, no tokens.
 */

export type SignupStage =
  | "hydrated"          // form interactive; ms = time the SSR form was inert
  | "step_done"         // { step: name|email }
  | "validation_failed" // { step, reason }
  | "submit"            // { attempt }
  | "submit_result"     // { ok, code?, status?, reason?, detail?, recovered? }

export type StageDetail = Record<string, string | number | boolean | null | undefined>

export function logSignupStage(stage: SignupStage, detail: StageDetail = {}): void {
  if (typeof window === "undefined") return
  try {
    const body = JSON.stringify({ stage, ...detail })
    const url = "/api/signup-telemetry"
    if (typeof navigator.sendBeacon === "function") {
      // sendBeacon returns false when the queue is full — fall through to fetch.
      if (navigator.sendBeacon(url, body)) return
    }
    void fetch(url, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => {})
  } catch {
    // Telemetry must never interfere with the signup itself.
  }
}
