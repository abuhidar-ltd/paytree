"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"

/**
 * Loads Vercel Analytics + Microsoft Clarity — EXCEPT for internal traffic.
 *
 * Internal-traffic rules:
 *  - /admin/** never loads either script.
 *  - Visiting any /admin page brands the browser with
 *    localStorage.pt_internal = "1"; from then on this device is excluded
 *    everywhere (owner devices were polluting funnel stats: 20 "visitors",
 *    130 views from /admin alone).
 *  - lib/analytics.ts track() independently no-ops on the same flag.
 *
 * Muhammad: open /admin once on each of your devices to exclude yourself.
 */
export function AnalyticsLoader() {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin") ?? false
  const [status, setStatus] = useState<"pending" | "internal" | "external">("pending")

  useEffect(() => {
    let internal = isAdminRoute
    try {
      if (isAdminRoute) window.localStorage.setItem("pt_internal", "1")
      internal = internal || window.localStorage.getItem("pt_internal") === "1"
    } catch {
      // localStorage blocked — treat as external, the /admin check still holds.
    }
    setStatus(internal ? "internal" : "external")
  }, [isAdminRoute])

  // "pending" covers the first client render: nothing loads until we know
  // this isn't an internal device. Both scripts were lazy/idle-loaded anyway,
  // so the one-tick delay costs nothing.
  if (status !== "external") return null

  return (
    <>
      <Analytics />
      <Script
        id="microsoft-clarity"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "x8ply674rn");
          `,
        }}
      />
    </>
  )
}
