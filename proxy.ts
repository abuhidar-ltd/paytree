import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import { rateLimit } from "@/lib/rate-limit"

// Partner-affiliate first-touch cookie.
//   - Set on any page load with `?ref=<slug>` if the visitor doesn't already
//     have `ptaff` (never overwrite — the FIRST partner they touched wins).
//   - Slug is DB-validated against an ACTIVE Affiliate before the cookie is
//     issued. Invalid / inactive refs are silently ignored.
//   - 90-day expiry, httpOnly, lax same-site — this is server-consumed at
//     signup, no client access needed.
const PTAFF_COOKIE = "ptaff"
const PTAFF_MAX_AGE_S = 60 * 60 * 24 * 90 // 90 days
const PTAFF_SLUG_RE = /^[a-z0-9-]{1,40}$/

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

function logVisit(request: NextRequest, pathname: string, event: NextFetchEvent): void {
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
  const bot = BOT_UA.test(ua)
  console.log(
    `[visit] ${pathname} country=${country} bot=${bot} ref=${referer} ids=${ids || "-"} ua="${ua.slice(0, 140)}"`
  )

  // Persist the same line as a Visit row — console logs expire, /admin queries
  // these. waitUntil keeps the write off the request's critical path; a DB
  // hiccup must never break a landing-page load, hence the swallowed catch.
  // (proxy.ts runs on the Node runtime in Next 16, so Prisma is available;
  // the dynamic import keeps it un-evaluated for the 3 logged paths' misses.)
  // Per-IP cap so a landing-page flood can't turn into unbounded Neon writes —
  // the console line above still fires for every request (free, ephemeral).
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "unknown"
  if (!rateLimit(`visit:${ip}`, 30, 60_000).ok) return

  event.waitUntil(
    import("@/lib/prisma")
      .then(({ prisma }) =>
        prisma.visit.create({
          data: {
            path: pathname,
            country: country === "-" ? null : country,
            bot,
            referrer: referer === "-" ? null : referer.slice(0, 300),
            clickIds: ids || null,
            ua: ua.slice(0, 300),
          },
        })
      )
      .catch((err) => console.error("[visit] persist failed:", err))
  )
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl

  if (VISIT_LOGGED_PATHS.has(pathname)) logVisit(request, pathname, event)

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

  // Attribution cookie — first-touch, never overwrites. Runs on every path
  // (partners often link straight to `/pricing`, `/sara`, etc.), gated on
  // cheap conditions first so the sync fast path stays fast: no ?ref, or
  // already-set cookie, or malformed slug → no DB call.
  await maybeSetPtaffCookie(request, response)

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

async function maybeSetPtaffCookie(request: NextRequest, response: NextResponse): Promise<void> {
  const rawRef = request.nextUrl.searchParams.get("ref")
  if (!rawRef) return
  if (request.cookies.get(PTAFF_COOKIE)) return

  const slug = rawRef.trim().toLowerCase()
  if (!PTAFF_SLUG_RE.test(slug)) return

  // DB-validate the slug is an active partner. A single indexed lookup on the
  // first partner-referred hit only — subsequent hits skip on the cookie check
  // above. Errors are swallowed: attribution must never break the page.
  try {
    const { prisma } = await import("@/lib/prisma")
    const found = await prisma.affiliate.findFirst({
      where: { slug, active: true },
      select: { id: true },
    })
    if (!found) return
    response.cookies.set(PTAFF_COOKIE, slug, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: PTAFF_MAX_AGE_S,
    })
    console.log(`[ptaff] set slug=${slug}`)
  } catch (err) {
    console.error("[ptaff] lookup failed:", err)
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
