import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-6 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(0,255,136,0.06) 0%, transparent 65%)",
        }}
      />
      <div className="relative z-10 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00ff88]/[0.06] border border-[#00ff88]/[0.18] mb-8">
          <div
            className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)]"
            style={{ boxShadow: "0 0 20px rgba(0,255,136,0.3)" }}
          />
        </div>

        <div className="text-[#00ff88] font-mono text-xs uppercase tracking-[0.3em] mb-3">
          404 · Lost in the link
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold text-[#f0f0f0] mb-3 leading-tight">
          This page isn&apos;t here.
        </h1>

        <p className="text-[#888] text-sm mb-8 leading-relaxed">
          Maybe the creator hasn&apos;t claimed this username yet — or the link you followed is broken.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-[#00ff88] text-black font-mono font-semibold px-5 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Back home →
          </Link>
          <Link
            href="/start"
            className="inline-flex items-center justify-center bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] font-mono font-semibold px-5 py-3 rounded-xl text-sm hover:border-white/20 transition-colors"
          >
            Claim a username
          </Link>
        </div>
      </div>
    </div>
  )
}
