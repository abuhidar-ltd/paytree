import { test } from "@playwright/test"
test("register full load", async ({ page }) => {
  await page.goto("/register", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: "tests/screens/register-loaded.png", fullPage: true })
  const html = await page.content()
  const hasCl = /cl-rootBox|cl-formButtonPrimary|cl-formFieldInput|clerk-js|cl-internal/.test(html)
  console.log("HAS_CLERK_DOM:", hasCl)
  console.log("HAS_4.99:", html.includes("$4.99"))
  console.log("HAS_UPGRADE_TO_PRO:", html.includes("Upgrade to Pro"))
  console.log("HAS_2_LINKS_LIMIT:", html.includes("Add up to 2 links"))
  const iframes = await page.locator("iframe").count()
  console.log("IFRAMES:", iframes)
})
