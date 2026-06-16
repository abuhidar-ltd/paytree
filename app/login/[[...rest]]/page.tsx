"use client"

import { SignIn, useUser } from "@clerk/nextjs"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { detectInAppBrowser, sourceLabel } from "@/lib/in-app-browser"
import { trackEvent } from "@/lib/analytics"

export default function LoginPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isWebView, setIsWebView] = useState(false)
  const [webViewSource, setWebViewSource] = useState<string>("")

  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    const source = detectInAppBrowser()
    if (source) {
      setIsWebView(true)
      setWebViewSource(sourceLabel(source))
    }
    trackEvent("login_page_view", { in_app_browser: source ?? "no" })
  }, [])

  if (isLoaded && user) {
    return null
  }

  const hiddenSocial = isWebView
    ? {
        socialButtonsRoot: "hidden",
        socialButtons: "hidden",
        socialButtonsBlockButton: "hidden",
        socialButtonsBlockButtonText: "hidden",
        socialButtonsIconButton: "hidden",
        dividerRow: "hidden",
        dividerLine: "hidden",
        dividerText: "hidden",
      }
    : {}

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white relative">
      <PremiumBackground />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl sm:text-4xl font-bold kinetic-shimmer-accent">
              Paytree
            </h1>
          </Link>
          <p className="text-sm sm:text-base text-gray-400 mt-2">Sign in to your account</p>
        </div>

        {isWebView && (
          <div
            className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.04] p-3 text-center"
            role="note"
          >
            <p className="text-xs text-[#00ff88] font-mono font-semibold">
              Signing in via {webViewSource}
            </p>
            <p className="text-[11px] text-[#888] mt-1 leading-snug">
              Use email below — Google/Apple sign-in doesn&apos;t work in in-app browsers.
            </p>
          </div>
        )}

        {/* Clerk Sign In Component */}
        <div className="flex justify-center">
          <SignIn
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
                ...hiddenSocial,
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/register"
            fallbackRedirectUrl="/dashboard"
          />
        </div>

        {/* Additional Links */}
        <div className="text-center space-y-2 text-sm">
          <p className="text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign up for free
            </Link>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
