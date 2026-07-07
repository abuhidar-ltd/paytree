import { test, expect, type Page } from "@playwright/test"
import { markEmailVerified } from "./helpers/verify-email"

/**
 * The mandatory email-verification gate (2026-07-07).
 *
 * The happy path (signup → /verify-pending → poll → /onboarding) is covered
 * inside the journey specs (activation, iab-signup, signup-normalization).
 * This spec pins down the enforcement edges:
 *
 *  1. An unverified session cannot reach a protected page — the middleware
 *     bounces /dashboard back to /verify-pending, and the manual
 *     "I've verified" button tells the truth instead of letting them through.
 *  2. Logging IN with an unverified account lands on /verify-pending (the
 *     user IS logged in — just gated). Part of the deliberate reversal:
 *     verification is a gate, not a nudge.
 *  3. In-flight pre-gate email links (callbackURL=/dashboard&error=<CODE>)
 *     keep their recovery UX — the middleware forwards the error param.
 *
 * Accounts use *@paytree-e2e.test emails; scripts/cleanup-test-users.ts
 * removes them.
 */

// No project-skip needed: every non-chromium project's testMatch is scoped to
// its own spec file (playwright.config.ts), so only chromium ever runs this.
const PASSWORD = "gate-e2e-password-1"

async function signUp(page: Page, email: string) {
  await page.route("**/_vercel/insights/**", (r) => r.fulfill({ status: 200, body: "{}" }))
  await page.goto("/register", { waitUntil: "domcontentloaded" })
  await page.getByTestId("signup-name").fill("Gate E2E")
  await page.getByTestId("signup-continue").click()
  await page.getByTestId("signup-email").fill(email)
  await page.getByTestId("signup-continue").click()
  await page.getByTestId("signup-password").fill(PASSWORD)
  await page.getByTestId("signup-continue").click()
  await page.waitForURL("**/verify-pending**", { timeout: 45_000 })
}

test("unverified session is walled off from the dashboard", async ({ page }) => {
  const email = `gate-wall-${Date.now()}@paytree-e2e.test`
  await signUp(page, email)
  await expect(page.getByText(/check your email/i)).toBeVisible()

  // The manual fallback button must not wave an unverified user through.
  await page.getByTestId("verify-continue").click()
  await expect(page.getByText(/not verified yet/i)).toBeVisible({ timeout: 10_000 })

  // Direct navigation attempts bounce straight back to the gate.
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" })
  await page.waitForURL("**/verify-pending**", { timeout: 15_000 })
  await page.goto("/onboarding", { waitUntil: "domcontentloaded" })
  await page.waitForURL("**/verify-pending**", { timeout: 15_000 })
})

test("unverified LOGIN lands on the gate, verified login sails through", async ({ page }) => {
  const email = `gate-login-${Date.now()}@paytree-e2e.test`
  await signUp(page, email)

  // Fresh visit, same (unverified) account → login parks on the gate.
  await page.context().clearCookies()
  await page.goto("/login", { waitUntil: "networkidle" })
  await page.getByTestId("login-email").waitFor({ state: "visible" })
  await page.getByTestId("login-email").fill(email)
  await page.getByTestId("login-continue").click()
  await page.getByTestId("login-password").waitFor({ state: "visible", timeout: 10_000 })
  await page.getByTestId("login-password").fill(PASSWORD)
  await page.getByTestId("login-continue").click()
  await page.waitForURL("**/verify-pending**", { timeout: 45_000 })

  // Verify (grandfather-equivalent) → the SAME open page's polling advances.
  await markEmailVerified(email)
  await page.waitForURL("**/onboarding**", { timeout: 20_000 })
})

test("pre-gate email links keep their expired-token recovery", async ({ page }) => {
  const email = `gate-legacy-${Date.now()}@paytree-e2e.test`
  await signUp(page, email)

  // Old emails point at /dashboard?verified=1&error=<CODE>. The middleware
  // must forward the error onto /verify-pending so the resend CTA appears.
  await page.goto("/dashboard?verified=1&error=TOKEN_EXPIRED", { waitUntil: "domcontentloaded" })
  await page.waitForURL("**/verify-pending**", { timeout: 15_000 })
  await expect(page.getByText(/link expired/i)).toBeVisible({ timeout: 10_000 })
  await expect(page.getByTestId("verify-resend")).toBeVisible()
})
