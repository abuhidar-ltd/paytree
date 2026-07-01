"use client"

import { motion } from "framer-motion"
import { detectPlatform, openInBrowserInstructions, sourceLabel, type InAppBrowserSource } from "@/lib/iab"

/**
 * "Open in browser" affordance shown inside social-app WebViews.
 *
 * Rendered with a server-detected platform prop so the banner is in the
 * initial HTML (SSR of the parent client component) — bounce-prone TikTok
 * traffic on slow 4G never sees post-hydration UI.
 */
export function IABBanner({ platform }: { platform: InAppBrowserSource }) {
  if (!platform) return null

  const label = sourceLabel(platform)
  const instructions = openInBrowserInstructions(
    platform,
    detectPlatform(typeof navigator !== "undefined" ? navigator.userAgent : undefined),
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{
        background: "rgba(245,158,11,0.06)",
        border: "0.5px solid rgba(245,158,11,0.2)",
        borderRadius: 12,
        boxShadow: "inset 0 1px 0 rgba(245,158,11,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
      className="px-4 py-3 flex items-center gap-3"
      data-testid="iab-banner"
    >
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: 1, pointerEvents: "none",
          background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.2) 50%, transparent)",
        }}
      />
      <span className="text-[#f59e0b] text-base leading-none flex-shrink-0">↗</span>
      <p className="text-[#f59e0b]/80 text-xs leading-relaxed">
        {platform === "unknown"
          ? `Best experience in your browser: ${instructions}`
          : `You're in ${label}'s built-in browser. ${instructions} for the best experience.`}
      </p>
    </motion.div>
  )
}
