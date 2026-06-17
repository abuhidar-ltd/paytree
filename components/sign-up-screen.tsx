"use client"

import { useEffect, useRef, useState } from "react"
import { SignUp } from "@clerk/nextjs"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import Link from "next/link"
import { detectInAppBrowser, sourceLabel } from "@/lib/in-app-browser"
import { trackEvent } from "@/lib/analytics"

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
  const [isWebView, setIsWebView] = useState(false)
  const [webViewSource, setWebViewSource] = useState<string>("")
  const containerRef = useRef<HTMLDivElement>(null)
  const seenStages = useRef<Set<string>>(new Set())

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref) {
      document.cookie = `paytree_ref=${encodeURIComponent(ref)}; path=/; max-age=604800; SameSite=Lax`
    }

    const source = detectInAppBrowser()
    if (source) {
      setIsWebView(true)
      setWebViewSource(sourceLabel(source))
    }

    trackEvent("signup_page_view", {
      in_app_browser: source ?? "no",
      ref: ref ?? null,
      path,
    })
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

      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl sm:text-3xl font-bold kinetic-shimmer-accent">Paytree</h1>
          </Link>
        </div>

        {isWebView && (
          <div
            className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.04] p-3 text-center"
            role="note"
          >
            <p className="text-xs text-[#00ff88] font-mono font-semibold">
              Signing up via {webViewSource}
            </p>
            <p className="text-[11px] text-[#888] mt-1 leading-snug">
              Use email below — Google/Apple sign-in doesn&apos;t work in in-app browsers.
            </p>
          </div>
        )}

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
                ...hiddenSocial,
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
