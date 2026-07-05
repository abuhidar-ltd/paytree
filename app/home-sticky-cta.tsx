"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { track } from "@/lib/analytics"

interface HomeStickyCTAProps {
  isLoggedIn: boolean
  /**
   * Detected server-side (app/page.tsx, via lib/iab.ts) from the request's
   * user-agent header — correct on first paint, no client effect needed.
   */
  isTwitterIAB: boolean
}

// X's in-app browser draws its own native bottom toolbar (back/forward/share/
// Safari icons) OVER the WebView content — it lives outside our DOM entirely,
// so no z-index on our side can win against it. env(safe-area-inset-bottom)
// doesn't account for it either (it's app chrome, not a hardware safe area).
// The only fix is to lift our fixed bar above where that toolbar sits.
const TWITTER_IAB_CHROME_HEIGHT = 56

/**
 * Mobile-only sticky bottom CTA. Appears after the user scrolls past the
 * hero so it does not compete with the hero CTA on first paint. Funnel
 * insurance for bounce-prone landing traffic (TikTok/IG visitors who don't
 * scroll back up after exploring).
 */
export function HomeStickyCTA({ isLoggedIn, isTwitterIAB }: HomeStickyCTAProps) {
  const [visible, setVisible] = useState(false)
  const engagedFired = useRef(false)

  useEffect(() => {
    function onScroll() {
      // Show after one viewport scrolled — roughly past the hero.
      const shouldShow = window.scrollY > Math.max(window.innerHeight * 0.7, 480)
      setVisible(shouldShow)

      // Fire landing_engaged once when the user demonstrably engages with the
      // page by scrolling past the hero. Anything less is a bounce.
      if (shouldShow && !engagedFired.current) {
        engagedFired.current = true
        track("scroll_hero", { logged_in: isLoggedIn })
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [isLoggedIn])

  const href = isLoggedIn ? "/dashboard" : "/register"
  const label = isLoggedIn ? "Open dashboard →" : "Create your page — free →"

  return (
    <div
      aria-hidden={!visible}
      className="sm:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none"
      style={{
        transform: visible ? "translateY(0)" : "translateY(120%)",
        opacity: visible ? 1 : 0,
        // iOS-feel spring approximation via cubic-bezier — animating from
        // off-screen, lands without overshoot. 320ms is the iOS sheet duration.
        transition: "transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease",
        paddingBottom: isTwitterIAB
          ? TWITTER_IAB_CHROME_HEIGHT
          : "max(env(safe-area-inset-bottom, 12px), 12px)",
        paddingTop: 12,
        paddingLeft: 16,
        paddingRight: 16,
        background:
          "linear-gradient(180deg, rgba(3,3,3,0) 0%, rgba(3,3,3,0.85) 30%, rgba(3,3,3,0.98) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <Link
        href={href}
        onClick={() => {
          const variant = isLoggedIn ? "dashboard" : "start"
          track("click_cta", { variant, source: "sticky" })
        }}
        className="pointer-events-auto flex w-full items-center justify-center bg-[#00ff88] text-black font-mono font-bold px-5 py-4 rounded-2xl text-base shadow-[0_8px_32px_rgba(0,255,136,0.35)] active:scale-[0.97] transition-transform duration-150"
        style={{ minHeight: 56 }}
      >
        {label}
      </Link>
      {!isLoggedIn && (
        <p className="text-center text-[10px] font-mono text-[#00ff88]/80 mt-1.5">
          Free · No card · 2 min setup
        </p>
      )}
    </div>
  )
}
