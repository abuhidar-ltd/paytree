import { headers } from "next/headers"
import { SignInScreen } from "@/components/sign-in-screen"

// Server wrapper so IAB detection (lib/iab.ts) runs against the request
// user-agent during SSR — the "open in browser" banner and the Google-button
// gating are correct on first paint, not after hydration.
//
// Explicit dynamic export mirrors /register: headers() below already forces
// dynamic rendering, but this documents the intent so a future refactor can't
// let Next.js silently static-optimize the page.
export const dynamic = "force-dynamic"
export default async function LoginPage() {
  const ua = (await headers()).get("user-agent") ?? ""
  return <SignInScreen userAgent={ua} />
}
