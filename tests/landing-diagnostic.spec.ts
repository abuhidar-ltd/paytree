import { test } from "@playwright/test"
test("landing diagnostic — sections actually visible", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" })
  // Scroll through the page to fire whileInView IntersectionObservers
  await page.evaluate(async () => {
    const total = document.body.scrollHeight
    const step = window.innerHeight
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 150))
    }
    window.scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 400))
  })
  await page.waitForTimeout(800)

  for (const heading of [
    "Your entire creator business",  // hero
    "Everything Linktree",            // comparison
    "Built different",                // features
    "Your page. Your identity",       // showcase
    "Start free. Scale when ready",   // pricing
  ]) {
    const visible = await page.getByText(heading, { exact: false }).first().isVisible().catch(() => false)
    console.log(`VISIBLE: "${heading}" → ${visible}`)
  }

  await page.screenshot({ path: "tests/screens/landing-scrolled.png", fullPage: true })
})
