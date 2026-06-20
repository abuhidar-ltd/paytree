"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"

interface PricingPageViewProps {
  isLoggedIn: boolean
  currentPlan: string
}

export function PricingPageView({ isLoggedIn, currentPlan }: PricingPageViewProps) {
  useEffect(() => {
    trackEvent("pricing_page_viewed", { logged_in: isLoggedIn, current_plan: currentPlan })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
