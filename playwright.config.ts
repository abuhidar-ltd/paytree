import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testMatch: ["design-fixes.spec.ts", "paytree-e2e.spec.ts", "opus-e2e.spec.ts", "quick-register.spec.ts", "landing-diagnostic.spec.ts", "tiktok-iab.spec.ts", "mobile-audit.spec.ts", "diagnostic.spec.ts"],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  outputDir: "test-results",
})
