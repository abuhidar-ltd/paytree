import { test, expect, devices, Page } from "@playwright/test"
import fs from "fs"
import path from "path"

// Comprehensive conversion diagnostic. Simulates a TikTok mobile user, walks
// the signup journey, intercepts requests, captures Clarity-style metrics, and
// flags every friction point. Drops screenshots + JSON report into
// test-results/diagnostic/.

const OUT_DIR = path.resolve(__dirname, "../test-results/diagnostic")
fs.mkdirSync(OUT_DIR, { recursive: true })

const BASE = "http://localhost:3000"
const IPHONE_SE = { width: 375, height: 667 }
const IPHONE_12 = { width: 390, height: 844 }
const IPHONE_LANDING = { width: 375, height: 812 }

// TikTok IAB UA (real-world sample)
const TIKTOK_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_29.4.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en App/1233 ByteFullLocale/en BytedanceWebview/d8a21c6"

type Finding = {
  severity: "critical" | "high" | "medium" | "low" | "info"
  area: string
  msg: string
  detail?: unknown
}

const findings: Finding[] = []
const log = (f: Finding) => {
  findings.push(f)
  console.log(`[${f.severity.toUpperCase()}] [${f.area}] ${f.msg}`)
}

async function collectErrors(page: Page, tag: string) {
  page.on("pageerror", (err) => log({ severity: "critical", area: tag, msg: `pageerror: ${err.message}` }))
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      log({ severity: "high", area: tag, msg: `console.error: ${msg.text().slice(0, 240)}` })
    }
  })
  page.on("requestfailed", (req) => {
    const f = req.failure()
    log({ severity: "high", area: tag, msg: `req failed: ${req.url()} — ${f?.errorText ?? "unknown"}` })
  })
}

