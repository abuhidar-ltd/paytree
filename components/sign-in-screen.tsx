"use client"

import { forwardRef, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { IABBanner } from "@/components/iab-banner"
import { signIn, useSession } from "@/lib/auth-client"
import { detectIAB, type IABInfo } from "@/lib/iab"
import { track, type EventName } from "@/lib/analytics"
import { hardNavigate } from "@/lib/post-auth-nav"
import { ArrowRight, ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react"

/**
 * Login wizard — email step → password step. Matches the register wizard
 * so the two flows feel like one product. Same auth wiring as the real
 * SignInScreen: Better Auth signIn.email + signIn.social, IAB detection,
 * legacy-account notice for pre-migration users, session watcher that
 * auto-redirects if already signed in.
 */

interface Props {
  userAgent?: string
}

const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "1"

const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 32 },
  standard: { type: "spring" as const, stiffness: 300, damping: 28 },
}

const ATTEMPT_TIMEOUT_MS = 10_000
const RETRY_DELAYS_MS = [1_000, 3_000]
const TIMED_OUT = Symbol("timed_out")

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

export function SignInScreen({ userAgent }: Props) {
  const { data: session, isPending } = useSession()
  // Guard against double-navigation: after submit() succeeds it calls
  // hardNavigate, and then useSession revalidates and would fire its own
  // hardNavigate — the race gives Chrome an ERR_ABORTED on the first one.
  // Fixed the visible symptom by only navigating from the first call site.
  const navigatedRef = useRef(false)

  const [step, setStep] = useState(0)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [showLegacyNotice, setShowLegacyNotice] = useState(false)
  const [iab, setIab] = useState<IABInfo>(() => detectIAB(userAgent))
  const inputRef = useRef<HTMLInputElement>(null)
  const fired = useRef<Set<string>>(new Set())

  function fireOnce(stage: EventName, props: Record<string, string | number | boolean | null> = {}) {
    if (fired.current.has(stage)) return
    fired.current.add(stage)
    track(stage, props)
  }

  useEffect(() => {
    track("view_login")
    const params = new URLSearchParams(window.location.search)
    if (params.get("google_error")) {
      setError("Google sign-in didn't complete. Use your email and password instead.")
    }
    const detected = detectIAB()
    if (detected.isIAB) setIab(detected)
  }, [])

  // If already signed in (returning tab, session cookie still valid), skip
  // straight to /dashboard — same guard as production SignInScreen.
  useEffect(() => {
    if (!isPending && session && !navigatedRef.current) {
      navigatedRef.current = true
      try {
        if (!sessionStorage.getItem("paytree_login_completed")) {
          sessionStorage.setItem("paytree_login_completed", "1")
          track("complete_login")
        }
      } catch {
        track("complete_login")
      }
      hardNavigate("/dashboard")
    }
  }, [isPending, session])

  // Refocus on step change so keyboard stays open through the wizard.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 220)
    return () => clearTimeout(t)
  }, [step])

  async function handleGoogle() {
    if (googleLoading || loading) return
    setGoogleLoading(true)
    setError("")
    fireOnce("click_google_login", { iab: iab.platform ?? "none" })
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard?auth=google",
        errorCallbackURL: "/login?google_error=1",
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start Google sign-in. Try again."
      setError(msg)
      setGoogleLoading(false)
    }
  }

  function next() {
    setError("")
    if (step === 0) {
      // Match the signup normalization exactly — mobile autofill emails often
      // come back with a stray leading space or a capitalized first letter,
      // and Postgres @unique is case-sensitive, so any mismatch is USER_NOT_FOUND
      // even though the account exists.
      const cleaned = email.trim().toLowerCase()
      if (!/.+@.+\..+/.test(cleaned)) return setError("Enter a valid email.")
      if (cleaned !== email) setEmail(cleaned)
      fireOnce("start_login")
      setStep(1)
    } else if (step === 1) {
      submit()
    }
  }

  async function submit() {
    if (!password) return setError("Enter your password.")
    fireOnce("submit_login")
    setLoading(true)
    setError("")

    // Retry envelope mirroring the signup flow — a Twitter/Instagram WebView
    // on a slow 4G connection routinely takes 6-8s round trip for the first
    // request, and a raw single-shot signIn silently reads as "wrong
    // password" when the fetch times out. Never retry on credential errors
    // (401 / INVALID_EMAIL_OR_PASSWORD) — those are the user, not the wire.
    const payload = {
      email: email.trim().toLowerCase(),
      password,
      callbackURL: "/dashboard",
    }
    let result: Awaited<ReturnType<typeof signIn.email>> | null = null
    let lastNetworkError: unknown = null

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1])
      try {
        const raced = await Promise.race([
          signIn.email(payload),
          sleep(ATTEMPT_TIMEOUT_MS).then(() => TIMED_OUT as typeof TIMED_OUT),
        ])
        if (raced === TIMED_OUT) {
          lastNetworkError = new Error("Request timed out")
          continue
        }
        const racedErr = (raced as { error?: { code?: string; status?: number; statusCode?: number } }).error
        const status = racedErr?.status ?? racedErr?.statusCode
        // Credential rejections are not retryable — surface immediately.
        if (
          racedErr?.code === "INVALID_EMAIL_OR_PASSWORD" ||
          racedErr?.code === "USER_NOT_FOUND" ||
          status === 401
        ) {
          result = raced
          break
        }
        // Retryable server errors: 5xx + generic FAILED_TO_CREATE_USER.
        if (racedErr && (status === undefined || status >= 500)) {
          lastNetworkError = new Error(racedErr.code || `HTTP ${status ?? "?"}`)
          continue
        }
        result = raced
        break
      } catch (err) {
        lastNetworkError = err
      }
    }

    try {
      if (!result) {
        const detail = lastNetworkError instanceof Error ? lastNetworkError.message : "fetch failed"
        setError("Connection issue — please try again in a moment.")
        track("error_login", { reason: "network", detail: detail.slice(0, 80) })
        return
      }
      const authError = (result as { error?: unknown }).error
      if (authError) {
        const errObj = authError as {
          message?: string
          code?: string
          status?: number
          statusCode?: number
        }
        const status = errObj.status ?? errObj.statusCode
        const isInvalidCredentials =
          errObj.code === "INVALID_EMAIL_OR_PASSWORD" ||
          errObj.code === "USER_NOT_FOUND" ||
          status === 401
        const msg = errObj.message || friendlyMessage(errObj.code, status) || "Sign in failed"
        setError(msg)
        if (isInvalidCredentials) setShowLegacyNotice(true)
        track("error_login", {
          reason: isInvalidCredentials ? "invalid_credentials" : (errObj.code ?? msg.slice(0, 40)),
          status: status ?? null,
        })
        return
      }
      navigatedRef.current = true
      hardNavigate("/dashboard")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || googleLoading
  const progress = Math.round(((step + 1) / 2) * 100)

  return (
    <div
      // dvh so keyboard opening doesn't push CTA off-screen on mobile.
      className="min-h-screen min-h-dvh text-white relative overflow-hidden"
      style={{ background: "#030303" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 10%, rgba(0,255,136,0.14) 0%, transparent 55%)",
        }}
      />

      {/* Header + progress */}
      <div className="relative z-10 max-w-md mx-auto px-5 pt-safe">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            aria-label="Back"
            className="w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-0 transition-opacity"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <ArrowLeft size={16} className="text-white" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)]" />
            <span className="font-semibold text-[13px] text-white">Paytree</span>
            <span className="text-[9px] font-mono text-[#00ff88] border border-[rgba(0,255,136,0.35)] rounded px-1.5 py-0.5">
              v2
            </span>
          </Link>
          <div className="w-11" />
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#666]">
            step {step + 1} of 2
          </span>
          <span className="text-[10px] font-mono text-[#00ff88] font-bold">{progress}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={springs.standard}
            className="h-full"
            style={{ background: "#00ff88", boxShadow: "0 0 10px rgba(0,255,136,0.5)" }}
          />
        </div>
      </div>

      <main className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-24">
        {iab.isIAB && (
          <div className="mb-4">
            <IABBanner platform={iab.platform} />
          </div>
        )}

        {step === 0 && GOOGLE_LOGIN_ENABLED && !iab.isIAB && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={disabled}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3.5 text-white font-semibold text-[14px] active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                minHeight: 52,
              }}
            >
              <GoogleIcon />
              {googleLoading ? "Connecting…" : "Continue with Google"}
            </button>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">
                or email · 2 steps
              </span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={springs.standard}
          >
            {step === 0 && (
              <StepShell
                kicker="welcome back"
                title="Your email."
                sub="The one you signed up with."
              >
                <BigInput
                  ref={inputRef}
                  data-testid="login-email"
                  type="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  autoComplete="username"
                  enterKeyHint="next"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  translate="no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  disabled={disabled}
                />
              </StepShell>
            )}
            {step === 1 && (
              <StepShell
                kicker="one more"
                title="Your password."
                sub={email}
              >
                <div className="relative">
                  <BigInput
                    ref={inputRef}
                    data-testid="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    enterKeyHint="go"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    translate="no"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    disabled={disabled}
                    style={{ paddingRight: 56 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#666] hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div className="mt-4">
            <div
              className="rounded-xl px-4 py-3 text-[13px] text-center"
              style={{
                background: "rgba(255,85,85,0.08)",
                border: "0.5px solid rgba(255,85,85,0.25)",
                color: "#ff5555",
              }}
            >
              {error}
            </div>
            {showLegacyNotice && (
              // Pre-June-21 Clerk-era users hit invalid-credentials because
              // their accounts were wiped in the Better Auth migration. Point
              // them at /register so they can recreate with 0% friction.
              <Link
                href="/register"
                className="mt-2 block rounded-xl px-4 py-3 text-[12px] text-center font-mono"
                style={{
                  background: "rgba(0,255,136,0.06)",
                  border: "0.5px solid rgba(0,255,136,0.3)",
                  color: "#00ff88",
                }}
              >
                Signed up before July 2026? → Create a new account
              </Link>
            )}
          </div>
        )}

        <button
          data-testid="login-continue"
          onClick={next}
          disabled={disabled}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-[#00ff88] text-black font-mono font-bold px-6 rounded-2xl text-base active:scale-[0.98] disabled:opacity-70"
          style={{
            minHeight: 56,
            boxShadow: "0 0 40px rgba(0,255,136,0.35)",
          }}
        >
          {loading ? (
            <>
              <motion.span
                className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black/70 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Signing in…
            </>
          ) : step === 0 ? (
            <>
              Continue
              <ArrowRight size={16} strokeWidth={2.75} />
            </>
          ) : (
            <>
              <LogIn size={16} strokeWidth={2.5} />
              Sign in
            </>
          )}
        </button>

        <p className="mt-6 text-center text-[12px] text-[#666] font-mono">
          New here?{" "}
          <Link href="/register" className="text-[#00ff88] font-semibold">
            Create your page
          </Link>
        </p>

        {/* Legal footer — mirrors /register so users see the same trust
            signal on both flows. */}
        <p className="mt-4 text-center text-[11px] text-[#444] leading-relaxed">
          By signing in you agree to our{" "}
          <Link href="/terms" className="text-[#666] underline hover:text-[#888]">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-[#666] underline hover:text-[#888]">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  )
}

function StepShell({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88] mb-3">
        {kicker}
      </div>
      <h1 className="text-[32px] font-bold text-white leading-[1.05]">{title}</h1>
      <p className="mt-2 text-[13px] text-[#888] break-all">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

const BigInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function BigInput(props, ref) {
    return (
      <input
        {...props}
        ref={ref}
        // 20px display font, but the raw value uses 16px minimum via CSS
        // to avoid iOS auto-zoom (see globals). font-semibold gives Sara/
        // sara@email.com the same weight-hierarchy the register wizard uses.
        className="w-full bg-transparent text-white text-[20px] font-semibold outline-none placeholder:text-[#444]"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "18px",
          minHeight: 60,
          ...(props.style ?? {}),
        }}
      />
    )
  },
)

function friendlyMessage(code: string | undefined, status: number | undefined): string | null {
  if (code === "INVALID_EMAIL_OR_PASSWORD" || code === "USER_NOT_FOUND" || status === 401)
    return "That email and password don't match. Try again."
  if (code === "INVALID_EMAIL") return "That email address looks invalid."
  // Server-side trustedOrigins rejection — misleading to blame the browser.
  if (code === "INVALID_ORIGIN" || status === 403)
    return "Sign-in was blocked by our server. Please email support@paytree.to and we'll fix it."
  if (code === "TOO_MANY_REQUESTS" || status === 429)
    return "Too many attempts. Wait a minute and try again."
  if (status === 500) return "Our server hit a snag. Try again in a moment."
  return null
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  )
}
