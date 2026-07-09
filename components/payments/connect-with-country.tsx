"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ArrowUpRight, ChevronDown } from "lucide-react"
import { track } from "@/lib/analytics"
import { STRIPE_COUNTRIES } from "@/lib/stripe-countries"
import { paymentsUnderMaintenance } from "@/lib/payments-live"
import { PaymentsMaintenanceNotice } from "@/components/ui/payments-maintenance"

/**
 * Country picker + "Connect Stripe" button, used anywhere a NEW Stripe Express
 * account is created (payments page + settings). The account's country is
 * locked at Stripe once created and defaults to the platform's country (US)
 * when omitted, so we make the creator choose it here BEFORE firing the
 * connect route. Saving country first also means the connect route's
 * `country_required` backstop never has to bounce this user cross-page.
 */
export function ConnectWithCountry({
  savedCountry,
  source,
  buttonLabel = "Connect Stripe",
}: {
  savedCountry?: string | null
  source: string
  buttonLabel?: string
}) {
  // Both call sites (payments page + settings) only render this AFTER the
  // profile has loaded, so `savedCountry` is already final at mount — no
  // prop-sync effect needed.
  const [country, setCountry] = useState(savedCountry?.toUpperCase() ?? "")
  const [connecting, setConnecting] = useState(false)

  // TEMPORARY: live Stripe Connect onboarding is paused while Stripe reviews our
  // live application. Show the "back soon" notice instead of the connect form.
  // Test mode is never gated. Lift by flipping PAYMENTS_LIVE in lib/payments-live.ts.
  const maintenance = paymentsUnderMaintenance()

  // Full-page nav means this component dies with the document — but coming
  // BACK via bfcache would restore a stuck "Connecting…" button without this.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) setConnecting(false)
    }
    window.addEventListener("pageshow", reset)
    return () => window.removeEventListener("pageshow", reset)
  }, [])

  const handleConnect = async () => {
    if (!country || connecting) return
    setConnecting(true)
    track("click_stripe_connect", { source })
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      })
      if (!res.ok) {
        toast.error("Couldn't save your country. Please try again.")
        setConnecting(false)
        return
      }
    } catch {
      toast.error("Network error. Please try again.")
      setConnecting(false)
      return
    }
    window.location.href = "/api/stripe/connect"
  }

  if (maintenance) {
    return (
      <div className="w-full">
        <PaymentsMaintenanceNotice body="You'll be able to connect Stripe and start getting paid the moment we're back — very soon. Everything else on your page works as normal." />
      </div>
    )
  }

  return (
    <div className="w-full">
      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#b8b8b8] mb-1.5 text-left">
        Payout country
      </label>
      <div className="relative">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full appearance-none bg-white/[0.03] border border-white/[0.08] rounded-xl pl-3.5 pr-9 py-2.5 text-sm font-mono text-[#e0e0e0] focus:border-[#00ff88]/40 outline-none cursor-pointer"
          style={{ minHeight: 44 }}
          aria-label="Payout country"
        >
          <option value="" disabled>
            Select your country
          </option>
          {STRIPE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-[#080808]">
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8b8b8] pointer-events-none"
        />
      </div>

      <button
        onClick={handleConnect}
        disabled={!country || connecting}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-5 py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {connecting ? "Connecting…" : <>{buttonLabel} <ArrowUpRight size={14} /></>}
      </button>

      <p className="text-[11px] font-mono text-[#b8b8b8] mt-2 text-left leading-relaxed">
        Where you&apos;ll receive payouts. Stripe supports the countries listed — this can&apos;t be changed after setup.
      </p>
    </div>
  )
}
