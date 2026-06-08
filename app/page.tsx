import Link from "next/link"
import { getCurrentUser } from "@/lib/clerk-auth"
import { HomeHero } from "./home-hero"
import { HomeMarquee } from "./home-marquee"
import { HomeComparison } from "./home-comparison"
import { HomeFeatures } from "./home-features"
import { HomeShowcase } from "./home-showcase"
import { HomePricingSection } from "./home-pricing-section"

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null)
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-[rgba(3,3,3,0.8)] backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_20px_rgba(0,255,136,0.3)]" />
            <span className="text-[#f0f0f0] font-semibold">Paytree</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-[#666] hover:text-white transition-colors text-sm font-mono hidden sm:block">
              Pricing
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="bg-[#00ff88] text-black font-mono font-semibold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-[#666] hover:text-white transition-colors text-sm font-mono">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-[#00ff88] text-black font-mono font-semibold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
                >
                  Start free →
                </Link>
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

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-[rgba(3,3,3,0.8)] backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
              <span className="font-bold text-white">Paytree</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#666] font-mono">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="border-t border-white/[0.05] mt-6 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#444] font-mono">
              <div>&copy; {new Date().getFullYear()} Paytree. All rights reserved.</div>
              <div>0% platform fees on every paid plan. Stripe processing fees apply.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
