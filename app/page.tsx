import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { ObsidianCard } from "@/components/ui/obsidian-card"
import { HomeHeroInput } from "./home-hero-input"
import { HomeScrollStoryLoader } from "./home-scroll-story-loader"

const features = [
  { icon: "📡", title: "Live Alerts", desc: "Broadcast your status in real-time" },
  { icon: "🚪", title: "Deep Portals", desc: "Nested folders for organized links" },
  { icon: "📊", title: "Authority Stats", desc: "Show off your achievements" },
  { icon: "₿", title: "Crypto Vault", desc: "Accept tips in any cryptocurrency" },
  { icon: "🎨", title: "Obsidian Themes", desc: "Premium glass aesthetics" },
  { icon: "📈", title: "Analytics", desc: "Track views, clicks, and conversions" },
  { icon: "✨", title: "Parallax Physics", desc: "3D tilt effects that catch light" },
  { icon: "⚡", title: "Instant Updates", desc: "Real-time preview as you build" },
  { icon: "📱", title: "Mobile First", desc: "Optimized for every device" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden">
      <PremiumBackground />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(3,3,3,0.8)] backdrop-blur-xl safe-top">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_20px_rgba(0,255,136,0.3)]" />
            <span className="kinetic-shimmer">PayTree</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-[#888888] hover:text-white transition-colors text-sm hidden sm:block">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="accent" size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-16 relative">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-3 glass-brick rounded-full mb-8 fade-in">
            <span className="beeping-dot" />
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              V2.0 Now Available
            </span>
          </div>

          {/* Headline */}
          <h1 className="heading-xl mb-6 px-4 slide-up">
            <span className="block text-white mb-2">Organize.</span>
            <span className="block text-white mb-2">Control.</span>
            <span className="block kinetic-shimmer-accent">Monetize.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-body-lg text-[#888888] mb-12 max-w-2xl mx-auto px-4 slide-up delay-200">
            Stop using boring vertical lists. Upgrade to a powerful bento-grid
            interface that turns your bio link into a high-converting landing page.
          </p>

          {/* Username Claim Input (client component) */}
          <div className="max-w-md mx-auto mb-8 slide-up delay-300">
            <HomeHeroInput />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 slide-up delay-400">
            <Link href="/register">
              <Button variant="accent-solid" size="lg" className="text-lg">
                Start Free Trial
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>

          <p className="text-sm text-[#555555] mt-4 slide-up delay-500">
            No credit card &bull; 14-day trial &bull; Cancel anytime
          </p>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 fade-in delay-800">
            <svg className="w-6 h-6 text-[#888888] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Scroll Story (lazy-loaded client component) */}
      <HomeScrollStoryLoader />

      {/* Feature Bento Grid */}
      <section className="py-24 sm:py-32 relative z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="heading-lg mb-4 text-white">
              Power User Features
            </h2>
            <p className="text-body-lg text-[#888888] max-w-2xl mx-auto">
              Everything you need to control your digital presence in one powerful platform.
            </p>
          </div>

          <div className="bento-3x3 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="glass-brick h-full slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="title text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[#888888]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 relative z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <ObsidianCard variant="accent" className="text-center p-8 sm:p-12">
              <h2 className="heading-lg mb-4 text-white">
                Ready to Build Your Terminal?
              </h2>
              <p className="text-body-lg text-[#888888] mb-8">
                Join thousands of creators using PayTree to present their links beautifully.
              </p>
              <Link href="/register">
                <Button variant="accent-solid" size="lg" className="text-lg">
                  Start Free Trial
                </Button>
              </Link>
              <p className="text-sm text-[#555555] mt-4">
                7-day free trial &bull; $4.99/month after &bull; Cancel anytime
              </p>
            </ObsidianCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.05)] bg-[rgba(3,3,3,0.8)] backdrop-blur-xl safe-bottom">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
              <span className="font-bold text-white">PayTree</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#888888]">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="border-t border-[rgba(255,255,255,0.05)] mt-6 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#555555]">
              <div>&copy; {new Date().getFullYear()} PayTree. All rights reserved.</div>
              <div>0% commissions by PayTree. Third-party fees may apply.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
