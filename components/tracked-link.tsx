"use client"

import Link from "next/link"
import { track, type EventName } from "@/lib/analytics"
import type { ComponentProps, ReactNode } from "react"

type LinkProps = ComponentProps<typeof Link>

interface TrackedLinkProps extends Omit<LinkProps, "children"> {
  event: EventName
  eventProps?: Record<string, string | number | boolean | null>
  /**
   * Optional source label (hero | header | sticky | section) merged into the
   * event props for consistent funnel analysis.
   */
  source?: string
  children: ReactNode
}

/**
 * Next.js Link wrapper that fires a tracking event on click.
 *
 * IMPORTANT: this uses Next.js soft navigation (History API) instead of a
 * plain <a href>. Plain anchors trigger a hard page load, which causes
 * TikTok's in-app browser to re-validate the destination URL against its
 * safety blocklist — auth keywords like /join, /signup, /register have hit
 * the "TikTok can't open this page directly" interstitial. Soft navigation
 * bypasses that check entirely because the URL change is client-side, which
 * is why internal CTAs can safely point at /register.
 */
export function TrackedLink({ event, eventProps, source, onClick, children, ...rest }: TrackedLinkProps) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        track(event, { ...eventProps, ...(source ? { source } : {}) })
        onClick?.(e)
      }}
    >
      {children}
    </Link>
  )
}
