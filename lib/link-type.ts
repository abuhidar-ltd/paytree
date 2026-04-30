/**
 * Smart Link Type Detection
 *
 * Detects the platform/type of a link from its URL.
 * Used both when creating links and when rendering smart cards on the public profile.
 */

export type LinkType =
  | "generic"
  | "instagram"
  | "tiktok"
  | "twitch"
  | "youtube"
  | "twitter"
  | "spotify"
  | "product"

const PATTERNS: [RegExp, LinkType][] = [
  [/instagram\.com/i, "instagram"],
  [/tiktok\.com/i, "tiktok"],
  [/twitch\.tv/i, "twitch"],
  [/(youtube\.com|youtu\.be|youtube-nocookie\.com)/i, "youtube"],
  [/(twitter\.com|x\.com)/i, "twitter"],
  [/(open\.spotify\.com|spotify\.link)/i, "spotify"],
]

/**
 * Detect the link type from a URL.
 */
export function detectLinkType(url: string): LinkType {
  if (!url) return "generic"

  for (const [pattern, type] of PATTERNS) {
    if (pattern.test(url)) return type
  }

  return "generic"
}

/**
 * Returns a human-readable label for a link type (used in UI).
 */
export function linkTypeLabel(type: LinkType): string {
  const labels: Record<LinkType, string> = {
    generic: "Link",
    instagram: "Instagram",
    tiktok: "TikTok",
    twitch: "Twitch",
    youtube: "YouTube",
    twitter: "X / Twitter",
    spotify: "Spotify",
    product: "Product",
  }
  return labels[type] || "Link"
}
