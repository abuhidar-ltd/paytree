import { test } from "@playwright/test"
test("join page full load", async ({ page }) => {
  await page.goto("/join", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: "tests/screens/join-loaded.png", fullPage: true })
  const html = await page.content()
  const hasCl = /cl-rootBox|cl-formButtonPrimary|cl-formFieldInput|clerk-js|cl-internal/.test(html)
  console.log("HAS_CLERK_DOM:", hasCl)
  const iframes = await page.locator("iframe").count()
  console.log("IFRAMES:", iframes)
})
