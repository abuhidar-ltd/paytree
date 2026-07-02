import Link from "next/link"
import { LandingV3Client } from "./landing-v3-client"

export const metadata = {
  title: "Paytree — Your entire business in one link (v3 preview)",
  description: "TikTok-tuned mobile landing preview. Original at /.",
  robots: { index: false, follow: false },
}

// TikTok Turbo variant. Two constraints drove every choice:
//
// 1. TikTok's WebView opens the page on 3-4G with an unreliable "below the
//    fold" — dynamic imports frequently never resolve because the WebView is
//    paused mid-load when the user swipes back. So all sections render
//    server-side, no dynamic() splits, no Suspense boundaries.
//
// 2. The sticky CTA on / today only appears AFTER scroll_hero fires. Inside
//    a slow WebView the user may swipe back before that threshold — leaving
//    them with no CTA in view. Here the CTA is present from first paint.
export default function LandingV3Page() {
  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden pb-28">
      {/* Prefetch signup HTML so the tap→post latency inside a 3G WebView
          drops from ~2s to ~200ms. next/link would prefetch on hover, but
          mobile has no hover — this warms the cache immediately. */}
      <link rel="prefetch" href="/register" as="document" />

      <header
        className="fixed top-0 left-0 right-0 z-50 pt-safe"
        style={{
          background: "rgba(3,3,3,0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="mx-auto px-4 h-12 flex items-center justify-between max-w-md">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
            <span className="text-[#f0f0f0] font-semibold text-[14px]">Paytree</span>
            <span className="text-[9px] font-mono text-[#00ff88] border border-[rgba(0,255,136,0.35)] rounded px-1.5 py-0.5">
              v3 turbo
            </span>
          </Link>
          <Link
            href="/login"
            className="text-[#888] text-[12px] font-mono min-h-11 flex items-center px-2"
          >
            Sign in
          </Link>
        </div>
      </header>

      <LandingV3Client />
    </div>
  )
}
