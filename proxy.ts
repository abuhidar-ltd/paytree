import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * Routes that require a signed-in session. API routes do their own auth via
 * `getCurrentUser()` in each handler, so we only gate page routes here.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/onboarding",
  "/upgrade",
  "/analytics",
  "/checkout",
  // Early login gate only. Real admin authorization (ADMIN_EMAILS allowlist) is
  // enforced server-side in lib/admin.ts via requireAdmin() in the layout/pages.
  "/admin",
]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Entry-point visit log — the ad-funnel landing paths, one line per document
 * request. This is the server-side ground truth for "who actually landed":
 * user-agent (bot vs WebView vs real browser), referrer, country, and which
 * ad click IDs arrived. Client analytics can't see bots and dies with slow
 * WebViews; this line always fires.
 */
const VISIT_LOGGED_PATHS = new Set(["/", "/register", "/login"])

// Paid click IDs worth surfacing per-visit (same set lib/analytics.ts captures).
const VISIT_CLICK_IDS = ["twclid", "rdt_cid", "fbclid", "gclid", "gbraid", "wbraid", "msclkid", "ttclid", "li_fat_id"]

const BOT_UA = /bot|crawl|spider|slurp|preview|headless|scanner|monitor|facebookexternalhit|curl\/|python|go-http|axios|wget/i

function logVisit(request: NextRequest, pathname: string): void {
  const accept = request.headers.get("accept") || ""
  // Documents only — skip prefetches, RSC payload fetches, and asset requests.
  if (request.method !== "GET" || !accept.includes("text/html")) return

  const ua = request.headers.get("user-agent") || "<none>"
  const referer = request.headers.get("referer") || "-"
  const country = request.headers.get("x-vercel-ip-country") || "-"
  const sp = request.nextUrl.searchParams
  const ids = VISIT_CLICK_IDS.filter((k) => sp.has(k))
    .map((k) => `${k}=${(sp.get(k) || "").slice(0, 16)}`)
    .join(",")
  console.log(
    `[visit] ${pathname} country=${country} bot=${BOT_UA.test(ua)} ref=${referer} ids=${ids || "-"} ua="${ua.slice(0, 140)}"`
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (VISIT_LOGGED_PATHS.has(pathname)) logVisit(request, pathname)

  // Inject x-pathname for dashboard routes that read it. Propagating request
  // headers via NextResponse.next({ request }) emits a middleware rewrite that
  // commits the HTTP status to 200, which would prevent notFound() on public
  // profile pages from returning a real 404 — so only do this on /dashboard.
  let response: NextResponse
  if (pathname.startsWith("/dashboard")) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-pathname", pathname)
    response = NextResponse.next({ request: { headers: requestHeaders } })
  } else {
    response = NextResponse.next()
  }

  // Public routes (and API routes that gate themselves) pass through.
  if (!isProtected(pathname)) {
    return response
  }

  // Protected pages: lightweight cookie presence check. The actual session
  // validation (and onboarding redirect) happens in the page/layout via
  // `getCurrentUser()`.
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
