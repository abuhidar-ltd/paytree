import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/onboarding",
          "/checkout/",
          "/upgrade",
          // Partner stats pages are token-gated by an unguessable URL and must
          // never be crawlable — see app/partners/[statsToken]/page.tsx.
          "/partners/",
          // Admin console — the layout also 404s non-admins, but keep crawlers
          // from wasting fetches on the login-gated pages.
          "/admin",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
