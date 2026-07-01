"use client"

import { useEffect } from "react"
import { track } from "@/lib/analytics"

interface PricingPageViewProps {
  isLoggedIn: boolean
  currentPlan: string
}

export function PricingPageView({ isLoggedIn, currentPlan }: PricingPageViewProps) {
  useEffect(() => {
    track("view_pricing", { logged_in: isLoggedIn, current_plan: currentPlan })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
