"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PricingCardsProps {
  isLoggedIn: boolean
  isActive: boolean
  currentPlan: string
}

const STARTER_FEATURES = [
  "Publish your live terminal",
  "Unlimited links",
  "Unlimited modules",
  "Deep Portals (nested folders)",
  "Live Broadcast Mode",
  "Authority Stats counters",
  "Basic analytics (views, clicks, CTR)",
  "1 shop product",
  "Link scheduling",
  "Locked links (email capture)",
  "Audience email export",
]

const PRO_FEATURES = [
  "Everything in Starter",
  "Unlimited shop products",
  "Unlimited vault items",
  "Advanced analytics + referrals",
  "AI Link Optimizer",
  "AI Bio Generator",
  "AI Insights Dashboard",
  "Email follow-ups",
  "Crypto Vault (tips in BTC/ETH/SOL)",
  "Custom Obsidian themes",
  "Priority support",
]

export function PricingCards({ isLoggedIn, isActive, currentPlan }: PricingCardsProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState<string | null>(null)

  const starterPrice = interval === "monthly" ? "$4.99" : "$39.99"
  const starterPer = interval === "monthly" ? "/mo" : "/yr"
  const starterSave = interval === "yearly" ? "Save 33%" : null

  const proPrice = interval === "monthly" ? "$29" : "$249"
  const proPer = interval === "monthly" ? "/mo" : "/yr"
  const proSave = interval === "yearly" ? "Save 28%" : null

  async function handleCheckout(plan: "starter" | "pro") {
    setLoading(plan)
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Something went wrong")
      }
    } catch {
      alert("Network error. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setInterval("monthly")}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            interval === "monthly"
              ? "bg-[#00ff88] text-black"
              : "bg-[rgba(255,255,255,0.05)] text-[#888888] hover:text-white"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval("yearly")}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            interval === "yearly"
              ? "bg-[#00ff88] text-black"
              : "bg-[rgba(255,255,255,0.05)] text-[#888888] hover:text-white"
          }`}
        >
          Yearly
        </button>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Starter */}
        <div className="obsidian-card-static p-6 sm:p-8 relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-white">Starter</h3>
            {starterSave && (
              <span className="text-xs font-bold bg-[rgba(0,255,136,0.1)] text-[#00ff88] px-2.5 py-1 rounded-full border border-[rgba(0,255,136,0.3)]">
                {starterSave}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl sm:text-5xl font-bold text-[#00ff88]">{starterPrice}</span>
            <span className="text-lg text-[#888888]">{starterPer}</span>
          </div>
          <p className="text-sm text-[#555555] mb-8">7-day free trial included</p>

          <ul className="space-y-3 mb-8 flex-1">
            {STARTER_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-[#cccccc]">{f}</span>
              </li>
            ))}
          </ul>

          {isActive && currentPlan === "starter" ? (
            <Button disabled variant="accent-solid" className="w-full min-h-[48px] font-bold">
              Current Plan
            </Button>
          ) : isActive && currentPlan === "pro" ? (
            <Button disabled variant="ghost" className="w-full min-h-[48px]">
              Downgrade from Pro
            </Button>
          ) : isLoggedIn ? (
            <Button
              variant="accent-solid"
              className="w-full min-h-[48px] font-bold"
              onClick={() => handleCheckout("starter")}
              disabled={loading === "starter"}
            >
              {loading === "starter" ? "Loading…" : "Start Free Trial"}
            </Button>
          ) : (
            <Link href="/register" className="block">
              <Button variant="accent-solid" className="w-full min-h-[48px] font-bold">
                Get Started
              </Button>
            </Link>
          )}
        </div>

        {/* Pro */}
        <div className="obsidian-card-accent p-6 sm:p-8 relative overflow-hidden flex flex-col">
          {/* Popular badge */}
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-[rgba(0,255,136,0.15)] border border-[rgba(0,255,136,0.4)] rounded-full text-xs font-bold text-[#00ff88] flex items-center gap-1.5">
            <span className="beeping-dot !w-1.5 !h-1.5" />
            MOST POPULAR
          </div>

          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-white">Pro</h3>
            {proSave && (
              <span className="text-xs font-bold bg-[rgba(0,255,136,0.1)] text-[#00ff88] px-2.5 py-1 rounded-full border border-[rgba(0,255,136,0.3)]">
                {proSave}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl sm:text-5xl font-bold text-[#00ff88]">{proPrice}</span>
            <span className="text-lg text-[#888888]">{proPer}</span>
          </div>
          <p className="text-sm text-[#555555] mb-8">7-day free trial included</p>

          <ul className="space-y-3 mb-8 flex-1">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-[#cccccc]">{f}</span>
              </li>
            ))}
          </ul>

          {isActive && currentPlan === "pro" ? (
            <Button disabled variant="accent-solid" className="w-full min-h-[48px] font-bold">
              Current Plan
            </Button>
          ) : isActive && currentPlan === "starter" ? (
            <Button
              variant="accent-solid"
              className="w-full min-h-[48px] font-bold"
              onClick={() => handleCheckout("pro")}
              disabled={loading === "pro"}
            >
              {loading === "pro" ? "Loading…" : "Upgrade to Pro"}
            </Button>
          ) : isLoggedIn ? (
            <Button
              variant="accent-solid"
              className="w-full min-h-[48px] font-bold"
              onClick={() => handleCheckout("pro")}
              disabled={loading === "pro"}
            >
              {loading === "pro" ? "Loading…" : "Start Free Trial"}
            </Button>
          ) : (
            <Link href="/register" className="block">
              <Button variant="accent-solid" className="w-full min-h-[48px] font-bold">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
