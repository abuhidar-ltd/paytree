"use client"

import Link from "next/link"
import { trackEvent } from "@/lib/analytics"
import type { ComponentProps, ReactNode } from "react"

type LinkProps = ComponentProps<typeof Link>

interface TrackedLinkProps extends Omit<LinkProps, "children"> {
  event: string
  eventProps?: Record<string, string | number | boolean | null>
  /**
   * Optional location label. When supplied, also fires the unified
   * `cta_clicked` event with `{ location }` for consistent funnel analysis.
   */
  location?: string
  children: ReactNode
}

/**
 * Next.js Link wrapper that fires a tracking event on click.
 *
 * IMPORTANT: this uses Next.js soft navigation (History API) instead of a
 * plain <a href>. Plain anchors trigger a hard page load, which causes
 * TikTok's in-app browser to re-validate the destination URL against its
 * safety blocklist — auth keywords like /join, /signup, /register all hit
 * the "TikTok can't open this page directly" interstitial. Soft navigation
 * bypasses that check entirely because the URL change is client-side.
 */
export function TrackedLink({ event, eventProps, location, onClick, children, ...rest }: TrackedLinkProps) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        trackEvent(event, eventProps)
        if (location) {
          trackEvent("cta_clicked", { ...eventProps, location })
        }
        onClick?.(e)
      }}
    >
      {children}
    </Link>
  )
}
