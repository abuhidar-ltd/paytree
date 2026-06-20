"use client"

import { SignIn, useUser } from "@clerk/nextjs"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { trackEvent } from "@/lib/analytics"

export default function LoginPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const seenStages = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (isLoaded && user) {
      // Idempotent — guards against repeat firings if Clerk re-renders before
      // the router transition lands.
      try {
        if (!sessionStorage.getItem("paytree_login_completed")) {
          sessionStorage.setItem("paytree_login_completed", "1")
          trackEvent("login_completed")
        }
      } catch {
        trackEvent("login_completed")
      }
      router.push('/dashboard')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    trackEvent("login_page_viewed")
  }, [])

  // Mirror of /join funnel observation — see app/join page for explanation.
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    function fireOnce(stage: string) {
      if (seenStages.current.has(stage)) return
      seenStages.current.add(stage)
      trackEvent(stage)
    }
    const obs = new MutationObserver(() => {
      if (root.querySelector(".cl-rootBox")) fireOnce("signin_form_mounted")
      if (root.querySelector(".cl-formFieldInput")) fireOnce("signin_form_fields_visible")
      if (root.querySelector(".cl-formButtonPrimary")) fireOnce("signin_submit_visible")
    })
    obs.observe(root, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [])

  if (isLoaded && user) {
    return null
  }

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

        {/* Clerk Sign In Component */}
        <div ref={containerRef} className="flex justify-center">
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
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/start"
            fallbackRedirectUrl="/dashboard"
          />
        </div>

        {/* Additional Links */}
        <div className="text-center space-y-2 text-sm">
          <p className="text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/start" className="text-blue-400 hover:text-blue-300 font-semibold">
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
