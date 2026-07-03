import { headers } from "next/headers"
import { SignUpScreen } from "@/components/sign-up-screen"

// Belt-and-suspenders: headers() below already forces dynamic rendering, but
// making it explicit prevents a future refactor from accidentally letting
// Next.js static-optimize the page. If that happened, every visitor would
// receive the same cached HTML — including WebView users who'd see the
// Google button (broken in IAB) instead of the IAB banner.
export const dynamic = "force-dynamic"

// Canonical signup entry. /start, /join, /signup and /sign-up all
// 307-redirect here (next.config.ts).
//
// NOTE: TikTok's in-app browser has historically flagged hard navigations to
// auth-keyword paths (/register, /signup, /join) with a safety interstitial.
// All internal CTAs use next/link soft navigation, which TikTok cannot
// intercept — but externally shared links should prefer the bare domain or
// /start (kept as a redirect). If TikTok signup traffic drops after this
// rename, that interstitial is the first thing to check.
//
// The raw user-agent header is passed down so IAB detection (lib/iab.ts)
// runs during SSR and the "open in browser" banner + Google-button gating
// are correct on first paint — a client useEffect alone is too late for
// bounce-prone TikTok traffic on slow 4G.

export default async function RegisterPage() {
  const ua = (await headers()).get("user-agent") ?? ""
  return <SignUpScreen userAgent={ua} />
}
