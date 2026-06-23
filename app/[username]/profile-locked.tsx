import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PremiumBackground } from "@/components/backgrounds/premium-background"

interface ProfileLockedProps {
  username: string
}

export function ProfileLocked({ username }: ProfileLockedProps) {
  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <PremiumBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Lock Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-[rgba(255,255,255,0.02)] backdrop-blur-xl flex items-center justify-center border border-[rgba(255,255,255,0.1)]">
            <svg className="w-12 h-12 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold mb-4 text-white">
            Profile Not Published
          </h1>
          <p className="text-[#888888] text-lg mb-8 leading-relaxed">
            <span className="text-[#00ff88] font-semibold">@{username}</span> hasn&apos;t published their terminal yet.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]" />
            <span className="text-[#555555] text-sm">or</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]" />
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <p className="text-[#888888]">
              Want your own premium bio link?
            </p>
            <Link href="/start">
              <Button variant="accent-solid" size="lg" className="text-lg">
                Create Your Terminal
              </Button>
            </Link>
            <p className="text-sm text-[#555555]">
              Start your 7-day free trial today
            </p>
          </div>

          {/* Branding */}
          <div className="mt-16">
            <Link href="/" className="inline-flex items-center gap-2 text-[#888888] hover:text-white transition-colors">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
              <span className="font-bold">Paytree</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
