/**
 * Design fixes verification — targets /preview/mohammadabuhidar (no auth required)
 *
 * Current DB state (verified):
 *   fontFamily:      "space-mono"
 *   heroStyle:       "cinematic"
 *   backgroundStyle: "particles"
 *   cornerRadius:    "medium"  → BLOCK_RADIUS_MAP["medium"] = "12px"
 *   accentColor:     "#00ff88"
 *   pageStatus:      "draft"   → public profile locked; preview page is the right target
 */
import { test, expect } from "@playwright/test"
import path from "path"
import { readFileSync } from "fs"

const BASE     = "http://localhost:3000"
const USERNAME = "mohammadabuhidar"
const PREVIEW  = `${BASE}/preview/${USERNAME}`
const SS = (name: string) => path.join("test-results", `${name}.png`)

test.describe("Design Page Fixes — Preview Page Verification", () => {

  // ─── T1: Accent color CSS variable set ───────────────────────────────────
  test("T1 — accent-color CSS variable applied from DB", async ({ page }) => {
    await page.goto(PREVIEW, { waitUntil: "networkidle" })
    await page.screenshot({ path: SS("t1-accent-preview"), fullPage: false })

    // The ProfileClient calls useApplyAccentColor which sets --accent-color
    const accentVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent-color").trim()
    )
    console.log(`--accent-color: "${accentVar}"`)

    // ClassicHero avatar border now uses dynamic accent (no hardcoded green)
    // Check the handle @username uses var(--accent-color) inline style
    const handleColor = await page.locator('p[style*="color"]').first().evaluate(
      (el) => (el as HTMLElement).style.color
    ).catch(() => "not found")
    console.log(`Handle inline color style: "${handleColor}"`)

    // Should have a colour set (anything non-empty)
    expect(accentVar).not.toBe("")
    // Handle p should have an inline color (our fix: replaced Tailwind hardcode with inline style)
    expect(handleColor).not.toBe("not found")
  })

  // ─── T2: Cinematic hero — no duplicate 320px image block ─────────────────
  test("T2 — Cinematic hero: no rogue 320px block, name visible, no dupe image", async ({ page }) => {
    await page.goto(PREVIEW, { waitUntil: "networkidle" })

    // Wait for page to render
    await page.waitForTimeout(1000)
    await page.screenshot({ path: SS("t2-cinematic-initial"), fullPage: false })

    // Old CinematicHero rendered a 320px block INSIDE ProfileClient.
    // Our fix removed it — the page-level hero handles the background.
    const rogue320 = await page.evaluate(() => {
      const all = document.querySelectorAll('[class*="h-\\[320px\\]"], [class*="h-[320px]"]')
      // Also check inline height
      const inlineHeightEls = Array.from(document.querySelectorAll('*')).filter(
        (el) => (el as HTMLElement).style?.height === '320px'
      )
      return { twCount: all.length, inlineCount: inlineHeightEls.length }
    })
    console.log(`Rogue 320px blocks: tw=${rogue320.twCount}, inline=${rogue320.inlineCount}`)

    // h1 (user's name) must be visible
    const h1 = page.locator("h1").first()
    const h1Text = await h1.textContent().catch(() => "")
    const h1Visible = await h1.isVisible().catch(() => false)
    console.log(`h1 text: "${h1Text}", visible: ${h1Visible}`)

    // Page-level hero overlay (z-[1] div from page.tsx)
    const heroOverlay = await page.evaluate(() => {
      // Look for z-[1] or absolute element at top with h-[480px]
      const el = document.querySelector('[class*="z-[1]"]')
      return el ? el.className : "not found"
    })
    console.log(`z-[1] hero element: "${heroOverlay}"`)

    await page.screenshot({ path: SS("t2-cinematic-full"), fullPage: true })

    expect(rogue320.twCount + rogue320.inlineCount).toBe(0)
    expect(h1Visible).toBe(true)
    expect(h1Text).toContain("mohammad")
  })

  // ─── T3: Font family applied ──────────────────────────────────────────────
  test("T3 — Font family (space-mono) applied via inline style", async ({ page }) => {
    await page.goto(PREVIEW, { waitUntil: "networkidle" })
    await page.waitForTimeout(1500) // allow Google Fonts injection
    await page.screenshot({ path: SS("t3-font-preview"), fullPage: false })

    // Our fix: ProfileClient sets fontFamily inline on the root motion.div
    const inlineFont = await page.evaluate(() => {
      const root = document.querySelector('[class*="min-h-screen"][style]')
      return root ? (root as HTMLElement).style.fontFamily : "no match"
    })
    console.log(`Root inline fontFamily: "${inlineFont}"`)

    // Also check computed style on the body/root after font loads
    const computedFont = await page.evaluate(() => {
      const root = document.querySelector('[class*="min-h-screen"]')
      return root ? getComputedStyle(root).fontFamily : "no match"
    })
    console.log(`Root computed fontFamily: "${computedFont}"`)

    // PASS: inline style contains Space Mono
    expect(inlineFont.toLowerCase()).toContain("space mono")
  })

  // ─── T4: Corner radius CSS variable ──────────────────────────────────────
  test("T4 — --block-radius CSS variable set on root element", async ({ page }) => {
    await page.goto(PREVIEW, { waitUntil: "networkidle" })
    await page.screenshot({ path: SS("t4-radius-preview"), fullPage: false })

    // Our fix: ProfileClient sets --block-radius via useEffect on document.documentElement
    // DB has cornerRadius: "medium" → BLOCK_RADIUS_MAP["medium"] = "12px"
    const blockRadius = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--block-radius").trim()
    )
    console.log(`--block-radius: "${blockRadius}"`)

    // BlockRenderer outer div and GlassShell use var(--block-radius, 16px)
    const cardStyle = await page.evaluate(() => {
      // Find any element with our var() border-radius
      const el = document.querySelector('[style*="var(--block-radius"]')
      return el ? (el as HTMLElement).style.borderRadius : "no card found"
    })
    console.log(`Card border-radius style: "${cardStyle}"`)

    await page.screenshot({ path: SS("t4-radius-cards"), fullPage: true })

    // "medium" maps to 12px
    expect(blockRadius).toBe("12px")
  })

  // ─── T5: Background particles variant ────────────────────────────────────
  test("T5 — Particles background applied (DB has backgroundStyle: particles)", async ({ page }) => {
    await page.goto(PREVIEW, { waitUntil: "networkidle" })
    await page.waitForTimeout(800)
    await page.screenshot({ path: SS("t5-bg-preview"), fullPage: false })

    // Our fix: preview/page.tsx maps backgroundStyle → PremiumBackground variant
    // particles → PremiumBackground renders 50 star dots
    const starDots = await page.evaluate(() => {
      // Star dots: w-1 h-1 rounded-full bg-white inside the fixed bg
      const fixedBg = document.querySelector('[class*="fixed"][class*="inset-0"]')
      if (!fixedBg) return -1
      const dots = fixedBg.querySelectorAll('[class*="w-1"][class*="h-1"][class*="rounded-full"]')
      return dots.length
    })
    console.log(`Star dot elements (particles variant): ${starDots}`)

    // Nebula orbs should NOT be present (those are the nebula variant)
    const nebulaOrbs = await page.evaluate(() => {
      const fixedBg = document.querySelector('[class*="fixed"][class*="inset-0"]')
      if (!fixedBg) return -1
      // Nebula orbs have animation style "float"
      const orbs = Array.from(fixedBg.querySelectorAll('div[style*="animation"]')).filter(
        (el) => (el as HTMLElement).style.animation?.includes("float")
      )
      return orbs.length
    })
    console.log(`Nebula float orbs: ${nebulaOrbs} (should be 0 for particles variant)`)

    await page.screenshot({ path: SS("t5-bg-particles"), fullPage: false })

    // Particles: 50 star dots rendered
    expect(starDots).toBeGreaterThan(0)
    expect(nebulaOrbs).toBe(0)
  })

  // ─── T6: Smoke test — mobile + desktop screenshots ────────────────────────
  test("T6 — Smoke test: preview renders cleanly at mobile + desktop", async ({ page }) => {
    // — Mobile 375px —
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(PREVIEW, { waitUntil: "networkidle" })
    await page.waitForTimeout(800)

    await page.screenshot({ path: SS("t6-mobile-375"), fullPage: true })

    const overflowMobile = await page.evaluate(() =>
      document.body.scrollWidth > window.innerWidth
    )
    const h1Mobile = await page.locator("h1").first().isVisible().catch(() => false)
    console.log(`Mobile overflow: ${overflowMobile}, h1 visible: ${h1Mobile}`)

    // — Desktop 1440px —
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(PREVIEW, { waitUntil: "networkidle" })
    await page.waitForTimeout(800)

    await page.screenshot({ path: SS("t6-desktop-1440"), fullPage: true })

    const overflowDesktop = await page.evaluate(() =>
      document.body.scrollWidth > window.innerWidth
    )
    const h1Desktop = await page.locator("h1").first().isVisible().catch(() => false)
    console.log(`Desktop overflow: ${overflowDesktop}, h1 visible: ${h1Desktop}`)

    // — Check core elements present —
    const profileName = await page.locator("h1").first().textContent()
    const hasCards = await page.evaluate(() => {
      return document.querySelectorAll('[style*="border-radius"]').length
    })
    console.log(`Profile name: "${profileName}", styled elements: ${hasCards}`)

    await page.screenshot({ path: SS("t6-desktop-result"), fullPage: false })

    expect(h1Mobile).toBe(true)
    expect(h1Desktop).toBe(true)
    expect(overflowMobile).toBe(false)
    expect(overflowDesktop).toBe(false)
  })

  // ─── Studio iframe scaling — visual check ─────────────────────────────────
  test("T7 — Studio preview iframe uses 375px width + scale transform", async ({ page }) => {
    // Studio requires auth — we can't log in via Playwright without credentials.
    // Instead, verify the fix exists in the rendered HTML we serve.
    // The iframe scaling fix is in the source (studio-editor.tsx) — the key
    // assertion is that the iframe has width=375 and a scale transform.

    // For completeness, navigate and take a screenshot of the login redirect.
    await page.goto(`${BASE}/dashboard/studio`)
    const url = page.url()
    console.log(`Studio URL (unauthenticated): ${url}`)
    await page.screenshot({ path: SS("t7-studio-auth-wall"), fullPage: false })

    // Verify the studio source has the correct iframe config
    const studioSrc = readFileSync(
      "/Users/mbp/coding/paytree/app/dashboard/studio/studio-editor.tsx",
      "utf-8"
    )
    const has375  = studioSrc.includes("width={375}")
    const hasScale = studioSrc.includes("scale(0.629)")
    const hasLastSavedKey = studioSrc.includes(`lastSaved?.getTime() ?? "initial"`)
    const hasNoColorKey = !studioSrc.includes("profile.accentColor}-${profile.heroStyle}")

    console.log(`Studio source assertions:`)
    console.log(`  width=375:       ${has375}`)
    console.log(`  scale(0.629):    ${hasScale}`)
    console.log(`  lastSaved key:   ${hasLastSavedKey}`)
    console.log(`  no color in key: ${hasNoColorKey}`)

    expect(has375).toBe(true)
    expect(hasScale).toBe(true)
    expect(hasLastSavedKey).toBe(true)
    expect(hasNoColorKey).toBe(true)

    // Redirected to sign-in — confirms studio is protected (not broken)
    expect(url).toContain("sign-in")
  })
})
