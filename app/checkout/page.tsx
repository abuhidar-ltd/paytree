"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PremiumBackground } from "@/components/backgrounds/premium-background"

export default function CheckoutPage() {
  const { data: session, isPending } = useSession()
  const user = session?.user
  const isLoaded = !isPending
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") || "monthly"
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login")
    }
  }, [isLoaded, user, router])

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <PremiumBackground />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const planDetails: {
    [key: string]: {
      name: string
      price: string
      period: string
      description: string
      badge?: string
    }
  } = {
    monthly: {
      name: "Pro Monthly",
      price: "$4.99",
      period: "per month",
      description: "Billed monthly, cancel anytime",
    },
    yearly: {
      name: "Pro Yearly",
      price: "$45",
      period: "per year",
      description: "Save 25% with annual billing",
      badge: "Best Value"
    }
  }

  const selectedPlan = planDetails[plan] || planDetails.monthly

  return (
    <div className="min-h-screen text-white relative">
      <PremiumBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_20px_rgba(0,255,136,0.3)]" />
            Paytree
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Complete your subscription
            </h1>
            <p className="text-xl text-gray-400">
              Start your 7-day free trial today
            </p>
          </div>

          {/* Plan Summary */}
          <div className="glass rounded-3xl p-8 mb-8 animate-scale-in delay-100">
            {selectedPlan.badge && (
              <div className="inline-block px-4 py-1 bg-[#00ff88] text-[#030303] rounded-full text-sm font-bold mb-4">
                {selectedPlan.badge}
              </div>
            )}
            
            <h2 className="text-3xl font-bold mb-2">{selectedPlan.name}</h2>
            <div className="mb-4">
              <span className="text-5xl font-bold">{selectedPlan.price}</span>
              <span className="text-gray-400 ml-2">{selectedPlan.period}</span>
            </div>
            <p className="text-gray-400 mb-6">{selectedPlan.description}</p>

            {/* Trial Info */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                <div>
                  <div className="font-semibold text-green-400 mb-1">7-Day Free Trial</div>
                  <div className="text-sm text-gray-300">
                    You won&apos;t be charged until your trial ends. Cancel anytime during the trial at no cost.
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {[
                "Remove Paytree branding",
                "Advanced analytics & insights",
                "Premium 3D themes",
                "Custom colors & fonts",
                "Priority support",
                "Link scheduling"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-14 bg-[#00ff88] hover:bg-[#00cc6a] text-[#030303] rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(0,255,136,0.3)]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                "Continue to Payment"
              )}
            </Button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Secure payment powered by Stripe
            </p>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

