import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { UpgradeButton } from "./upgrade-button"

// Auth-gated, reads request headers via getCurrentUser. Force-dynamic so
// the build doesn't try (and fail) to pre-render it.
export const dynamic = "force-dynamic"

export default async function UpgradePage() {
  const currentUser = await getCurrentUser()
  
  if (!currentUser) {
    redirect("/login?callbackUrl=/upgrade")
  }
  
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { 
      subscriptionStatus: true,
      username: true,
      pageStatus: true,
    }
  })
  
  if (!user) {
    redirect("/login")
  }
  
  const isPro = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'canceling'
  
  if (isPro) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden">
      <PremiumBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(3,3,3,0.8)] backdrop-blur-xl sticky top-0 safe-top">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_20px_rgba(0,255,136,0.3)]" />
            <span className="text-white hidden sm:inline">Paytree</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="min-h-[44px]">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-16 safe-bottom">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 glass-card rounded-full mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]" />
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white">Limited Time Offer</span>
          </div>
          <h1 className="heading-lg sm:heading-xl mb-4 sm:mb-6 kinetic-shimmer-accent px-4">
            Upgrade to Paytree Pro
          </h1>
          <p className="text-body-lg text-[#888888] max-w-2xl mx-auto leading-relaxed px-4">
            Unlock unlimited links, premium themes, analytics, and publish your page to the world
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-2xl mx-auto">
          <div className="obsidian-card-accent p-6 sm:p-10 relative overflow-hidden animate-scale-in">
            
            {/* Trial Badge */}
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 px-3 sm:px-4 py-2 bg-[#00ff88] rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 text-[#030303]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              7-DAY FREE TRIAL
            </div>

            <div className="relative z-10">
              <div className="text-center mb-8 sm:mb-10 pt-8 sm:pt-6">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-white">
                  Paytree Pro
                </h3>
                <div className="flex items-baseline justify-center gap-2 mb-3">
                  <span className="text-5xl sm:text-7xl font-black kinetic-shimmer-accent">
                    $4.99
                  </span>
                  <span className="text-xl sm:text-2xl text-[#888888]">/month</span>
                </div>
                <p className="text-[#888888] text-base sm:text-lg">
                  Cancel anytime &bull; No hidden fees
                </p>
              </div>

              {/* What you'll unlock */}
              <div className="mb-8 sm:mb-10">
                <h4 className="text-base sm:text-lg font-bold mb-5 sm:mb-6 text-center text-[#00ff88]">
                  What You&apos;ll Unlock
                </h4>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { icon: "🚀", title: "Publish Your Page", desc: "Get your permanent paytree.to/" + user.username + " link" },
                    { icon: "🔗", title: "Unlimited Links", desc: "Add as many payment links as you need" },
                    { icon: "📊", title: "Advanced Analytics", desc: "Track views, clicks, and conversions" },
                    { icon: "🎯", title: "Custom Branding", desc: "Coming soon - Colors, fonts, and backgrounds", comingSoon: true },
                    { icon: "🎨", title: "Premium Themes", desc: "Coming soon - More themes in development", comingSoon: true },
                    { icon: "⚡", title: "Priority Support", desc: "Coming soon - Enhanced support options", comingSoon: true },
                  ].map((feature, i) => (
                    <div 
                      key={i}
                      className={`glass-card rounded-xl p-4 hover:bg-white/5 transition-all group ${feature.comingSoon ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`text-2xl sm:text-3xl group-hover:scale-110 transition-transform ${feature.comingSoon ? 'grayscale' : ''}`}>
                          {feature.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold mb-1 text-sm sm:text-base flex items-center gap-2 ${feature.comingSoon ? 'text-[#555555]' : 'text-white'}`}>
                            {feature.title}
                            {feature.comingSoon && <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-[#555555]">Soon</span>}
                          </div>
                          <div className={`text-xs sm:text-sm ${feature.comingSoon ? 'text-[#444444]' : 'text-[#888888]'}`}>{feature.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-4">
                <UpgradeButton />
                <p className="text-center text-xs sm:text-sm text-[#555555]">
                  Your trial starts immediately. You won&apos;t be charged until after 7 days.
                </p>
              </div>

              {/* Trust signals */}
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[rgba(255,255,255,0.05)]">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-[#888888]">
                  {["Cancel anytime", "Secure payment", "Instant activation"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12 sm:mt-16 space-y-4 sm:space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-white">Frequently Asked Questions</h3>
            
            {[
              {
                q: "What happens after the free trial?",
                a: "After 7 days, you'll be charged $4.99/month to keep your Pro features and published page. You can cancel anytime before the trial ends to avoid being charged."
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely! Cancel your subscription at any time with one click. If you cancel during your trial, you won't be charged. If you cancel after, your Pro features remain active until the end of your billing period."
              },
              {
                q: "Will my page stay published if I cancel?",
                a: "Your published page will remain live until the end of your current billing period. After that, your page will become unpublished but your design and links will be saved."
              },
              {
                q: "Is payment secure?",
                a: "Yes! All payments are processed securely through Stripe, the same payment processor used by companies like Amazon, Google, and Shopify. We never see or store your credit card information."
              }
            ].map((faq, i) => (
              <div key={i} className="glass-card-hover rounded-2xl p-5 sm:p-6 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <h4 className="font-bold text-base sm:text-lg mb-2 text-white">{faq.q}</h4>
                <p className="text-sm sm:text-base text-[#888888] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-[#555555]">
            0% commissions by Paytree. Third-party fees may apply.
          </p>
        </div>
      </div>
    </div>
  )
}
