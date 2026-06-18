import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/onboarding", "/checkout/", "/upgrade"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
