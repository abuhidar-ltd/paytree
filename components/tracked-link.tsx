"use client"

import { trackEvent } from "@/lib/analytics"
import type { AnchorHTMLAttributes, ReactNode } from "react"

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: string
  eventProps?: Record<string, string | number | boolean | null>
  children: ReactNode
}

/**
 * Drop-in <a> replacement that fires a tracking event on click.
 * Lets server components attach analytics without becoming client components.
 */
export function TrackedLink({ event, eventProps, onClick, children, ...rest }: TrackedLinkProps) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        trackEvent(event, eventProps)
        onClick?.(e)
      }}
    >
      {children}
    </a>
  )
}
