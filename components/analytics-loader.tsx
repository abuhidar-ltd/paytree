"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"
import { useStorageFlag } from "@/lib/use-storage-flag"

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
  // serverFallback=true: SSR assumes internal, so nothing loads until the
  // client confirms this device isn't branded. Both scripts were lazy-loaded
  // anyway, so the deferral costs nothing.
  const [branded, setBranded] = useStorageFlag("pt_internal", true)

  useEffect(() => {
    if (isAdminRoute && !branded) setBranded(true)
  }, [isAdminRoute, branded, setBranded])

  if (isAdminRoute || branded) return null

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
