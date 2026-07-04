import { test, expect } from "@playwright/test"

/**
 * Ad attribution guard.
 *
 * When we run paid ads on X, Meta, Google, or TikTok, every click stamps a
 * network-specific click ID onto the landing URL (twclid / fbclid / gclid /
 * ttclid / msclkid / wbraid / gbraid / li_fat_id). Without capturing those,
 * we can never reconcile revenue back to the ad that produced it — every
 * conversion looks like "direct" traffic and the ad platform's optimizer
 * flies blind.
 *
 * The referrer half of attribution has the same trap: social apps proxy
 * shared links through short domains (t.co for X, l.instagram.com,
 * l.facebook.com), so raw document.referrer reads as noise instead of the
 * platform. guessSource in lib/analytics.ts normalizes those to canonical
 * network names.
 *
 * This spec drives the same code path a real ad click uses: land with the
 * params, let captureAttribution run, then read localStorage and assert
 * everything we care about was captured.
 */

// captureAttribution is fired by app/home-page-view.tsx on homepage mount.
// We visit /, then poll localStorage until the effect has run — Playwright's
// domcontentloaded returns before React effects fire.
async function readAttribution(page: import("@playwright/test").Page) {
  await expect
    .poll(
      async () =>
        page.evaluate(() => localStorage.getItem("paytree_attribution")),
      { message: "attribution never landed in localStorage", timeout: 5_000 },
    )
    .not.toBeNull()
  const raw = await page.evaluate(() => localStorage.getItem("paytree_attribution"))
  return JSON.parse(raw ?? "{}")
}

test("X (Twitter) ad click captures twclid + normalizes t.co referrer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("iab-"), "chromium project only")

  await page.setExtraHTTPHeaders({ referer: "https://t.co/abc123" })
  await page.goto("/?twclid=twclickid42&utm_source=x&utm_campaign=july_creators_ultra")

  const attr = await readAttribution(page)
  expect(attr.twclid).toBe("twclickid42")
  expect(attr.utm_source).toBe("x")
  expect(attr.utm_campaign).toBe("july_creators_ultra")
  expect(attr.source_guess).toBe("x")
  expect(attr.landing_path).toBe("/")
})

test("Meta ad click captures fbclid + normalizes l.facebook.com referrer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("iab-"), "chromium project only")

  await page.setExtraHTTPHeaders({ referer: "https://l.facebook.com/l.php?u=paytree.to" })
  await page.goto("/?fbclid=fb_click_abc&utm_source=facebook&utm_medium=paid_social")

  const attr = await readAttribution(page)
  expect(attr.fbclid).toBe("fb_click_abc")
  expect(attr.source_guess).toBe("facebook")
})

test("Google Ads iOS wbraid + Instagram referrer captured together", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("iab-"), "chromium project only")

  await page.setExtraHTTPHeaders({ referer: "https://l.instagram.com/?u=paytree.to" })
  await page.goto("/?wbraid=wbclick99&gclid=classicgclid")

  const attr = await readAttribution(page)
  expect(attr.wbraid).toBe("wbclick99")
  expect(attr.gclid).toBe("classicgclid")
  expect(attr.source_guess).toBe("instagram")
})
