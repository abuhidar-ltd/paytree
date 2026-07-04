import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

// Wrap Better Auth's handler with request logging so production auth calls
// aren't a black box: Better Auth's CSRF / origin middleware returns 4xx with
// an opaque body, Vercel reports 0% errors (4xx isn't a server error), and
// the client shows a generic "Sign up failed".
//
// Noise policy (this endpoint serves get-session on nearly every page view):
//   - POSTs (sign-up, sign-in, sign-out, callbacks) — always logged
//   - GETs — logged only when they fail (non-2xx)
//   - non-2xx bodies are mirrored into the log so the failing step's actual
//     error code/message is readable without re-diagnosing
const handler = toNextJsHandler(auth)

function pathOf(req: Request): string {
  try {
    return new URL(req.url).pathname
  } catch {
    return "<unparseable>"
  }
}

async function logged(method: "GET" | "POST", req: Request): Promise<Response> {
  const path = pathOf(req)
  const origin = req.headers.get("origin") || "<none>"
  const referer = req.headers.get("referer") || "<none>"
  const country = req.headers.get("x-vercel-ip-country") || "-"
  const ua = (req.headers.get("user-agent") || "").slice(0, 140)
  const started = Date.now()
  if (method === "POST") {
    console.log(`[auth:req] POST ${path} origin=${origin} referer=${referer} country=${country} ua="${ua}"`)
  }
  try {
    const res = method === "GET" ? await handler.GET(req) : await handler.POST(req)
    const ms = Date.now() - started
    if (method === "POST" || !res.ok) {
      console.log(`[auth:res] ${method} ${path} status=${res.status} ${ms}ms`)
    }
    if (!res.ok) {
      // Mirror the failure body so the real reason (INVALID_ORIGIN,
      // USER_ALREADY_EXISTS, ...) is in the log line, not just a status code.
      try {
        const bodyText = await res.clone().text()
        console.log(`[auth:res:body] ${method} ${path} ${res.status} body=${bodyText.slice(0, 500)}`)
      } catch {
        // body unreadable (already consumed / not text) — skip
      }
    }
    return res
  } catch (err) {
    const ms = Date.now() - started
    console.error(`[auth:err] ${method} ${path} threw after ${ms}ms:`, err)
    throw err
  }
}

export async function POST(req: Request) {
  return logged("POST", req)
}

export async function GET(req: Request) {
  return logged("GET", req)
}
