"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { track } from "@/lib/analytics"

/**
 * Verification safety net — since the 2026-07-07 hard gate, an unverified
 * account should never reach the dashboard at all (proxy.ts redirects to
 * /verify-pending first). If this banner is visible, the middleware gate
 * failed open (transient DB error) — so it is static and NOT dismissible:
 * the resend button is the user's only path forward.
 *
 * Also owns the legacy verify-callback landing: verification emails sent
 * BEFORE the gate shipped carry callbackURL=/dashboard?verified=1 (with
 * &error=<CODE> on bad tokens). Success → toast; error → toast pointing at
 * the resend button.
 */

export function VerifyEmailBanner({
  email,
  verified,
}: {
  email: string
  verified: boolean
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    const fromVerifyLink = params.get("verified") === "1" || !!error
    if (!fromVerifyLink) return

    if (error) {
      toast.error(
        error === "TOKEN_EXPIRED"
          ? "That verification link expired."
          : "That verification link is invalid.",
        { description: "Tap “Resend email” to get a fresh one." }
      )
    } else if (verified) {
      toast.success("Email verified! 🎉")
    }
    window.history.replaceState(null, "", "/dashboard")
  }, [verified])

  const resend = async () => {
    if (sending || sent) return
    setSending(true)
    track("click_resend_verification", { source: "dashboard_banner" })
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/verify-pending",
    })
    setSending(false)
    if (error) {
      toast.error(error.message || "Couldn't send the email — try again in a minute.")
    } else {
      setSent(true)
      toast.success(`Verification email sent to ${email}`)
    }
  }

  if (verified) return null

  return (
    <div
      className="mb-4 px-4 py-2.5 flex items-center justify-between gap-3 rounded-xl"
      style={{
        background: "linear-gradient(to right, rgba(245,158,11,0.08), transparent)",
        border: "0.5px solid rgba(245,158,11,0.18)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <span className="text-xs text-[#ffe3b3] font-mono flex-1">
        📧 Verify your email to keep access
        <span className="hidden sm:inline"> — check your inbox.</span>
      </span>
      <button
        onClick={resend}
        disabled={sending || sent}
        className="flex-shrink-0 text-[11px] text-black bg-[#f59e0b] font-mono font-semibold rounded-full px-3 py-1 hover:opacity-90 disabled:opacity-60 active:scale-[0.97] transition-all"
      >
        {sent ? "Sent ✓" : sending ? "Sending…" : "Resend email"}
      </button>
    </div>
  )
}
