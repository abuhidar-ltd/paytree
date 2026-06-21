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

        {/* Trouble tip — for users in WebViews (TikTok, Instagram) where OAuth can fail */}
        <div className="flex justify-center">
          <a
            href={typeof window !== "undefined" ? window.location.href : "/login"}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-[11px] font-mono tracking-wide transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              color: "#555",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.background = "rgba(0,255,136,0.04)"
              el.style.borderColor = "rgba(0,255,136,0.2)"
              el.style.color = "#00ff88"
              el.style.boxShadow = "0 0 16px rgba(0,255,136,0.08)"
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = "rgba(255,255,255,0.02)"
              el.style.borderColor = "rgba(255,255,255,0.08)"
              el.style.color = "#555"
              el.style.boxShadow = "none"
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#333",
                animation: "troublePulse 2.4s ease-in-out infinite",
                flexShrink: 0,
              }}
              className="group-hover:!bg-[#00ff88]"
            />
            Having trouble signing up?
            <span style={{ color: "#333" }}>·</span>
            Open in browser?
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.4 }} className="group-hover:!opacity-100">
              <path d="M1.5 8.5L8.5 1.5M8.5 1.5H4M8.5 1.5V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
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
