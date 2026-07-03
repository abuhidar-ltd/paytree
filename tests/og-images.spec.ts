import { test, expect } from "@playwright/test"

/**
 * OG image routes must never silently break again.
 *
 * History: 679 of 1,021 requests to /opengraph-image + /twitter-image threw
 * (Jun 26 – Jul 2) — Satori "Expected <div> to have explicit display:flex"
 * plus a dynamic-font 400 for the ✦ glyph. Every social share of paytree.to
 * had a broken preview. After that we swapped the Satori route for a static
 * PNG served via Next's file convention (app/opengraph-image.png,
 * app/twitter-image.png) — no runtime rendering, no glyph traps.
 *
 * The convention URL includes the .png suffix; Next appends a query-string
 * hash for cache-busting which we ignore in the test.
 */

const PNG_MAGIC = "89504e470d0a1a0a"

const OG_ROUTES = ["/opengraph-image.png", "/twitter-image.png"]

for (const route of OG_ROUTES) {
  test(`${route} renders a real PNG`, async ({ request }) => {
    const res = await request.get(route)
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toContain("image/png")
    const body = await res.body()
    expect(body.subarray(0, 8).toString("hex")).toBe(PNG_MAGIC)
    // A rendered 1200x630 card is tens of KB; an error page or empty body isn't.
    expect(body.byteLength).toBeGreaterThan(10_000)
  })
}

for (const route of ["/icon", "/apple-icon"]) {
  test(`${route} renders a real PNG`, async ({ request }) => {
    const res = await request.get(route)
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toContain("image/png")
    const body = await res.body()
    expect(body.subarray(0, 8).toString("hex")).toBe(PNG_MAGIC)
  })
}
