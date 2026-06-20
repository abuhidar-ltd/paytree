"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"

interface PricingCardsProps {
  isLoggedIn: boolean
  isActive: boolean
  currentPlan: string
}

const FREE_FEATURES = [
  { text: "Publish your page", included: true },
  { text: "Unlimited basic links", included: true },
  { text: "Text, image & YouTube blocks", included: true },
  { text: "Social links", included: true },
  { text: "Drop countdown cards", included: true },
  { text: "Vault & password gates", included: true },
  { text: "Basic link analytics", included: true },
  { text: "Sell products", included: false },
]

const STARTER_FEATURES = [
  { text: "Everything in Free", included: true },
  { text: "Sell products (0% fees)", included: true },
  { text: "Payment-locked cards", included: true },
  { text: "Email audience export", included: true },
  { text: "Custom styles & backgrounds", included: true },
  { text: "Scheduled visibility", included: true },
  { text: "No AI agent", included: false },
]

const ULTRA_FEATURES = [
  { text: "Everything in Starter", included: true },
  { text: "AI sales agent on your page", included: true },
  { text: "Globe analytics + advanced insights", included: true },
  { text: "Remove Paytree branding", included: true },
  { text: "Priority support", included: true },
]

export function PricingCards({ isLoggedIn, isActive, currentPlan }: PricingCardsProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState<string | null>(null)

  const normalizedPlan = currentPlan === "pro" ? "ultra" : currentPlan

  const starterPrice = interval === "monthly" ? "$7" : "$59"
  const starterPer = interval === "monthly" ? "/mo" : "/yr"
  const starterSave = interval === "yearly" ? "Save 30%" : null

  const ultraPrice = interval === "monthly" ? "$19" : "$159"
  const ultraPer = interval === "monthly" ? "/mo" : "/yr"
  const ultraSave = interval === "yearly" ? "Save 30%" : null

  async function handleCheckout(plan: "starter" | "ultra") {
    trackEvent("pricing_checkout_started", { plan, interval })
    setLoading(plan)
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      })
      const data = await res.json()
      if (data.url) {
        trackEvent("pricing_checkout_redirected", { plan, interval })
        window.location.href = data.url
      } else {
        trackEvent("pricing_checkout_failed", { plan, interval, reason: data.error || "unknown" })
        alert(data.error || "Something went wrong")
      }
    } catch {
      trackEvent("pricing_checkout_failed", { plan, interval, reason: "network" })
      alert("Network error. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Interval toggle — segmented control, 44px tall, scale-tap feedback. */}
      <div
        className="inline-flex mx-auto items-center p-1 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]"
        style={{ width: "fit-content" }}
      >
        <button
          onClick={() => setInterval("monthly")}
          className={`min-h-[40px] px-5 rounded-full text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
            interval === "monthly"
              ? "bg-[#00ff88] text-black"
              : "text-[#888888] hover:text-white"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval("yearly")}
          className={`min-h-[40px] px-5 rounded-full text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
            interval === "yearly"
              ? "bg-[#00ff88] text-black"
              : "text-[#888888] hover:text-white"
          }`}
        >
          Yearly
        </button>
      </div>

      {/* Cards — stacked on mobile, 3-up on md+. Smaller padding + lower gap
          at 375px keeps the cards from feeling cramped without scrolling. */}
      <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
        {/* Free */}
        <motion.div
          className="obsidian-card-static p-5 sm:p-8 relative overflow-hidden flex flex-col"
          initial={{ y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0, type: "spring", stiffness: 120, damping: 20 }}
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Free</h3>
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl sm:text-5xl font-bold text-[#e0e0e0]">$0</span>
            <span className="text-lg text-[#888888]">/mo</span>
          </div>
          <p className="text-sm text-[#555555] mb-2 font-semibold">Build and publish free</p>
          <p className="text-xs text-[#444] mb-8">Publish your page, add drops, vault gates, and see analytics.</p>

          <ul className="space-y-3 mb-8 flex-1">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                {f.included ? (
                  <svg className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#444] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={`text-sm ${f.included ? "text-[#cccccc]" : "text-[#555]"}`}>{f.text}</span>
              </li>
            ))}
          </ul>

          {isLoggedIn && normalizedPlan === "free" ? (
            <Button disabled variant="ghost" className="w-full min-h-[48px] font-bold">
              Current Plan
            </Button>
          ) : !isLoggedIn ? (
            <Link
              href="/start"
              className="block"
              onClick={() => trackEvent("pricing_plan_selected", { plan: "free" })}
            >
              <Button variant="accent-solid" className="w-full min-h-[48px] font-bold">
                Create your page for free →
              </Button>
            </Link>
          ) : (
            <Button disabled variant="ghost" className="w-full min-h-[48px]">
              Free Plan
            </Button>
          )}
        </motion.div>

        {/* Starter (highlighted) */}
        <motion.div
          className="obsidian-card-accent p-5 sm:p-8 relative overflow-hidden flex flex-col"
          initial={{ y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 20 }}
        >
          {/* Inline badge on mobile (avoids overlap with title), absolute on
              desktop where the card is wider. */}
          <div className="sm:absolute sm:top-4 sm:right-4 mb-4 sm:mb-0 inline-flex w-fit px-3 py-1.5 bg-[rgba(0,255,136,0.15)] border border-[rgba(0,255,136,0.4)] rounded-full text-xs font-bold text-[#00ff88] items-center gap-1.5">
            <span className="beeping-dot !w-1.5 !h-1.5" />
            MOST POPULAR
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Starter</h3>
            {starterSave && (
              <span className="text-xs font-bold bg-[rgba(0,255,136,0.1)] text-[#00ff88] px-2.5 py-1 rounded-full border border-[rgba(0,255,136,0.3)] ml-2">
                {starterSave}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl sm:text-5xl font-bold text-[#00ff88]">{starterPrice}</span>
            <span className="text-lg text-[#888888]">{starterPer}</span>
          </div>
          <p className="text-xs text-[#00ff88] font-mono mb-2">7-day free trial included</p>
          <p className="text-sm text-[#555555] mb-2 font-semibold">Sell and grow</p>
          <p className="text-xs text-[#444] mb-8">Sell products, gate content behind payments, and export your audience.</p>

          <ul className="space-y-3 mb-8 flex-1">
            {STARTER_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                {f.included ? (
                  <svg className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#444] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={`text-sm ${f.included ? "text-[#cccccc]" : "text-[#555]"}`}>{f.text}</span>
              </li>
            ))}
          </ul>

          {isActive && normalizedPlan === "starter" ? (
            <Button disabled variant="accent-solid" className="w-full min-h-[48px] font-bold">
              Current Plan
            </Button>
          ) : isActive && normalizedPlan === "ultra" ? (
            <Button disabled variant="ghost" className="w-full min-h-[48px]">
              Downgrade from Ultra
            </Button>
          ) : isLoggedIn ? (
            <>
              <Button
                variant="accent-solid"
                className="w-full min-h-[48px] font-bold"
                onClick={() => handleCheckout("starter")}
                disabled={loading === "starter"}
              >
                {loading === "starter" ? "Loading…" : "Try free for 7 days →"}
              </Button>
              <p className="text-center text-[10px] text-[#444] font-mono mt-2">No charge until after your trial ends</p>
            </>
          ) : (
            <Link
              href="/start"
              className="block"
              onClick={() => trackEvent("pricing_plan_selected", { plan: "starter", interval })}
            >
              <Button variant="accent-solid" className="w-full min-h-[48px] font-bold">
                Try free for 7 days →
              </Button>
              <p className="text-center text-[10px] text-[#444] font-mono mt-2">No charge until after your trial ends</p>
            </Link>
          )}
        </motion.div>

        {/* Ultra */}
        <motion.div
          className="obsidian-card-static p-5 sm:p-8 relative overflow-hidden flex flex-col"
          initial={{ y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 20 }}
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Ultra</h3>
            {ultraSave && (
              <span className="text-xs font-bold bg-[rgba(0,255,136,0.1)] text-[#00ff88] px-2.5 py-1 rounded-full border border-[rgba(0,255,136,0.3)] ml-2">
                {ultraSave}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl sm:text-5xl font-bold text-[#00ff88]">{ultraPrice}</span>
            <span className="text-lg text-[#888888]">{ultraPer}</span>
          </div>
          <p className="text-xs text-[#00ff88] font-mono mb-2">7-day free trial included</p>
          <p className="text-sm text-[#555555] mb-2 font-semibold">Maximize revenue</p>
          <p className="text-xs text-[#444] mb-8">Everything in Starter, plus AI that sells for you and globe analytics.</p>

          <ul className="space-y-3 mb-8 flex-1">
            {ULTRA_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                {f.included ? (
                  <svg className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#444] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={`text-sm ${f.included ? "text-[#cccccc]" : "text-[#555]"}`}>{f.text}</span>
              </li>
            ))}
          </ul>

          {isActive && normalizedPlan === "ultra" ? (
            <Button disabled variant="accent-solid" className="w-full min-h-[48px] font-bold">
              Current Plan
            </Button>
          ) : isActive && normalizedPlan === "starter" ? (
            <Button
              variant="accent-solid"
              className="w-full min-h-[48px] font-bold"
              onClick={() => handleCheckout("ultra")}
              disabled={loading === "ultra"}
            >
              {loading === "ultra" ? "Loading…" : "Upgrade to Ultra"}
            </Button>
          ) : isLoggedIn ? (
            <>
              <Button
                variant="accent-solid"
                className="w-full min-h-[48px] font-bold"
                onClick={() => handleCheckout("ultra")}
                disabled={loading === "ultra"}
              >
                {loading === "ultra" ? "Loading…" : "Try free for 7 days →"}
              </Button>
              <p className="text-center text-[10px] text-[#444] font-mono mt-2">No charge until after your trial ends</p>
            </>
          ) : (
            <Link
              href="/start"
              className="block"
              onClick={() => trackEvent("pricing_plan_selected", { plan: "ultra", interval })}
            >
              <Button variant="accent-solid" className="w-full min-h-[48px] font-bold">
                Try free for 7 days →
              </Button>
              <p className="text-center text-[10px] text-[#444] font-mono mt-2">No charge until after your trial ends</p>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Comparison callout */}
      <div className="max-w-3xl mx-auto text-center mt-10">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-sm text-[#e0e0e0] font-mono">
            vs Linktree Premium ($35/mo) — Paytree Ultra is <span className="text-[#00ff88] font-bold">$16/mo cheaper</span> with more features. <span className="text-[#00ff88] font-bold">0% fees on every paid plan.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
