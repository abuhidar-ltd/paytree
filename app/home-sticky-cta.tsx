"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { trackEvent } from "@/lib/analytics"

interface HomeStickyCTAProps {
  isLoggedIn: boolean
}

/**
 * Mobile-only sticky bottom CTA. Appears after the user scrolls past the
 * hero so it does not compete with the hero CTA on first paint. Funnel
 * insurance for bounce-prone landing traffic (TikTok/IG visitors who don't
 * scroll back up after exploring).
 */
export function HomeStickyCTA({ isLoggedIn }: HomeStickyCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      // Show after one viewport scrolled — roughly past the hero.
      setVisible(window.scrollY > Math.max(window.innerHeight * 0.7, 480))
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const href = isLoggedIn ? "/dashboard" : "/start"
  const label = isLoggedIn ? "Open dashboard →" : "Create your page — free →"

  return (
    <div
      aria-hidden={!visible}
      className="sm:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none"
      style={{
        transform: visible ? "translateY(0)" : "translateY(120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 280ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
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
        onClick={() =>
          trackEvent("sticky_cta_click", { variant: isLoggedIn ? "dashboard" : "start" })
        }
        className="pointer-events-auto flex w-full items-center justify-center bg-[#00ff88] text-black font-mono font-bold px-5 py-4 rounded-2xl text-base shadow-[0_8px_32px_rgba(0,255,136,0.35)] active:scale-[0.98] transition-transform"
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