test.describe("PAYTREE DIAGNOSTIC", () => {
  test.setTimeout(120_000)

  test("Phase 2+5: Hero at 375px Mobile Safari", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPhone SE"],
      viewport: IPHONE_LANDING,
    })
    const page = await context.newPage()
    await collectErrors(page, "hero-375")

    const resources: Array<{ url: string; status: number; size: number; type: string }> = []
    page.on("response", async (resp) => {
      try {
        const buf = await resp.body().catch(() => Buffer.alloc(0))
        resources.push({
          url: resp.url(),
          status: resp.status(),
          size: buf.length,
          type: resp.headers()["content-type"] ?? "",
        })
      } catch {
        // ignore
      }
    })

    const start = Date.now()
    await page.goto(BASE, { waitUntil: "domcontentloaded" })
    const tDom = Date.now() - start
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {})
    const tFull = Date.now() - start

    // Full-page screenshot
    await page.screenshot({ path: path.join(OUT_DIR, "hero-full-375px.png"), fullPage: true })

    // Above the fold (just first viewport)
    await page.screenshot({ path: path.join(OUT_DIR, "hero-above-fold-375px.png"), fullPage: false })

    // ─── Measure above-fold elements ───────────────────────────────────────────
    const aboveFold = await page.evaluate((vh) => {
      const viewportHeight = vh
      const cta = document.querySelector('a[href="/start"], a[href="/dashboard"]') as HTMLElement | null
      const h1 = document.querySelector("h1") as HTMLElement | null
      const header = document.querySelector("header") as HTMLElement | null
      const badge = document.querySelector('[class*="0% fees"]') as HTMLElement | null

      function rectOf(el: HTMLElement | null) {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom, width: r.width, height: r.height }
      }

      return {
        viewportHeight,
        headerRect: rectOf(header),
        h1Rect: rectOf(h1),
        h1Text: h1?.textContent?.trim() ?? null,
        ctaRect: rectOf(cta),
        ctaText: cta?.textContent?.trim() ?? null,
        ctaAboveFold: cta ? cta.getBoundingClientRect().bottom <= viewportHeight : null,
        badgeRect: rectOf(badge),
      }
    }, IPHONE_LANDING.height)

    console.log("ABOVE FOLD MEASUREMENTS:", JSON.stringify(aboveFold, null, 2))

    if (!aboveFold.ctaAboveFold) {
      log({
        severity: "critical",
        area: "hero",
        msg: "Primary CTA is NOT above the fold at 375x812",
        detail: aboveFold,
      })
    } else if (aboveFold.ctaRect && aboveFold.ctaRect.bottom > IPHONE_LANDING.height - 100) {
      log({
        severity: "high",
        area: "hero",
        msg: `CTA pushed near bottom of fold (bottom=${aboveFold.ctaRect.bottom}, viewport=${IPHONE_LANDING.height})`,
      })
    }

    // CTA tap target check
    if (aboveFold.ctaRect && aboveFold.ctaRect.height < 44) {
      log({ severity: "high", area: "hero", msg: `CTA tap target under 44px (${aboveFold.ctaRect.height}px)` })
    }

    // Headline length
    const headlineWords = aboveFold.h1Text?.split(/\s+/).length ?? 0
    if (headlineWords > 12) {
      log({ severity: "medium", area: "hero", msg: `Headline is ${headlineWords} words — too long for TikTok user`, detail: aboveFold.h1Text })
    }

    // Spelling check
    if (aboveFold.h1Text?.toLowerCase().includes("comission")) {
      log({ severity: "critical", area: "hero", msg: "Headline contains spelling error: 'comission' should be 'commission'", detail: aboveFold.h1Text })
    }

    // Web vitals — best-effort, may need delay
    const vitals = await page.evaluate(() => {
      return new Promise<Record<string, number>>((resolve) => {
        const out: Record<string, number> = {}
        const obs = new PerformanceObserver((entries) => {
          for (const e of entries.getEntries()) {
            if (e.entryType === "largest-contentful-paint") out.LCP = e.startTime
            if (e.entryType === "first-input") {
              const fi = e as PerformanceEventTiming
              out.FID = fi.processingStart - fi.startTime
            }
            if (e.entryType === "layout-shift") {
              const ls = e as PerformanceEntry & { value: number; hadRecentInput: boolean }
              if (!ls.hadRecentInput) out.CLS = (out.CLS || 0) + ls.value
            }
          }
        })
        try { obs.observe({ type: "largest-contentful-paint", buffered: true }) } catch {}
        try { obs.observe({ type: "first-input", buffered: true }) } catch {}
        try { obs.observe({ type: "layout-shift", buffered: true }) } catch {}
        setTimeout(() => resolve(out), 3000)
      })
    })

    console.log("VITALS:", JSON.stringify(vitals, null, 2))

    // Network analysis
    const totalSize = resources.reduce((s, r) => s + r.size, 0)
    const failed = resources.filter((r) => r.status >= 400)
    const external = new Set(resources.filter((r) => !r.url.includes("localhost")).map((r) => new URL(r.url).host))
    console.log(`TOTAL REQS: ${resources.length}, SIZE: ${(totalSize / 1024).toFixed(1)}KB, FAILED: ${failed.length}`)
    console.log(`EXTERNAL DOMAINS: ${[...external].join(", ")}`)

    if (totalSize > 1_500_000) {
      log({ severity: "high", area: "network", msg: `Page weight too high: ${(totalSize / 1024).toFixed(1)}KB`, detail: { totalSize } })
    }
    for (const f of failed) {
      log({ severity: "high", area: "network", msg: `Failed request: ${f.url} (${f.status})` })
    }

    if (tDom > 3000) log({ severity: "high", area: "perf", msg: `DOMContentLoaded ${tDom}ms` })
    if (vitals.LCP && vitals.LCP > 2500) log({ severity: "medium", area: "perf", msg: `LCP ${Math.round(vitals.LCP)}ms` })

    fs.writeFileSync(path.join(OUT_DIR, "hero-measurements.json"), JSON.stringify({ aboveFold, vitals, tDom, tFull, totalSize, failed: failed.length, resources: resources.length }, null, 2))

    await context.close()
  })

  test("Phase 3: Click hero CTA — does it work?", async ({ browser }) => {
    const context = await browser.newContext({ viewport: IPHONE_LANDING })
    const page = await context.newPage()
    await collectErrors(page, "click-cta")

    await page.goto(BASE, { waitUntil: "domcontentloaded" })

    const cta = await page.locator('a[href="/start"]').first()
    const ctaExists = (await cta.count()) > 0
    if (!ctaExists) {
      log({ severity: "critical", area: "cta", msg: "No /start CTA on homepage" })
      await context.close()
      return
    }

    // Click and confirm navigation
    const beforeUrl = page.url()
    await cta.click({ timeout: 5000 })
    await page.waitForURL(/\/start/, { timeout: 10_000 }).catch(() => {
      log({ severity: "critical", area: "cta", msg: `CTA click did NOT navigate. Still at ${page.url()}, was ${beforeUrl}` })
    })

    // Wait for the actual form to render (Next streams the loading state first)
    const formAppeared = await page.waitForSelector('form input[type="email"]', { timeout: 10_000 }).then(() => true).catch(() => false)
    if (!formAppeared) {
      log({ severity: "critical", area: "signup", msg: "/start never rendered the signup form (still on Loading state after 10s)" })
    }

    // Screenshot signup page
    await page.screenshot({ path: path.join(OUT_DIR, "start-page-375px.png"), fullPage: true })
    await page.screenshot({ path: path.join(OUT_DIR, "start-above-fold-375px.png"), fullPage: false })

    // Form measurements
    const formData = await page.evaluate((vh) => {
      const form = document.querySelector("form") as HTMLElement | null
      const nameInput = document.querySelector('input[autocomplete="name"]') as HTMLInputElement | null
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement | null
      const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      function rectOf(el: HTMLElement | null) {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom, h: r.height }
      }
      return {
        formRect: rectOf(form),
        submitRect: rectOf(submitBtn),
        submitAboveFold: submitBtn ? submitBtn.getBoundingClientRect().bottom <= vh : null,
        nameExists: !!nameInput,
        emailExists: !!emailInput,
        submitText: submitBtn?.textContent?.trim() ?? null,
        viewportHeight: vh,
      }
    }, IPHONE_LANDING.height)
    console.log("SIGNUP FORM:", JSON.stringify(formData, null, 2))

    if (!formData.submitAboveFold) {
      log({ severity: "high", area: "signup", msg: "Signup submit button NOT above the fold at 375x812", detail: formData })
    }

    if (formData.submitRect && formData.submitRect.h < 44) {
      log({ severity: "high", area: "signup", msg: `Submit button tap target under 44px (${formData.submitRect.h}px)` })
    }

    fs.writeFileSync(path.join(OUT_DIR, "start-measurements.json"), JSON.stringify(formData, null, 2))

    await context.close()
  })

  test("Phase 3: Full signup journey with real form fill", async ({ browser }) => {
    const context = await browser.newContext({ viewport: IPHONE_LANDING })
    const page = await context.newPage()
    await collectErrors(page, "signup-journey")

    await page.goto(`${BASE}/start`, { waitUntil: "domcontentloaded" })
    await page.waitForSelector('form input[type="email"]', { timeout: 15_000 }).catch(() => {
      log({ severity: "critical", area: "signup-fill", msg: "Form inputs never appeared on /start" })
    })

    const ts = Date.now()
    const email = `diag${ts}@paytree-test.com`
    const password = "TestPass123!"

    // Fill the form
    await page.fill('input[type="text"]', "Diagnostic User").catch((e) => log({ severity: "high", area: "signup-fill", msg: `Name input fill failed: ${e.message}` }))
    await page.fill('input[type="email"]', email).catch((e) => log({ severity: "high", area: "signup-fill", msg: `Email input fill failed: ${e.message}` }))
    await page.fill('input[type="password"]', password).catch((e) => log({ severity: "high", area: "signup-fill", msg: `Password input fill failed: ${e.message}` }))

    const submitStart = Date.now()
    await page.click('button[type="submit"]').catch((e) => log({ severity: "critical", area: "signup-submit", msg: `Submit click failed: ${e.message}` }))

    // Wait for navigation
    const ended = await Promise.race([
      page.waitForURL(/\/onboarding|\/dashboard/, { timeout: 15_000 }).then(() => "navigated"),
      page.waitForSelector('[class*="ff5555"], [class*="red"]', { timeout: 15_000 }).then(() => "error-shown").catch(() => null),
      new Promise<string>((r) => setTimeout(() => r("timeout"), 15_000)),
    ])
    const submitDuration = Date.now() - submitStart
    console.log(`SIGNUP outcome=${ended} in ${submitDuration}ms — URL: ${page.url()}`)

    if (ended === "timeout") {
      log({ severity: "critical", area: "signup-submit", msg: `Signup hung — no navigation or error in 15s` })
    } else if (ended === "error-shown") {
      const errText = await page.locator('[class*="ff5555"], [style*="ff5555"]').first().textContent().catch(() => "?")
      log({ severity: "high", area: "signup-submit", msg: `Signup error shown: ${errText}` })
    }

    await page.screenshot({ path: path.join(OUT_DIR, "after-signup.png"), fullPage: true }).catch(() => {})

    // If on onboarding, screenshot it
    if (page.url().includes("/onboarding")) {
      await page.screenshot({ path: path.join(OUT_DIR, "onboarding-welcome-375px.png"), fullPage: false })
    }

    await context.close()
  })

  test("Phase 1: TikTok IAB simulation", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: IPHONE_LANDING,
      userAgent: TIKTOK_IOS_UA,
    })
    // Block third-party cookies (best-effort — playwright doesn't simulate this perfectly)
    await context.addInitScript(() => {
      // Simulate localStorage being blocked
      try {
        const blocked = false // we'll keep it enabled but log access attempts
        if (blocked) {
          Object.defineProperty(window, "localStorage", { get() { throw new Error("Access is denied for this document.") } })
        }
      } catch {}
    })

    const page = await context.newPage()
    await collectErrors(page, "tiktok-iab")

    const start = Date.now()
    // Go directly to /start so the SSR header-based detection has the TikTok UA.
    await page.goto(`${BASE}/start`, { waitUntil: "domcontentloaded" })
    const tFull = Date.now() - start

    await page.screenshot({ path: path.join(OUT_DIR, "tiktok-iab-start.png"), fullPage: false })

    // Banner should now be in the initial HTML (server-detected), not deferred to useEffect.
    const iabBanner = await page.locator("text=/open it in your browser/i").count()
    console.log("TikTok IAB banner shown:", iabBanner)
    if (iabBanner === 0) {
      log({ severity: "high", area: "tiktok-iab", msg: "TikTok IAB warning banner not detected on /start even with SSR detection" })
    }

    console.log(`TikTok IAB load: ${tFull}ms`)
    await context.close()
  })

  test.afterAll(() => {
    fs.writeFileSync(path.join(OUT_DIR, "findings.json"), JSON.stringify(findings, null, 2))
    console.log("\n══════════════ FINDINGS SUMMARY ══════════════")
    const bySev: Record<string, Finding[]> = {}
    for (const f of findings) (bySev[f.severity] ||= []).push(f)
    for (const sev of ["critical", "high", "medium", "low", "info"]) {
      if (!bySev[sev]) continue
      console.log(`\n— ${sev.toUpperCase()} (${bySev[sev].length}) —`)
      for (const f of bySev[sev]) console.log(`  [${f.area}] ${f.msg}`)
    }
  })
})
