import Link from "next/link"
import { LandingV4Client } from "./landing-v4-client"

export const metadata = {
  title: "Paytree — See what your page could look like (v4 preview)",
  description: "Gallery-first mobile landing preview.",
  robots: { index: false, follow: false },
}

export default function LandingV4Page() {
  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden pb-28">
      <link rel="prefetch" href="/register-v4" as="document" />
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
              v4 gallery
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
      <LandingV4Client />
    </div>
  )
}
