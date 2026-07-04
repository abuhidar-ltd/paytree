import { defineConfig, devices } from "@playwright/test"

// Real captured WebView user agents. detectIAB (lib/iab.ts) must recognize
// every one of these — they're the browsers 94% of our traffic actually uses.
const TIKTOK_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A.231005.007.A1; wv) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 " +
  "Mobile Safari/537.36 BytedanceWebview/d8a21c6 TikTok/32.7.3"

const INSTAGRAM_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/21C66 Instagram 320.0.0.42.101 (iPhone15,3; iOS 17_2_1; " +
  "en_US; en; scale=3.00; 1290x2796; 578620391)"

const FACEBOOK_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/21C66 [FBAN/FBIOS;FBAV/447.0.0.31.107;FBBV/564431005;" +
  "FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/17.2.1;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]"

// X/Twitter for iPhone uses WKWebView and appends "Twitter for iPhone" to the UA.
// This is the primary paid-traffic source since we moved off TikTok (July 2026).
const TWITTER_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/21F90 Twitter for iPhone"

// X on Android renders links inside its own WebView; recent builds omit an app
// marker so we fall through to the generic Android WebView heuristic (wv token).
const TWITTER_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A.231005.007.A1; wv) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.165 " +
  "Mobile Safari/537.36"

const IAB_VIEWPORT = { width: 375, height: 812 }

export default defineConfig({
  testDir: "./tests",
  testMatch: [
    "design-fixes.spec.ts",
    "paytree-e2e.spec.ts",
    "opus-e2e.spec.ts",
    "quick-register.spec.ts",
    "landing-diagnostic.spec.ts",
    "mobile-audit.spec.ts",
    "diagnostic.spec.ts",
    "og-images.spec.ts",
    "iab-signup.spec.ts",
    "signup-concurrency.spec.ts",
    "signup-normalization.spec.ts",
    "attribution.spec.ts",
    "activation.spec.ts",
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: ["**/iab-signup.spec.ts"],
    },
    {
      name: "concurrency",
      testMatch: ["**/signup-concurrency.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "iab-tiktok",
      testMatch: ["**/iab-signup.spec.ts"],
      use: {
        userAgent: TIKTOK_ANDROID_UA,
        viewport: IAB_VIEWPORT,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "iab-instagram",
      testMatch: ["**/iab-signup.spec.ts"],
      use: {
        userAgent: INSTAGRAM_IOS_UA,
        viewport: IAB_VIEWPORT,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "iab-facebook",
      testMatch: ["**/iab-signup.spec.ts"],
      use: {
        userAgent: FACEBOOK_IOS_UA,
        viewport: IAB_VIEWPORT,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "iab-twitter-ios",
      testMatch: ["**/iab-signup.spec.ts"],
      use: {
        userAgent: TWITTER_IOS_UA,
        viewport: IAB_VIEWPORT,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "iab-twitter-android",
      testMatch: ["**/iab-signup.spec.ts"],
      use: {
        userAgent: TWITTER_ANDROID_UA,
        viewport: IAB_VIEWPORT,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  outputDir: "test-results",
})
