"use client"

import { useEffect, useRef, useState } from "react"
import { SignUp } from "@clerk/nextjs"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import Link from "next/link"
import { trackEvent } from "@/lib/analytics"
import { motion, AnimatePresence } from "framer-motion"

interface SignUpScreenProps {
  /**
   * Route path Clerk should use for its multi-step flow. Must match the
   * folder this component is rendered from. We use this to expose multiple
   * URL aliases (e.g. /start in addition to /join) so we can avoid TikTok's
   * URL safety blocklist on auth-keyword paths.
   */
  path: string
}

/**
 * Shared Clerk SignUp screen used by both /join and /start.
 *
 * /start is the canonical CTA target — TikTok's safety filter flags hard
 * navigations to auth keywords like /join, /signup, /register. By renaming
 * the user-facing URL to /start (a neutral word), we sidestep the safety
 * screen while keeping /join as an internal fallback.
 */
export function SignUpScreen({ path }: SignUpScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const seenStages = useRef<Set<string>>(new Set())
  const [isTikTokIAB, setIsTikTokIAB] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref) {
      document.cookie = `paytree_ref=${encodeURIComponent(ref)}; path=/; max-age=604800; SameSite=Lax`
    }

    trackEvent("signup_page_viewed", { ref: ref ?? null, path })

    const ua = navigator.userAgent
    const isTikTok = /musical_ly|MusicallyApp|TikTok|BytedanceWebview|bytedance|aweme|snssdk|xigua/i.test(ua)
    // URL param override — lets you test the banner in any browser
    const forceIAB = new URLSearchParams(window.location.search).get("iab") === "tiktok"
    if (isTikTok || forceIAB) {
      setIsTikTokIAB(true)
    }
  }, [path])

  // Funnel tracking via DOM observation — Clerk has no lifecycle hooks.
  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    function fireOnce(stage: string, props: Record<string, string | number | boolean | null> = {}) {
      if (seenStages.current.has(stage)) return
      seenStages.current.add(stage)
      trackEvent(stage, props)
    }

    const observer = new MutationObserver(() => {
      if (root.querySelector(".cl-rootBox")) fireOnce("signup_form_mounted")
      if (root.querySelector(".cl-formFieldInput")) fireOnce("signup_form_fields_visible")
      if (root.querySelector(".cl-formButtonPrimary")) fireOnce("signup_submit_visible")
      if (root.querySelector('input[name="code"]')) fireOnce("signup_verification_visible")
      const err = root.querySelector(".cl-formFieldErrorText")
      if (err && err.textContent) {
        fireOnce(`signup_error_${slugify(err.textContent)}`, {
          message: err.textContent.slice(0, 80),
        })
      }
    })

    observer.observe(root, { childList: true, subtree: true, characterData: true })

    function onFocusIn(e: FocusEvent) {
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.matches('input[type="email"]')) fireOnce("signup_email_focused")
      if (t.matches('input[type="password"]')) fireOnce("signup_password_focused")
      if (t.matches('input[name="code"]')) fireOnce("signup_verification_focused")
    }
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement | null
      if (!t) return
      const submit = t.closest(".cl-formButtonPrimary")
      if (submit) fireOnce("signup_submit_clicked")
    }
    root.addEventListener("focusin", onFocusIn)
    root.addEventListener("click", onClick)

    return () => {
      observer.disconnect()
      root.removeEventListener("focusin", onFocusIn)
      root.removeEventListener("click", onClick)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white relative">
      <PremiumBackground />

      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl sm:text-3xl font-bold kinetic-shimmer-accent">Paytree</h1>
            <h3 className="text-sm sm:text-sm font-light text-[#00ff88]">Create your free page, No Credit card required.</h3> 
          </Link>
        </div>

        <AnimatePresence>
          {isTikTokIAB && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{
                background: "rgba(245,158,11,0.06)",
                border: "0.5px solid rgba(245,158,11,0.2)",
                borderRadius: 12,
                boxShadow: "inset 0 1px 0 rgba(245,158,11,0.08)",
                position: "relative",
                overflow: "hidden",
              }}
              className="px-4 py-3 flex items-center gap-3"
            >
              <div
                style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  height: 1, pointerEvents: "none",
                  background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.2) 50%, transparent)",
                }}
              />
              <span className="text-[#f59e0b] text-base leading-none flex-shrink-0">↗</span>
              <p className="text-[#f59e0b]/80 text-xs leading-relaxed">
                If the link doesn&apos;t open, please open it in your browser.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={containerRef} className="flex justify-center">
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
            path={path}
            signInUrl="/login"
            fallbackRedirectUrl="/onboarding"
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
}
