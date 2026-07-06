import { test, expect } from "@playwright/test"

/**
 * The full 375px activation journey — the funnel that was leaking:
 * home → signup → onboarding (skip) → dashboard (starter card +
 * checklist) → add card → publish → celebration.
 *
 * Accounts use *@paytree-e2e.test emails; scripts/cleanup-test-users.ts
 * removes them.
 */

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true })

// Hardcoded base — the config's global `use.baseURL` is not reaching the
// Chromium project reliably (iab-* projects get it, desktop Chrome doesn't
// merge it in on some Playwright versions). Follow the same pattern
// paytree-e2e.spec.ts already uses.
const BASE = process.env.BASE_URL ?? "http://localhost:3000"

test("375px journey: home → signup → skip → add card → publish", async ({ page }) => {
  test.setTimeout(120_000)
  await page.route("**/_vercel/insights/**", (r) => r.fulfill({ status: 200, body: "{}" }))

  // 1. Home → hero CTA
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" })
  await page.getByTestId("home-hero-cta").click()
  await page.waitForURL("**/register**")

  // 2. Sign up (3-step wizard: name → email → password → Publish)
  const email = `e2e-journey-${Date.now()}@paytree-e2e.test`
  await page.getByTestId("signup-name").fill("Journey E2E")
  await page.getByTestId("signup-continue").click()
  await page.getByTestId("signup-email").fill(email)
  await page.getByTestId("signup-continue").click()
  await page.getByTestId("signup-password").fill("e2e-password-123")
  await page.getByTestId("signup-continue").click()
  await page.waitForURL("**/onboarding**", { timeout: 45_000 })

  // 3. Skip onboarding — smart skip must still land on a non-empty dashboard.
  //    Testid instead of copy — the button label ("Skip and go to dashboard")
  //    is preserved for accessibility, but the selector survives future
  //    marketing rewrites.
  await page.getByTestId("onboarding-skip").click()
  await page.waitForURL("**/dashboard**", { timeout: 30_000 })

  // 4. Starter card + go-live checklist + completion meter are all there
  await expect(page.getByTestId("go-live-checklist")).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId("completion-meter")).toBeVisible()
  await expect(page.getByText("My favorite link — tap to edit").first()).toBeVisible()

  // 5. Add a card via the checklist's step-1 CTA (opens the picker)
  await page.getByRole("button", { name: /add your first link/i }).click()
  await page.getByRole("button", { name: /^Link Any URL$/ }).first().click()
  await expect(page.getByText("Link added").first()).toBeVisible({ timeout: 15_000 })

  // Reload to close the edit sheet and re-derive checklist state from the DB.
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("go-live-checklist")).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId("go-live-checklist")).toContainText("1/3")

  // 6. Publish from the completion meter → celebration
  await page.getByTestId("completion-meter").getByRole("button").first().click() // expand
  await page.getByRole("button", { name: /publish your page/i }).click()
  await expect(page.getByTestId("publish-celebration")).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId("publish-celebration")).toContainText("Your page is live.")
  await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible()
})
