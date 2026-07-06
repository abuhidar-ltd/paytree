"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app/error] caught:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/[0.08] border border-red-500/[0.25] mb-8">
          <span className="text-2xl" aria-hidden>⚠</span>
        </div>

        <div className="text-red-400 font-mono text-xs uppercase tracking-[0.3em] mb-3">
          Something broke
        </div>

        <h1 className="text-3xl font-semibold text-[#f0f0f0] mb-3">
          A small glitch on our end.
        </h1>

        <p className="text-[#c9c9d1] text-sm mb-8 leading-relaxed">
          We&apos;ve been notified. Try again — and if it keeps happening, head back home.
        </p>

        {error.digest && (
          <p className="text-[10px] font-mono text-[#b8b8b8] mb-6">
            ref · {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center bg-[#00ff88] text-black font-mono font-semibold px-5 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] font-mono font-semibold px-5 py-3 rounded-xl text-sm hover:border-white/20 transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}
