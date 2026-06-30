import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

// Wrap Better Auth's handler with request logging so we can see what's
// actually happening in production. Without this every auth call is a black
// box: Better Auth's CSRF / origin middleware returns 4xx with an opaque
// body, Vercel reports 0% errors (since 4xx isn't a server error), and the
// client shows a generic "Sign up failed".
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
  const ua = (req.headers.get("user-agent") || "").slice(0, 120)
  const started = Date.now()
  console.log(`[auth:req] ${method} ${path} origin=${origin} referer=${referer} ua="${ua}"`)
  try {
    const res = method === "GET" ? await handler.GET(req) : await handler.POST(req)
    const ms = Date.now() - started
    console.log(`[auth:res] ${method} ${path} status=${res.status} ${ms}ms`)
    // Mirror non-2xx bodies into logs so we can see the actual reason for
    // rejections. Clone the response so we don't consume the original stream.
    if (!res.ok) {
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
