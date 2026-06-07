/**
 * Tracking helpers — shared between view tracking (server component)
 * and click tracking (API route).
 *
 * Keep these pure and dependency-free.
 */

export type DeviceType = "mobile" | "desktop" | "tablet" | "unknown"

export type ReferrerSource =
  | "direct"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "youtube"
  | "facebook"
  | "google"
  | "linkedin"
  | "other"

export const REFERRER_SOURCES: ReferrerSource[] = [
  "direct",
  "instagram",
  "tiktok",
  "twitter",
  "youtube",
  "facebook",
  "google",
  "linkedin",
  "other",
]

export function detectDevice(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return "unknown"
  const ua = userAgent
  const isTablet = /iPad|Tablet/i.test(ua)
  if (isTablet) return "tablet"
  const isMobile = /iPhone|Android|iPad|Mobile/i.test(ua)
  if (isMobile) return "mobile"
  return "desktop"
}

export function normalizeReferrer(referer: string | null | undefined): ReferrerSource {
  if (!referer) return "direct"
  const r = referer.toLowerCase()
  if (r.includes("instagram")) return "instagram"
  if (r.includes("tiktok")) return "tiktok"
  if (r.includes("twitter.com") || r.includes("x.com") || r.includes("t.co")) return "twitter"
  if (r.includes("youtube") || r.includes("youtu.be")) return "youtube"
  if (r.includes("facebook") || r.includes("fb.com")) return "facebook"
  if (r.includes("google")) return "google"
  if (r.includes("linkedin") || r.includes("lnkd.in")) return "linkedin"
  return "other"
}
