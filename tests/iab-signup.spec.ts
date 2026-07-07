import { test, expect } from "@playwright/test"
import { markEmailVerified } from "./helpers/verify-email"

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
 *    fill → submit → /verify-pending (mandatory since 2026-07-07) → the
 *    verification-link flip is noticed BY POLLING → /onboarding. Inside a
 *    WebView the link opens in the system browser, so the polling hop is the
 *    only thing keeping the user's flow alive — that's why it's asserted
 *    here and not just in the chromium project.
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
  // Three IAB projects signup + poll the verification gate in parallel
  // against a dev server — the default 30s test budget is too tight since
  // the gate added a page hop. Same budget as activation.spec.ts.
  test.setTimeout(120_000)

  // Swallow analytics beacons — no test traffic in production stats.
  await page.route("**/_vercel/insights/**", (r) => r.fulfill({ status: 200, body: "{}" }))

  // 1. Land on the homepage; the hero CTA must be tappable. Selector uses
  //    the stable data-testid instead of copy — the marketing team rotates
  //    the button label often.
  await page.goto("/", { waitUntil: "domcontentloaded" })
  const heroCta = page.getByTestId("home-hero-cta")
  await expect(heroCta).toBeVisible()

  // 2. Soft-navigate to /register (hard navigations are what TikTok screens).
  await heroCta.click()
  await page.waitForURL("**/register**", { waitUntil: "domcontentloaded" })

  // 3. IAB banner is visible; Google button is not.
  await expect(page.getByTestId("iab-banner")).toBeVisible()
  await expect(page.getByRole("button", { name: /continue with google/i })).toHaveCount(0)

  // 4. Email signup completes with zero third-party dependencies. Signup is
  //    a 3-step wizard now (name → email → password), so we advance through
  //    the "Continue" button between each step and land on "Publish" at 3.
  const email = `e2e-iab-${testInfo.project.name}-${Date.now()}@paytree-e2e.test`
  await page.getByTestId("signup-name").fill("IAB E2E")
  await page.getByTestId("signup-continue").click()
  await page.getByTestId("signup-email").fill(email)
  await page.getByTestId("signup-continue").click()
  await page.getByTestId("signup-password").fill("e2e-password-123")
  await page.getByTestId("signup-continue").click()

  // 5. Account created → the mandatory verification gate, NOT onboarding.
  //    Generous timeout: dev-server cold compile plus a real DB roundtrip.
  await page.waitForURL("**/verify-pending**", { timeout: 45_000 })
  await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 15_000 })

  // 6. Simulate the verification-link click (DB flag flip — exactly what the
  //    Better Auth endpoint does, but from "another browser" as far as this
  //    WebView is concerned). The page's 4s polling must notice on its own
  //    and advance to onboarding with zero interaction here.
  await markEmailVerified(email)
  await page.waitForURL("**/onboarding**", { timeout: 20_000 })
  await page.getByTestId("onboarding-welcome-next").click({ timeout: 15_000 })
  await expect(page.getByTestId("onboarding-name")).toBeVisible({ timeout: 15_000 })
})
