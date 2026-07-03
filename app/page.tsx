import Link from "next/link"
import dynamic from "next/dynamic"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { HomeHero } from "./home-hero"
import { HomePageView } from "./home-page-view"
import { HomeMarquee } from "./home-marquee"
import { HomeStickyCTA } from "./home-sticky-cta"
import { TrackedLink } from "@/components/tracked-link"

// Lazy-load below-fold sections — not needed for initial paint
const HomeComparison = dynamic(() => import("./home-comparison").then(m => m.HomeComparison), { ssr: true })
const HomeFeatures = dynamic(() => import("./home-features").then(m => m.HomeFeatures), { ssr: true })
const HomeShowcase = dynamic(() => import("./home-showcase").then(m => m.HomeShowcase), { ssr: true })
const HomePricingSection = dynamic(() => import("./home-pricing-section").then(m => m.HomePricingSection), { ssr: true })

export default async function HomePage() {
  // Session check via Better Auth — cookie-cached, single DB hit on miss.
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  const isLoggedIn = !!session

  return (
    // pb-32 on mobile keeps the footer/pricing CTAs visible above the sticky
    // mobile bar (HomeStickyCTA). No effect on desktop.
    <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden pb-32 sm:pb-0">
      {/* Fires homepage_view once on load — render-only, no UI */}
      <HomePageView />
      {/* Header — glass treatment on all viewports (mobile included). Solid
          bg used to be a TikTok-WebView workaround for backdrop-blur quirks;
          modern WebViews handle it. The top reflection line ties the bar to
          the rest of the Obsidian Terminal design language. */}
      <header
        className="fixed top-0 left-0 right-0 z-50 pt-safe"
        style={{
          background: "rgba(3,3,3,0.55)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Razor reflection — same gradient used on glass cards site-wide. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)",
          }}
        />
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 font-bold text-xl hover:opacity-90 transition-opacity h-11 -ml-1 pl-1"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_20px_rgba(0,255,136,0.3)]" />
            <span className="text-[#f0f0f0] font-semibold">Paytree</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/pricing"
              className="text-[#999] hover:text-white transition-colors text-sm font-mono hidden sm:flex items-center min-h-11 px-2"
            >
              Pricing
            </Link>
            {isLoggedIn ? (
              <TrackedLink
                event="click_cta"
                eventProps={{ variant: "dashboard" }}
                source="header"
                href="/dashboard"
                className="bg-[#00ff88] text-black font-mono font-semibold px-4 rounded-xl text-sm hidden sm:inline-flex items-center min-h-11 active:scale-[0.97] transition-transform"
              >
                Dashboard
              </TrackedLink>
            ) : (
              <>
                <TrackedLink
                  event="click_signin"
                  source="header"
                  href="/login"
                  className="hidden sm:inline-flex items-center text-[#aaa] hover:text-white transition-colors text-sm font-mono border border-white/[0.1] px-3 rounded-lg hover:border-white/[0.25] min-h-11"
                >
                  Sign in
                </TrackedLink>
                <TrackedLink
                  event="click_cta"
                  eventProps={{ variant: "start" }}
                  source="header"
                  href="/register"
                  className="bg-[#00ff88] text-black font-mono font-semibold px-3 sm:px-4 rounded-xl text-xs sm:text-sm whitespace-nowrap hidden sm:inline-flex items-center min-h-11 active:scale-[0.97] transition-transform"
                >
                  <span className="sm:hidden">Start free →</span>
                  <span className="hidden sm:inline">Create page free →</span>
                </TrackedLink>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Sections */}
      <HomeHero isLoggedIn={isLoggedIn} />
      <HomeMarquee />
      <HomeComparison />
      <HomeFeatures />
      <HomeShowcase />
      <HomePricingSection isLoggedIn={isLoggedIn} />

      <HomeStickyCTA isLoggedIn={isLoggedIn} />

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-[rgba(3,3,3,0.8)] backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
              <span className="font-bold text-white">Paytree</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#999] font-mono">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="border-t border-white/[0.05] mt-6 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#777] font-mono">
              <div>&copy; {new Date().getFullYear()} Paytree. All rights reserved.</div>
              <div>0% platform fees on every paid plan. Stripe processing fees apply.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
