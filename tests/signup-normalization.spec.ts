import { test, expect } from "@playwright/test"
import { markEmailVerified } from "./helpers/verify-email"

/**
 * Regression: signup and sign-in must agree on how emails are stored.
 *
 * Postgres @unique is case-sensitive by default, and mobile keyboards happily
 * autofill emails with a stray leading space or a capitalized first letter.
 * Without client-side normalization, a user could sign up as " Sara@Example.com "
 * and then never be able to sign back in when they later type sara@example.com
 * cleanly — the account exists but under a different string. Every one of those
 * bounces looked like "signup didn't work" in Clarity.
 *
 * The fix normalizes at both signup and signin: trim + lowercase.
 */

test("email normalization: signup with whitespace/caps, signin cleanly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("iab-"), "Runs under the chromium project only")

  await page.route("**/_vercel/insights/**", (r) => r.fulfill({ status: 200, body: "{}" }))

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const cleanEmail = `norm-${suffix}@paytree-e2e.test`
  // What the user might actually type — the exact autofill pathology.
  const messyEmail = `  Norm-${suffix.toUpperCase()}@Paytree-E2E.Test  `

  // 1. Sign up with the messy version.
  await page.goto("/register", { waitUntil: "domcontentloaded" })
  await page.getByTestId("signup-name").fill("Norm Test")
  await page.getByTestId("signup-continue").click()
  await page.getByTestId("signup-email").fill(messyEmail)
  await page.getByTestId("signup-continue").click()
  await page.getByTestId("signup-password").fill("normalize-me-please-1")
  await page.getByTestId("signup-continue").click()
  // Signup parks on the mandatory verification gate. The lookup inside
  // markEmailVerified uses cleanEmail — which doubles as an assertion that
  // the messy signup was stored normalized (it throws on no match).
  await page.waitForURL("**/verify-pending**", { timeout: 45_000 })
  await markEmailVerified(cleanEmail)
  await page.waitForURL("**/onboarding**", { timeout: 20_000 })

  // 2. Nuke cookies to simulate a fresh visit / signed-out state. Faster and
  //    more deterministic than driving the UI logout button — the assertion
  //    is about email storage, not logout UX.
  await page.context().clearCookies()

  // 3. Sign back in with the clean lowercase version — if normalization is
  //    working, Better Auth finds the account under `cleanEmail` and accepts.
  //    If not, we'd get INVALID_EMAIL_OR_PASSWORD. The account is verified
  //    (step above), so this also proves a verified/grandfathered login goes
  //    straight through — no /verify-pending interruption.
  await page.goto("/login", { waitUntil: "networkidle" })
  // useSession finishes its /api/auth/get-session round-trip before we touch
  // the form — otherwise a click that races the hydration/session-fetch pair
  // can be a no-op and the wizard silently stays on step 0.
  await page.getByTestId("login-email").waitFor({ state: "visible" })
  await page.getByTestId("login-email").fill(cleanEmail)
  await page.getByTestId("login-continue").click()
  await page.getByTestId("login-password").waitFor({ state: "visible", timeout: 10_000 })
  await page.getByTestId("login-password").fill("normalize-me-please-1")
  await page.getByTestId("login-continue").click()

  // The signin flow lands on /dashboard which redirects unonboarded users to
  // /onboarding welcome. Anchoring on the welcome CTA is more robust than
  // waitForURL — the double-hard-nav (submit + useSession effect) racing on
  // success sometimes leaves waitForURL with an aborted intermediate.
  await expect(page.getByTestId("onboarding-welcome-next")).toBeVisible({ timeout: 45_000 })
})
