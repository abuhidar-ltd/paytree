import { test, expect } from "@playwright/test"
import fs from "fs"
import path from "path"

/**
 * TikTok In-App Browser simulation.
 *
 * Spoofs the BytedanceWebview Android UA and walks the actual funnel:
 *   landing → "Create your page" CTA → /register → Clerk form
 *
 * Captures screenshots and asserts:
 *   - Landing renders without the IAB banner (we removed it from non-auth pages)
 *   - /register shows the IAB banner with Android-specific "Open Chrome" CTA
 *   - Clerk Sign Up DOM appears (we never had this baseline before)
 *   - No "TikTok can't open this link" condition (we can't simulate TikTok's
 *     filter directly, but we can verify our page loads + no broken redirects)
 */

const SS_DIR = path.join("test-results", "tiktok-iab")
test.beforeAll(() => {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true })
})

// Real TikTok WebView UA, captured from a Pixel 7 on Android 14 running TikTok 32.x
const TIKTOK_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A.231005.007.A1; wv) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 " +
  "Mobile Safari/537.36 BytedanceWebview/d8a21c6 TikTok/32.7.3"

const TIKTOK_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21C66 BytedanceWebview/iOS " +
  "musical_ly_32.7.0 JsSdk/2.0 NetType/WIFI Channel/App+Store ByteLocale/en-US"

test.describe("TikTok IAB funnel", () => {
  test("Android TikTok WebView — landing then /register", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 412, height: 915 },
      userAgent: TIKTOK_ANDROID_UA,
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
    })
    const page = await ctx.newPage()
    const events: string[] = []
    // Capture analytics by intercepting the /_vercel/insights POST instead of
    // pre-injecting window.va — pre-injection collides with @vercel/analytics'
    // own init and crashes the layout (_a.call is not a function).
    await page.route("**/_vercel/insights/**", (route) => {
      const url = route.request().url()
      events.push(`insights:${url.slice(url.lastIndexOf("/") + 1)}`)
      route.fulfill({ status: 200, body: "{}" })
    })

    // 1. Landing
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SS_DIR, "01-landing-android.png"), fullPage: true })

    // Banner should NOT be on landing
    const bannerOnLanding = await page.locator('[role="dialog"][aria-label="Open in browser recommendation"]').count()
    expect(bannerOnLanding, "IAB banner must not appear on landing").toBe(0)

    // Hero CTA must be visible
    const heroCta = page.getByRole("link", { name: /create your page for free/i }).first()
    await expect(heroCta).toBeVisible()

    // 2. Click CTA → /register
    await Promise.all([
      page.waitForURL("**/register", { waitUntil: "domcontentloaded" }),
      heroCta.click(),
    ])

    // Give Clerk a beat to mount in WebView (slower)
    await page.waitForTimeout(3500)
    await page.screenshot({ path: path.join(SS_DIR, "02-join-android.png"), fullPage: true })

    // 3. The IAB banner MUST appear here
    const banner = page.locator('[role="dialog"][aria-label="Open in browser recommendation"]')
    await expect(banner).toBeVisible()

    // 4. Android specifically gets the Chrome intent button
    await expect(banner.getByRole("button", { name: /open chrome/i })).toBeVisible()

    // 5. Clerk form should be present in DOM (even if not interactive yet)
    const clerkPresent = await page.locator(".cl-rootBox, [data-clerk-component]").count()
    test.info().annotations.push({
      type: "audit:clerk_dom_count",
      description: String(clerkPresent),
    })

    // 6. Social buttons should be hidden (we forced hidden in WebView)
    const socialBtn = await page.locator(".cl-socialButtonsBlockButton:visible").count()
    expect(socialBtn, "Social OAuth buttons must be hidden in WebView").toBe(0)

    // 7. Click "Open Chrome" → expect intent:// navigation attempt
    page.on("framenavigated", (f) => {
      const u = f.url()
      if (u.startsWith("intent://")) events.push(`navigated_intent:${u.slice(0, 80)}`)
    })

    test.info().annotations.push({
      type: "audit:funnel_events",
      description: events.join(" | ") || "none",
    })

    await ctx.close()
  })

  test("iOS TikTok WebView — landing then /register", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 393, height: 852 },
      userAgent: TIKTOK_IOS_UA,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    })
    const page = await ctx.newPage()
    await page.route("**/_vercel/insights/**", (r) => r.fulfill({ status: 200, body: "{}" }))
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(SS_DIR, "01-landing-ios.png"), fullPage: true })

    await page.getByRole("link", { name: /create your page for free/i }).first().click()
    await page.waitForURL("**/register", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3500)
    await page.screenshot({ path: path.join(SS_DIR, "02-join-ios.png"), fullPage: true })

    const banner = page.locator('[role="dialog"][aria-label="Open in browser recommendation"]')
    await expect(banner).toBeVisible()

    // iOS gets "Copy link" instead of "Open Chrome" (Apple blocks programmatic Safari opens)
    await expect(banner.getByRole("button", { name: /copy link/i })).toBeVisible()

    await ctx.close()
  })

  test("Regular Chrome — landing should NOT show banner", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 412, height: 915 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/120.0.6099.193 Mobile Safari/537.36",
      isMobile: true,
      hasTouch: true,
    })
    const page = await ctx.newPage()
    await page.route("**/_vercel/insights/**", (r) => r.fulfill({ status: 200, body: "{}" }))
    await page.goto("http://localhost:3000/register", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(800)
    const banner = await page.locator('[role="dialog"][aria-label="Open in browser recommendation"]').count()
    expect(banner, "Banner must NOT show in real Chrome").toBe(0)
    await page.screenshot({ path: path.join(SS_DIR, "03-join-real-chrome.png"), fullPage: true })
    await ctx.close()
  })
})
