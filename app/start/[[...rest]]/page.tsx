import { headers } from "next/headers"
import { SignUpScreen } from "@/components/sign-up-screen"

// Canonical signup entry. /start is used everywhere because TikTok's URL
// safety filter blocks hard navigations to common auth keywords (/join,
// /signup, /register). /start is a neutral word and isn't flagged.
//
// We detect TikTok's in-app WebView server-side so the "open in browser"
// banner renders in the initial HTML — previously this only fired in a
// client useEffect, which meant the banner never reached users on slow
// 4G (they swiped back before mount).
const TIKTOK_UA = /musical_ly|MusicallyApp|TikTok|BytedanceWebview|bytedance|aweme|snssdk|xigua/i

export default async function StartPage() {
  const ua = (await headers()).get("user-agent") ?? ""
  const isTikTokIAB = TIKTOK_UA.test(ua)
  return <SignUpScreen initialIsTikTokIAB={isTikTokIAB} />
}
