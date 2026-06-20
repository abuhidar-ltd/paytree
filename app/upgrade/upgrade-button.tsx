"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { trackEvent } from "@/lib/analytics"

export function UpgradeButton() {
  const [isLoading, setIsLoading] = useState(false)

  // /upgrade is a server component, so this client child carries the mount
  // event for the whole page — it's always rendered when the page renders.
  useEffect(() => {
    trackEvent("upgrade_page_viewed", { source: "upgrade_page" })
  }, [])

  const handleUpgrade = async () => {
    setIsLoading(true)
    trackEvent("upgrade_checkout_started", { plan: "pro", billing: "monthly" })
    toast.info("Creating checkout session...")

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL received')
        }
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to create checkout session")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isLoading}
      className="w-full min-h-[56px] sm:min-h-[64px] bg-[#00ff88] hover:bg-[#00cc6a] text-[#030303] text-lg sm:text-xl font-bold rounded-xl shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_50px_rgba(0,255,136,0.5)] transform hover:scale-[1.01] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-navy-deep" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating checkout...
        </>
      ) : (
        <>🎉 Start Your Free Trial</>
      )}
    </Button>
  )
}
