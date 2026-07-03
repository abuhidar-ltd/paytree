/**
 * Post-authentication navigation.
 *
 * router.push() in Next.js App Router does a client-side navigation via the
 * History API plus an RSC fetch. Both work reliably in mainstream browsers —
 * but in social-app WKWebViews we've seen the RSC fetch race the Set-Cookie
 * header from the preceding /api/auth/* response: the fetch goes out without
 * the fresh session cookie, the server sees no session, and the page redirects
 * back to /login. From the user's perspective the signup just failed and they
 * bounce.
 *
 * Hard-navigation (window.location.assign) guarantees:
 *   1. The browser has fully processed the previous response's Set-Cookie.
 *   2. The next request carries the cookie.
 *   3. There's no History-API bug in the current WebView that swallows the push.
 *
 * Cost: a page flash. Worth it — the alternative is a bounce.
 */
export function hardNavigate(url: string): void {
  if (typeof window === "undefined") return
  try {
    window.location.assign(url)
  } catch {
    // Belt-and-suspenders: if assign is somehow unavailable, fall back to href.
    window.location.href = url
  }
}
