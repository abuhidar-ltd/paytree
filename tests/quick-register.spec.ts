import { test, expect } from "@playwright/test"

// Quick smoke: /register renders the Better Auth email form on first load.
test("register page full load", async ({ page }) => {
  await page.goto("/register", { waitUntil: "domcontentloaded" })
  await expect(page.getByPlaceholder("Your name")).toBeVisible({ timeout: 15_000 })
  await expect(page.getByPlaceholder("Email address")).toBeVisible()
  await expect(page.getByPlaceholder(/^Password/)).toBeVisible()
  await expect(page.getByRole("button", { name: /start free/i })).toBeVisible()
  await page.screenshot({ path: "tests/screens/register-loaded.png", fullPage: true })
})
