import { test, expect } from "@playwright/test"

/**
 * In-app-browser signup journeys.
 *
 * Runs under the iab-tiktok / iab-instagram / iab-facebook projects
 * (playwright.config.ts), each of which sets a real captured WebView UA at a
 * 375px-class viewport. 94% of production traffic is mobile, mostly inside
 * social IABs — this is the funnel that pays the bills.
 *
 * Asserts:
 *  - /register SSRs the "open in browser" banner (first paint, not hydration)
 *  - the Google button is never shown inside an IAB (Google 403s OAuth in
 *    WebViews — the button is a guaranteed dead end)
 *  - the email/password path completes end-to-end: land → CTA → /register →
 *    fill → submit → /onboarding
 *
 * Created accounts use *@paytree-e2e.test emails — matched and removed by
 * scripts/cleanup-test-users.ts.
 */

test("signup banner + Google gating are in the SSR HTML", async ({ request }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("iab-"), "IAB projects only")
  const res = await request.get("/register")
  expect(res.status()).toBe(200)
  const html = await res.text()
  // Server-side UA detection must put the banner in the initial HTML.
  expect(html).toContain("iab-banner")
  expect(html).not.toContain("Continue with Google")
})

test("full email signup journey inside the IAB", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("iab-"), "IAB projects only")

  // Swallow analytics beacons — no test traffic in production stats.
  await page.route("**/_vercel/insights/**", (r) => r.fulfill({ status: 200, body: "{}" }))

  // 1. Land on the homepage; the hero CTA must be tappable.
  await page.goto("/", { waitUntil: "domcontentloaded" })
  const heroCta = page.getByRole("link", { name: /create your free page/i }).first()
  await expect(heroCta).toBeVisible()

  // 2. Soft-navigate to /register (hard navigations are what TikTok screens).
  await heroCta.click()
  await page.waitForURL("**/register**", { waitUntil: "domcontentloaded" })

  // 3. IAB banner is visible; Google button is not.
  await expect(page.getByTestId("iab-banner")).toBeVisible()
  await expect(page.getByRole("button", { name: /continue with google/i })).toHaveCount(0)

  // 4. Email signup completes with zero third-party dependencies.
  const email = `e2e-iab-${testInfo.project.name}-${Date.now()}@paytree-e2e.test`
  await page.getByPlaceholder("Your name").fill("IAB E2E")
  await page.getByPlaceholder("Email address").fill(email)
  await page.getByPlaceholder(/^Password/).fill("e2e-password-123")
  await page.getByRole("button", { name: /start free/i }).click()

  // 5. Account created → onboarding. Generous timeout: dev-server cold
  //    compile of /onboarding plus a real DB roundtrip.
  await page.waitForURL("**/onboarding**", { timeout: 45_000 })
  await expect(page.getByText(/one link|let's go/i).first()).toBeVisible({ timeout: 15_000 })
})
