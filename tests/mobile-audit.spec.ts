import { test } from "@playwright/test"
import path from "path"
import fs from "fs"

/**
 * Mobile + desktop screenshot grid for visual regression review.
 * Captures landing, /join, /login, /pricing on the 4 most common viewports.
 */

const SS_DIR = path.join("test-results", "mobile-audit")
test.beforeAll(() => {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true })
})

const VIEWPORTS = [
  { name: "iphone-se", w: 375, h: 667, mobile: true },
  { name: "iphone-15", w: 393, h: 852, mobile: true },
  { name: "pixel-7",   w: 412, h: 915, mobile: true },
  { name: "iphone-pro-max", w: 430, h: 932, mobile: true },
  { name: "desktop",   w: 1440, h: 900, mobile: false },
]

const PAGES = ["/", "/join", "/login", "/pricing"]

for (const vp of VIEWPORTS) {
  test(`${vp.name} — all pages`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      deviceScaleFactor: vp.mobile ? 2 : 1,
    })
    const page = await ctx.newPage()
    // Silence @vercel/analytics in audit
    await page.route("**/_vercel/insights/**", (r) => r.fulfill({ status: 200, body: "{}" }))

    for (const p of PAGES) {
      await page.goto(`http://localhost:3000${p}`, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(p === "/" ? 1200 : 2500)
      const slug = p === "/" ? "landing" : p.slice(1).replace(/\//g, "-")
      await page.screenshot({
        path: path.join(SS_DIR, `${vp.name}-${slug}.png`),
        fullPage: true,
      })
    }
    await ctx.close()
  })
}
