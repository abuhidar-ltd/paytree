import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  // Public published profiles — capped at 5000 to stay under Google's
  // 50k URL / 50MB sitemap limit, sorted by recently updated first.
  let profiles: { username: string; updatedAt: Date }[] = []
  try {
    profiles = await prisma.user.findMany({
      where: { pageStatus: "published" },
      select: { username: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    })
  } catch {
    // DB unavailable at build — fall back to static only.
  }

  const profileRoutes: MetadataRoute.Sitemap = profiles.map((p) => ({
    url: `${SITE_URL}/${p.username}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticRoutes, ...profileRoutes]
}
