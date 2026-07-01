import { headers } from "next/headers"
import { SignUpScreen } from "@/components/sign-up-screen"

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
// We detect TikTok's in-app WebView server-side so the "open in browser"
// banner renders in the initial HTML — a client useEffect alone is too late
// for bounce-prone TikTok traffic on slow 4G.
const TIKTOK_UA = /musical_ly|MusicallyApp|TikTok|BytedanceWebview|bytedance|aweme|snssdk|xigua/i

export default async function RegisterPage() {
  const ua = (await headers()).get("user-agent") ?? ""
  const isTikTokIAB = TIKTOK_UA.test(ua)
  return <SignUpScreen initialIsTikTokIAB={isTikTokIAB} />
}
