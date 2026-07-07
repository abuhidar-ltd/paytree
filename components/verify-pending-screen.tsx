"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Mail, ArrowRight, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { track } from "@/lib/analytics"
import { hardNavigate } from "@/lib/post-auth-nav"

/**
 * Verification waiting room. The user just signed up (or logged in
 * unverified) — nothing works until they tap the link we emailed them.
 *
 * Three ways out, all funneled through advance():
 *   1. Polling — every 4s we ask /api/auth/check-verified. This is the path
 *      that matters in social WebViews: the link opens in the system browser,
 *      the DB flag flips there, and THIS page (still open inside TikTok/IG)
 *      notices and moves on. A visibilitychange listener fires an immediate
 *      check for the "just came back from Gmail" moment.
 *   2. Landing already verified — the email link's callbackURL points here,
 *      so same-browser clicks arrive with initiallyVerified=true.
 *   3. The manual "I've verified" button — fallback if polling misses.
 *
 * complete_verification fires once per account per device (localStorage
 * dedupe) — it means "the gate let this user through", as opposed to
 * verify_email which fires server-side on the token click itself.
 */

const POLL_MS = 4_000
const RESEND_COOLDOWN_MS = 30_000

const springs = {
  standard: { type: "spring" as const, stiffness: 300, damping: 28 },
  gentle: { type: "spring" as const, stiffness: 180, damping: 24 },
}

interface Props {
  email: string
  initiallyVerified: boolean
  /** Where the gate lets them out: /onboarding (new) or /dashboard (onboarded). */
  target: string
}

