import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { PricingCards } from "./pricing-cards"
import Link from "next/link"

export default async function PricingPage() {
  const currentUser = await getCurrentUser()

  let userPlan = "free"
  let userStatus = "free"
  if (currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { subscriptionStatus: true, subscriptionPlan: true },
    })
    userStatus = user?.subscriptionStatus || "free"
    userPlan = user?.subscriptionPlan || "free"
  }

  const isActive =
    userStatus === "active" ||
    userStatus === "trial" ||
    userStatus === "canceling"

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden">
      <PremiumBackground />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 safe-top safe-bottom">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <Link
            href={currentUser ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 mb-6 sm:mb-8 text-[#888888] hover:text-white transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="heading-xl mb-4 sm:mb-6 text-white">
            Choose Your <span className="kinetic-shimmer">Plan</span>
          </h1>
          <p className="text-body-lg text-[#888888] max-w-2xl mx-auto px-4">
            Start with a 7-day free trial. Cancel anytime.
          </p>
        </div>

        {/* Interactive pricing cards */}
        <PricingCards
          isLoggedIn={!!currentUser}
          isActive={isActive}
          currentPlan={userPlan}
        />

        {/* Trust Signals */}
        <div className="mt-10 sm:mt-16 text-center space-y-6 sm:space-y-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {["Cancel anytime", "No hidden fees", "Secure payment via Stripe"].map(
              (item, i) => (
                <div key={i} className="flex items-center gap-2 text-[#888888] text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </div>
              )
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#555555] max-w-md mx-auto leading-relaxed px-4">
            Your trial begins immediately. You won&apos;t be charged until after
            7 days, and you can cancel anytime before then.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 sm:mt-24 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {[
              {
                q: "What happens after my free trial?",
                a: "After 7 days you\u2019ll be billed at the rate you chose (monthly or annual). Cancel before the trial ends to avoid any charges.",
              },
              {
                q: "Can I switch between Starter and Ultra?",
                a: "Yes! You can upgrade or downgrade at any time. When upgrading, you\u2019ll be prorated for the remainder of your billing cycle.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel from Settings at any time. Your features stay active until the end of the billing period.",
              },
              {
                q: "Do you take a cut of my payments?",
                a: "Every paid plan has 0% platform fees. You keep 100% of every sale. We make money from subscriptions, not your revenue. Stripe\u2019s standard processing fees still apply.",
              },
            ].map((faq, i) => (
              <div key={i} className="glass-brick !cursor-default">
                <h3 className="font-bold mb-3 text-base sm:text-lg text-white">{faq.q}</h3>
                <p className="text-sm sm:text-base text-[#888888] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 sm:mt-24 text-center">
          <p className="text-xs sm:text-sm text-[#555555]">
            0% platform fees on every paid plan. Stripe processing fees apply.
          </p>
        </div>
      </div>
    </div>
  )
}
