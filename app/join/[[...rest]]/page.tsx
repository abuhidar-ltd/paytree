import { headers } from "next/headers"
import { SignUpScreen } from "@/components/sign-up-screen"

// Backward-compat alias for /start. New marketing CTAs point at /start to
// dodge TikTok's auth-keyword URL safety screen. SSR-detect TikTok IAB so
// any legacy ad that still lands here surfaces the "open in browser" banner.
const TIKTOK_UA = /musical_ly|MusicallyApp|TikTok|BytedanceWebview|bytedance|aweme|snssdk|xigua/i

export default async function JoinPage() {
  const ua = (await headers()).get("user-agent") ?? ""
  const isTikTokIAB = TIKTOK_UA.test(ua)
  return <SignUpScreen initialIsTikTokIAB={isTikTokIAB} />
}
