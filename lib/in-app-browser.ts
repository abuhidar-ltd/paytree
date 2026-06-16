/**
 * In-app browser (WebView) detection.
 *
 * Conversions die here: Google blocks OAuth in WebViews, third-party cookies
 * fail, captchas don't render, and email verification can't tab-switch back.
 * Detect these contexts so we can warn the user and gate broken UI.
 *
 * Client-side only — relies on navigator.userAgent.
 */

export type InAppBrowserSource =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "snapchat"
  | "twitter"
  | "linkedin"
  | "wechat"
  | "line"
  | "kakaotalk"
  | "pinterest"
  | "unknown"
  | null

const PATTERNS: Array<{ source: Exclude<InAppBrowserSource, null | "unknown">; regex: RegExp }> = [
  { source: "tiktok",     regex: /\b(BytedanceWebview|TikTok|musical_ly|trill|Aweme)\b/i },
  { source: "instagram",  regex: /\bInstagram\b/i },
  { source: "facebook",   regex: /\b(FBAN|FBAV|FB_IAB|FBIOS|FB4A)\b/i },
  { source: "snapchat",   regex: /\bSnapchat\b/i },
  { source: "twitter",    regex: /\bTwitter\b/i },
  { source: "linkedin",   regex: /\bLinkedInApp\b/i },
  { source: "wechat",     regex: /\bMicroMessenger\b/i },
  { source: "line",       regex: /\bLine\//i },
  { source: "kakaotalk",  regex: /\bKAKAOTALK\b/i },
  { source: "pinterest",  regex: /\bPinterest\b/i },
]

/**
 * Returns the in-app browser source, or null if not in a WebView.
 * Returns "unknown" for generic WebViews we can't identify but smell suspicious.
 */
export function detectInAppBrowser(userAgent?: string): InAppBrowserSource {
  const ua = userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "")
  if (!ua) return null

  for (const { source, regex } of PATTERNS) {
    if (regex.test(ua)) return source
  }

  // Generic WebView smell test — iOS apps usually contain "Mobile/" without "Safari"
  // and Android WebViews contain "wv" in the UA. These are heuristics, not certainty.
  const isIOSWebView = /iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)
  const isAndroidWebView = /Android/i.test(ua) && /\bwv\b/i.test(ua)
  if (isIOSWebView || isAndroidWebView) return "unknown"

  return null
}

export function isInAppBrowser(userAgent?: string): boolean {
  return detectInAppBrowser(userAgent) !== null
}

/**
 * Human-readable name for analytics + UI copy.
 */
export function sourceLabel(source: InAppBrowserSource): string {
  switch (source) {
    case "tiktok": return "TikTok"
    case "instagram": return "Instagram"
    case "facebook": return "Facebook"
    case "snapchat": return "Snapchat"
    case "twitter": return "X (Twitter)"
    case "linkedin": return "LinkedIn"
    case "wechat": return "WeChat"
    case "line": return "Line"
    case "kakaotalk": return "KakaoTalk"
    case "pinterest": return "Pinterest"
    case "unknown": return "in-app browser"
    default: return ""
  }
}

/**
 * Per-platform instructions for opening in a real browser.
 */
export function openInBrowserInstructions(source: InAppBrowserSource): string {
  switch (source) {
    case "tiktok":
      return "Tap ⋯ at the top right, then 'Open in browser'"
    case "instagram":
      return "Tap ⋯ at the top right, then 'Open in external browser'"
    case "facebook":
      return "Tap ⋯ at the top right, then 'Open in browser'"
    case "snapchat":
      return "Tap ⋯ at the top right, then 'Open in browser'"
    case "twitter":
      return "Tap the share icon, then 'Open in Safari/Chrome'"
    default:
      return "Tap the menu button, then 'Open in browser'"
  }
}
