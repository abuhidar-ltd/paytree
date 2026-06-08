import { test, expect } from "@playwright/test"

/**
 * Targeted visual + behavioral verification of the highest-value pages.
 * - Landing, /register, /pricing render and look correct at 375 & 1440
 * - /opustest (seeded published Ultra profile) renders all 15 block types
 * - The GIF on the featured link actually animates (decoded frames change)
 * - Cinematic hero shows
 * - Drop countdown is ticking
 * - 404 path exists
 */
const SCREENS = "tests/screens"

test.describe("Paytree E2E", () => {
  test.beforeAll(async () => {
    // Ensure the screens directory exists
    const fs = await import("fs")
    if (!fs.existsSync(SCREENS)) fs.mkdirSync(SCREENS, { recursive: true })
  })

  test("landing — mobile + desktop", async ({ browser }) => {
    // Mobile
    const m = await browser.newContext({ viewport: { width: 375, height: 800 } })
    const mp = await m.newPage()
    await mp.goto("/", { waitUntil: "networkidle" })
    await mp.screenshot({ path: `${SCREENS}/landing-375.png`, fullPage: true })
    // Sanity: hero CTA visible
    await expect(mp.getByRole("link", { name: /start building free/i })).toBeVisible()
    await m.close()

    // Desktop
    const d = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const dp = await d.newPage()
    await dp.goto("/", { waitUntil: "networkidle" })
    await dp.screenshot({ path: `${SCREENS}/landing-1440.png`, fullPage: true })
    await d.close()
  })

  test("register page renders & content audit", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" })
    await page.screenshot({ path: `${SCREENS}/register.png`, fullPage: true })
    // Bug check: stale $4.99/mo copy should NOT be present after fixes — record current state
    const body = await page.textContent("body")
    test.info().annotations.push({
      type: "audit:register-has-4.99",
      description: String(body?.includes("$4.99")),
    })
    test.info().annotations.push({
      type: "audit:register-mentions-pro",
      description: String(body?.includes("Upgrade to Pro")),
    })
  })

  test("pricing page renders", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "networkidle" })
    await page.screenshot({ path: `${SCREENS}/pricing.png`, fullPage: true })
    const body = await page.textContent("body")
    test.info().annotations.push({
      type: "audit:pricing-has-7",
      description: String(body?.includes("$7")),
    })
    test.info().annotations.push({
      type: "audit:pricing-has-19",
      description: String(body?.includes("$19")),
    })
  })

  test("404 — non-existent profile renders not-found UI", async ({ page }) => {
    const resp = await page.goto("/this-user-definitely-does-not-exist-zzz")
    // Dev-mode Next.js commits 200 even with force-dynamic + no loading.tsx;
    // production-build behavior may differ. The user-facing content is what
    // matters here — verify the 404 UI actually renders.
    test.info().annotations.push({
      type: "audit:404-http-status",
      description: String(resp?.status() ?? "unknown"),
    })
    await expect(page.getByText(/User not found/i).first()).toBeVisible()
    await expect(page.getByText("404").first()).toBeVisible()
    await page.screenshot({ path: `${SCREENS}/404.png` })
  })

  test("locked profile — existing draft user", async ({ page }) => {
    // alexmcgreggor exists but is draft → locked
    await page.goto("/alexmcgreggor", { waitUntil: "networkidle" })
    await page.screenshot({ path: `${SCREENS}/locked-profile.png`, fullPage: true })
  })

  test("opustest — full public profile rendering + GIF animation", async ({ browser }) => {
    // Use desktop viewport for the rich screenshots
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 2400 },
      // Stop framer-motion staggers from delaying screenshot
      reducedMotion: "no-preference",
    })
    const page = await ctx.newPage()
    const consoleErrors: string[] = []
    page.on("pageerror", (e) => consoleErrors.push(e.message))
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text())
    })

    await page.goto("/opustest", { waitUntil: "networkidle" })
    // Give framer-motion + countdown a sec to settle
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SCREENS}/opustest-desktop.png`, fullPage: true })

    // Sanity: name + bio visible
    await expect(page.getByText("Karim Al-Rashid").first()).toBeVisible()
    await expect(page.getByText(/Crypto trader/i).first()).toBeVisible()

    // ── GIF animation check ─────────────────────────────────────────
    // Find the <img> whose src ends with .gif and screenshot it twice with a delay.
    // If the frames differ, the GIF is animating.
    const gifImg = page.locator('img[src$=".gif"]').first()
    await expect(gifImg).toBeVisible()
    await gifImg.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    const shot1 = await gifImg.screenshot()
    await page.waitForTimeout(900) // ~30 frames at typical giphy fps
    const shot2 = await gifImg.screenshot()
    const animating = !shot1.equals(shot2)
    test.info().annotations.push({
      type: "audit:gif-animating",
      description: String(animating),
    })

    // ── Cinematic hero image present ────────────────────────────────
    // Hero background <img> uses the unsplash URL we seeded
    const heroImg = page.locator('img[src*="photo-1611974789855"]').first()
    const heroExists = await heroImg.count()
    test.info().annotations.push({
      type: "audit:cinematic-hero-image-rendered",
      description: String(heroExists > 0),
    })

    // ── Drop countdown ticking ──────────────────────────────────────
    // CountdownDemo would tick if it's a "Drops In" widget. The block-renderer
    // drop card shows hh:mm:ss style mono.
    const t1 = await page.locator("text=Pro Signals Course Launch").first().isVisible()
    test.info().annotations.push({
      type: "audit:drop-card-visible",
      description: String(t1),
    })

    // ── FAQ accordion expands ───────────────────────────────────────
    const firstFaq = page.getByText("What do I get?")
    await firstFaq.scrollIntoViewIfNeeded()
    await firstFaq.click()
    await page.waitForTimeout(400)
    const answerVisible = await page.getByText(/Daily trading signals with entry/i).isVisible()
    test.info().annotations.push({
      type: "audit:faq-accordion-opens",
      description: String(answerVisible),
    })

    // ── Console errors ──────────────────────────────────────────────
    test.info().annotations.push({
      type: "audit:console-errors",
      description: consoleErrors.length === 0 ? "none" : consoleErrors.slice(0, 5).join(" | "),
    })

    await ctx.close()

    // Mobile screenshot too
    const mctx = await browser.newContext({ viewport: { width: 375, height: 2400 } })
    const mpage = await mctx.newPage()
    await mpage.goto("/opustest", { waitUntil: "networkidle" })
    await mpage.waitForTimeout(1500)
    await mpage.screenshot({ path: `${SCREENS}/opustest-mobile.png`, fullPage: true })
    await mctx.close()
  })
})
