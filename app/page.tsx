import Link from "next/link"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { HomeClient } from "./home-client"
import { HomePageView } from "./home-page-view"
import { TrackedLink } from "@/components/tracked-link"

/**
 * Homepage. Mobile-first, conversion-tuned layout (formerly /landing-v2).
 * Sections + copy live in home-client.tsx; this file owns the SSR shell,
 * auth-aware header, and the once-per-load view_home ping.
 */
export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  const isLoggedIn = !!session

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden pb-32">
      <HomePageView />

      <header
        className="fixed top-0 left-0 right-0 z-50 pt-safe"
        style={{
          background: "rgba(3,3,3,0.55)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 24px rgba(0,0,0,0.4)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)",
          }}
        />
        <div className="mx-auto px-4 h-14 flex items-center justify-between max-w-md">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_20px_rgba(0,255,136,0.3)]" />
            <span className="text-[#f0f0f0] font-semibold text-[15px]">
              Paytree
            </span>
          </Link>
          {isLoggedIn ? (
            <TrackedLink
              event="click_cta"
              eventProps={{ variant: "dashboard" }}
              source="header"
              href="/dashboard"
              className="bg-[#00ff88] text-black font-mono font-semibold px-4 rounded-xl text-sm inline-flex items-center min-h-11 active:scale-[0.97] transition-transform"
            >
              Dashboard
            </TrackedLink>
          ) : (
            <TrackedLink
              event="click_signin"
              source="header"
              href="/login"
              className="text-[#aaa] text-sm font-mono min-h-11 flex items-center px-2"
            >
              Sign in
            </TrackedLink>
          )}
        </div>
      </header>

      <HomeClient />
    </div>
  )
}
