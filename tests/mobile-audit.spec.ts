import { test, expect } from "@playwright/test"
import path from "path"
import fs from "fs"

/**
 * Mobile + desktop screenshot grid for visual regression review.
 * Captures landing, /join, /login, /pricing on the 4 most common viewports
 * and asserts no horizontal overflow at any of them.
 */

const SS_DIR = path.join("test-results", "mobile-audit")
const REPORT_PATH = path.join(SS_DIR, "overflow-report.txt")
test.beforeAll(() => {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true })
  // Reset report each run so stale results don't accumulate.
  if (fs.existsSync(REPORT_PATH)) fs.unlinkSync(REPORT_PATH)
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

    const findings: string[] = []
    for (const p of PAGES) {
      await page.goto(`http://localhost:3000${p}`, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(p === "/" ? 1200 : 2500)
      const slug = p === "/" ? "landing" : p.slice(1).replace(/\//g, "-")
      await page.screenshot({
        path: path.join(SS_DIR, `${vp.name}-${slug}.png`),
        fullPage: true,
      })

      // Horizontal overflow detection — documentElement.scrollWidth should
      // never exceed the viewport width. Anything wider is layout debt.
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      const overflow = scrollWidth - clientWidth
      const line = `[${vp.name} ${vp.w}px] ${p}  scrollWidth=${scrollWidth} clientWidth=${clientWidth} overflow=${overflow}`
      findings.push(line)
      if (overflow > 1) {
        // Pinpoint the widest offending element so a follow-up fix is
        // trivial. Records the first 5 elements wider than the viewport.
        const culprits = await page.evaluate((cw: number) => {
          const offenders: { tag: string; cls: string; w: number }[] = []
          document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
            const r = el.getBoundingClientRect()
            if (r.right > cw + 1) {
              offenders.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className || "").toString().slice(0, 80),
                w: Math.round(r.right - cw),
              })
            }
          })
          offenders.sort((a, b) => b.w - a.w)
          return offenders.slice(0, 5)
        }, clientWidth)
        for (const c of culprits) {
          findings.push(`   └─ +${c.w}px  <${c.tag}> ${c.cls}`)
        }
      }
    }
    fs.appendFileSync(REPORT_PATH, findings.join("\n") + "\n")

    // Soft assert: don't fail the whole run on overflow, just report it.
    // The screenshots + report are the deliverable.
    const overflowing = findings.filter((l) => /overflow=\d+/.test(l) && !/overflow=0$/.test(l))
    expect.soft(overflowing, `overflow report: see ${REPORT_PATH}`).toHaveLength(0)

    await ctx.close()
  })
}
