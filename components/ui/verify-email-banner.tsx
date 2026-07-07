"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

/**
 * Verify-email nudge — informational only, gates nothing.
 *
 * Also owns the verify-callback landing: Better Auth redirects the email
 * link to /dashboard?verified=1 on success and appends &error=<CODE> on a
 * bad token (lib/auth.ts rewrites the callbackURL). Success → toast; error
 * → toast + the banner force-shows (clearing any dismissal) so "Resend
 * email" is the recovery path right there.
 *
 * Dismissal is localStorage keyed by user id with a 24h TTL — one tap
 * silences it for the day, but it returns on the next real session while
 * the account stays unverified.
 */

const DISMISS_TTL_MS = 24 * 60 * 60 * 1000

const spring = { type: "spring" as const, stiffness: 300, damping: 28 }

function dismissKey(userId: string): string {
  return `paytree_verify_email_dismissed_${userId}`
}

export function VerifyEmailBanner({
  userId,
  email,
  verified,
}: {
  userId: string
  email: string
  verified: boolean
}) {
  // Start hidden until the client-side localStorage/URL checks run — avoids
  // a flash-then-dismiss on users who already dismissed today.
  const [visible, setVisible] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    const fromVerifyLink = params.get("verified") === "1" || !!error

    if (fromVerifyLink) {
      if (error) {
        toast.error(
          error === "TOKEN_EXPIRED"
            ? "That verification link expired."
            : "That verification link is invalid.",
          { description: "Tap “Resend email” to get a fresh one." }
        )
        // A failed link means they WANT to verify — bring the banner back
        // even if it was dismissed.
        try {
          window.localStorage.removeItem(dismissKey(userId))
        } catch {}
      } else if (verified) {
        toast.success("Email verified! 🎉")
      }
      window.history.replaceState(null, "", "/dashboard")
    }

    if (verified) return

    // Deferred to a callback so the effect body itself never sets state
    // synchronously (react-hooks/set-state-in-effect) — and the banner's
    // entrance animation starts on a clean frame.
    const raf = requestAnimationFrame(() => {
      try {
        const ts = Number(window.localStorage.getItem(dismissKey(userId)) || 0)
        if (!error && ts && Date.now() - ts < DISMISS_TTL_MS) return
      } catch {
        // localStorage blocked — show the banner.
      }
      setVisible(true)
    })
    return () => cancelAnimationFrame(raf)
  }, [userId, verified])

  const dismiss = () => {
    try {
      window.localStorage.setItem(dismissKey(userId), String(Date.now()))
    } catch {}
    setVisible(false)
  }

  const resend = async () => {
    if (sending || sent) return
    setSending(true)
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/dashboard?verified=1",
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
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={spring}
          className="mb-4 px-4 py-2.5 flex items-center justify-between gap-3 rounded-xl"
          style={{
            background: "linear-gradient(to right, rgba(245,158,11,0.08), transparent)",
            border: "0.5px solid rgba(245,158,11,0.18)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <span className="text-xs text-[#ffe3b3] font-mono flex-1">
            📧 Verify your email<span className="hidden sm:inline"> — check your inbox.</span>
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={resend}
              disabled={sending || sent}
              className="text-[11px] text-black bg-[#f59e0b] font-mono font-semibold rounded-full px-3 py-1 hover:opacity-90 disabled:opacity-60 active:scale-[0.97] transition-all"
            >
              {sent ? "Sent ✓" : sending ? "Sending…" : "Resend email"}
            </button>
            <button
              onClick={dismiss}
              className="text-[11px] font-mono text-[#b0b0b0] hover:text-[#ddd] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