export function VerifyPendingScreen({ email, initiallyVerified, target }: Props) {
  const [verified, setVerified] = useState(initiallyVerified)
  const [checking, setChecking] = useState(false)
  const [notYet, setNotYet] = useState(false)
  const [resending, setResending] = useState(false)
  const [resentAgo, setResentAgo] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const advancedRef = useRef(false)

  const advance = useCallback(() => {
    if (advancedRef.current) return
    advancedRef.current = true
    setVerified(true)
    // Once per account per device — a verified user revisiting this URL (or
    // the second tab in a desktop flow) must not re-fire the funnel event.
    const dedupeKey = `pt_verify_completed_${email}`
    let alreadyFired = false
    try {
      alreadyFired = window.localStorage.getItem(dedupeKey) === "1"
      window.localStorage.setItem(dedupeKey, "1")
    } catch {}
    // urgent: hardNavigate tears the document down — a deferred track() would
    // be silently dropped, same failure mode as the July funnel events.
    if (!alreadyFired) track("complete_verification", {}, { urgent: true })
    toast.success("Email verified! 🎉")
    // Brief beat so the ✓ state and toast register before the hard nav.
    setTimeout(() => hardNavigate(target), 800)
  }, [email, target])

  const check = useCallback(
    async (manual = false) => {
      if (advancedRef.current) return
      if (manual) {
        setChecking(true)
        setNotYet(false)
      }
      try {
        const res = await fetch("/api/auth/check-verified", { cache: "no-store" })
        if (res.status === 401) {
          // Session died while waiting (30-day expiry, or signed out
          // elsewhere) — polling can never succeed now.
          hardNavigate("/login")
          return
        }
        if (!res.ok) return // 429/5xx — silently try again next tick
        const data = (await res.json()) as { verified?: boolean }
        if (data.verified) advance()
        else if (manual) setNotYet(true)
      } catch {
        // Network blip inside a WebView — next tick retries.
      } finally {
        if (manual) setChecking(false)
      }
    },
    [advance]
  )

  // Mount: funnel event, expired/invalid-link recovery, and the instant path
  // for same-browser link clicks that land here already verified.
  useEffect(() => {
    track("view_verify_pending", { already_verified: initiallyVerified })

    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (error) {
      const msg =
        error === "TOKEN_EXPIRED"
          ? "That verification link expired."
          : "That verification link is invalid."
      setLinkError(`${msg} Tap “Resend email” below for a fresh one.`)
      toast.error(msg)
      window.history.replaceState(null, "", "/verify-pending")
    }

    if (initiallyVerified) advance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll + the return-from-email-app moment.
  useEffect(() => {
    if (initiallyVerified) return
    const interval = setInterval(() => void check(), POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") void check()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [initiallyVerified, check])

  const resend = async () => {
    if (resending || resentAgo) return
    setResending(true)
    track("click_resend_verification", { source: "verify_pending" })
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/verify-pending",
    })
    setResending(false)
    if (error) {
      toast.error(error.message || "Couldn't send the email — try again in a minute.")
    } else {
      setLinkError(null)
      setResentAgo(true)
      toast.success(`Verification email sent to ${email}`)
      // Cooldown, not a permanent disable — inboxes genuinely eat emails and
      // the server rate-limits at 5/min anyway.
      setTimeout(() => setResentAgo(false), RESEND_COOLDOWN_MS)
    }
  }

  const signOut = async () => {
    try {
      await authClient.signOut()
    } catch {}
    hardNavigate("/register")
  }

  return (
    <div
      className="min-h-screen min-h-dvh text-white relative overflow-hidden flex items-center justify-center px-5"
      style={{ background: "#030303" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 15%, rgba(0,255,136,0.12) 0%, transparent 55%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.standard}
        className="relative z-10 w-full max-w-md rounded-2xl p-7 sm:p-9"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Reflection line */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 1, pointerEvents: "none",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
          }}
        />

        {/* Mail icon — breathing glow while waiting, solid green once done */}
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: verified ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.04)",
            border: `0.5px solid ${verified ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.1)"}`,
          }}
          animate={
            verified
              ? { boxShadow: "0 0 40px rgba(0,255,136,0.4)" }
              : {
                  boxShadow: [
                    "0 0 20px rgba(0,255,136,0.12)",
                    "0 0 36px rgba(0,255,136,0.28)",
                    "0 0 20px rgba(0,255,136,0.12)",
                  ],
                }
          }
          transition={verified ? springs.gentle : { duration: 2.5, repeat: Infinity }}
        >
          <Mail size={24} className={verified ? "text-[#00ff88]" : "text-[#d8d8d8]"} />
        </motion.div>

        <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-3">
          {verified ? "verified" : "one more step"}
        </div>
        <h1 className="text-[28px] sm:text-[32px] font-bold text-white leading-[1.08]">
          {verified ? "You're in." : "Check your email."}
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[#c9c9d1]">
          {verified ? (
            "Taking you to your page…"
          ) : (
            <>
              We sent a verification link to{" "}
              <span className="text-white font-semibold break-all">{email}</span>. Click it to
              continue — this page moves on by itself.
            </>
          )}
        </p>

        {/* Live polling indicator */}
        {!verified && (
          <div className="mt-5 flex items-center gap-2">
            <motion.span
              className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ff88]"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#b0b0b0]">
              watching for your click
            </span>
          </div>
        )}

        {linkError && !verified && (
          <div
            className="mt-5 rounded-xl px-4 py-3 text-[12px] leading-relaxed"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "0.5px solid rgba(245,158,11,0.3)",
              color: "#ffe3b3",
            }}
          >
            {linkError}
          </div>
        )}

        {notYet && !verified && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.standard}
            className="mt-5 rounded-xl px-4 py-3 text-[12px] text-center"
            style={{
              background: "rgba(255,85,85,0.08)",
              border: "0.5px solid rgba(255,85,85,0.25)",
              color: "#ff5555",
            }}
          >
            Not verified yet — tap the link in your email first.
          </motion.div>
        )}

        {!verified && (
          <>
            <button
              data-testid="verify-continue"
              onClick={() => void check(true)}
              disabled={checking}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#00ff88] text-black font-mono font-bold px-6 rounded-2xl text-[15px] active:scale-[0.98] disabled:opacity-70"
              style={{ minHeight: 54, boxShadow: "0 0 40px rgba(0,255,136,0.3)" }}
            >
              {checking ? (
                <>
                  <motion.span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black/70 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  Checking…
                </>
              ) : (
                <>
                  I&apos;ve verified, continue
                  <ArrowRight size={16} strokeWidth={2.75} />
                </>
              )}
            </button>

            <button
              data-testid="verify-resend"
              onClick={resend}
              disabled={resending || resentAgo}
              className="mt-3 w-full text-[13px] font-mono font-semibold text-white rounded-2xl px-6 active:scale-[0.98] disabled:opacity-60"
              style={{
                minHeight: 48,
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.12)",
              }}
            >
              {resentAgo ? "Sent ✓ — check spam too" : resending ? "Sending…" : "Resend email"}
            </button>

            <button
              onClick={signOut}
              className="mt-5 mx-auto flex items-center gap-1.5 text-[11px] font-mono text-[#b0b0b0] hover:text-[#ddd] transition-colors"
            >
              <LogOut size={12} />
              Wrong email? Start over
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
