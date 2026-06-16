"use client"

import { useEffect } from "react"
import { SignUp } from "@clerk/nextjs"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import Link from "next/link"

export default function RegisterPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref) {
      document.cookie = `paytree_ref=${encodeURIComponent(ref)}; path=/; max-age=604800; SameSite=Lax`
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white relative">
      <PremiumBackground />

      <div className="relative z-10 w-full max-w-md space-y-4">
        {/* Logo only — keep the page light so the form is the focus */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl sm:text-3xl font-bold kinetic-shimmer-accent">Paytree</h1>
          </Link>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              variables: {
                colorBackground: "#0a0a0a",
                colorText: "#f0f0f0",
                colorTextSecondary: "#888",
                colorInputBackground: "rgba(255,255,255,0.04)",
                colorInputText: "#f0f0f0",
                colorPrimary: "#00ff88",
                colorTextOnPrimaryBackground: "#030303",
                colorNeutral: "#ffffff",
                borderRadius: "12px",
                fontFamily: "'Inter', system-ui, sans-serif",
              },
              elements: {
                rootBox: "w-full",
                card: "bg-[#0a0a0a] border border-white/[0.08] shadow-2xl",
                headerTitle: "text-white",
                headerSubtitle: "text-[#888]",
                socialButtonsBlockButton:
                  "bg-white/[0.03] border border-white/[0.08] hover:border-white/20 text-[#e0e0e0]",
                socialButtonsBlockButtonText: "text-[#e0e0e0]",
                dividerLine: "bg-white/[0.06]",
                dividerText: "text-[#555]",
                formFieldLabel: "text-[#888] font-mono uppercase tracking-wider text-[10px]",
                formFieldInput:
                  "bg-white/[0.03] border border-white/[0.08] text-[#f0f0f0] placeholder:text-[#444] focus:border-[#00ff88]/30",
                formButtonPrimary:
                  "bg-[#00ff88] text-black font-mono font-semibold hover:opacity-90 normal-case",
                footerActionLink: "text-[#00ff88] hover:text-[#00ff88]/80",
                identityPreviewText: "text-[#e0e0e0]",
                identityPreviewEditButton: "text-[#00ff88]",
                footer: "hidden",
                // Hide name + username — collected at onboarding instead
                formFieldRow__name: "hidden",
                formFieldRow__firstName: "hidden",
                formFieldRow__lastName: "hidden",
                formFieldRow__username: "hidden",
                formField__firstName: "hidden",
                formField__lastName: "hidden",
                formField__username: "hidden",
              },
            }}
            routing="path"
            path="/register"
            signInUrl="/login"
            fallbackRedirectUrl="/onboarding"
            forceRedirectUrl={undefined}
          />
        </div>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#00ff88] hover:text-[#00ff88]/80 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
