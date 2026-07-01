import { headers } from "next/headers"
import { SignInScreen } from "@/components/sign-in-screen"

// Server wrapper so IAB detection (lib/iab.ts) runs against the request
// user-agent during SSR — the "open in browser" banner and the Google-button
// gating are correct on first paint, not after hydration.
export default async function LoginPage() {
  const ua = (await headers()).get("user-agent") ?? ""
  return <SignInScreen userAgent={ua} />
}
