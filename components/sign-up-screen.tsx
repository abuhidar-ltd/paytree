"use client"

import { forwardRef, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { IABBanner } from "@/components/iab-banner"
import { signUp, signIn } from "@/lib/auth-client"
import { detectIAB, type IABInfo } from "@/lib/iab"
import { track, captureAttribution, type EventName } from "@/lib/analytics"
import { logSignupStage } from "@/lib/signup-telemetry"
import { hardNavigate } from "@/lib/post-auth-nav"
import { ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react"

/**
 * One-field wizard. Built for TikTok's WebView where the user is
 * one distraction from being killed. Every step has:
 *   1. exactly one input (never two — cognitive load kills conversion)
 *   2. a big enter/next button (never Google here — that's on step 1 top)
 *   3. a progress bar so users know they're 33% / 66% / 100% done
 *
 * State is persisted to localStorage so if the TikTok WebView is torn
 * down (which it does aggressively when swiping back or receiving a
 * notification), the user comes back to the same step with the same
 * values. Real signup only fires on step 3 submit.
 */

interface Props {
  userAgent?: string
}

const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "1"
const DRAFT_KEY = "pt_signup_draft"
const ATTEMPT_TIMEOUT_MS = 10_000
const RETRY_DELAYS_MS = [1_000, 3_000]
const TIMED_OUT = Symbol("timed_out")

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 32 },
  standard: { type: "spring" as const, stiffness: 300, damping: 28 },
}

// Draft persisted so a WebView kill doesn't wipe progress. Password is
// intentionally NOT persisted — plaintext credentials in localStorage would be
// leaked by any XSS, browser extension, or session-replay tool (Clarity masks
// password inputs but not localStorage). If the WebView restores mid-flow with
// a saved step 2 (password), we clamp back to step 1 so the user re-enters.
type Draft = { name: string; email: string; step: number }

export function SignUpScreen({ userAgent }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [iab, setIab] = useState<IABInfo>(() => detectIAB(userAgent))
  const inputRef = useRef<HTMLInputElement>(null)
  const fired = useRef<Set<string>>(new Set())

  function fireOnce(
    stage: EventName,
    props: Record<string, string | number | boolean | null> = {},
    urgent = false,
  ) {
    if (fired.current.has(stage)) return
    fired.current.add(stage)
    track(stage, props, { urgent })
  }

  // Restore draft on first mount — the WebView may have killed the tab
  // mid-flow and we want the user back where they were. Password is never
  // restored (never persisted); if the draft says we were on the password
  // step, clamp back to the email step so the user re-enters credentials.
  useEffect(() => {
    // First-touch attribution (twclid/rdt_cid/utm_*). Ads deep-link straight
    // to /register, so capture must happen here too — not only on the homepage.
    captureAttribution()

    // Anything typed BEFORE hydration exists only in the DOM — those
    // keystrokes never fired onChange. Adopt the DOM value so the user's
    // typing survives; it also outranks any stale draft.
    const preTyped = inputRef.current?.value ?? ""

    let draftName = ""
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw) as Partial<Draft>
        if (typeof d.name === "string") draftName = d.name
        if (typeof d.email === "string") setEmail(d.email)
        // Never yank the user off the name step if they're mid-typing.
        if (typeof d.step === "number" && d.step > 0 && !preTyped) {
          setStep(Math.min(d.step, 1))
        }
      }
    } catch {}

    const effectiveName = preTyped || draftName
    if (effectiveName) {
      setName(effectiveName)
      // Inputs are uncontrolled (see BigInput usage) — state alone won't
      // repaint the field, so restore the draft into the DOM as well.
      if (inputRef.current && !inputRef.current.value) {
        inputRef.current.value = effectiveName
      }
    }

    // hydration_ms ≈ how long the SSR'd form was visible-but-inert. This is
    // the window where the pre-fix wipe bug ate signups; keep measuring it.
    const hydrationMs = Math.round(performance.now())
    track("view_signup", { wizard: true, hydration_ms: hydrationMs })
    logSignupStage("hydrated", { ms: hydrationMs })

    const params = new URLSearchParams(window.location.search)
    if (params.get("google_error")) {
      setError("Google sign-in didn't complete. Email works right here.")
    }
    const detected = detectIAB()
    if (detected.isIAB) setIab(detected)
  }, [])

  // Persist draft as user types so a WebView kill doesn't reset progress.
  // Password is deliberately omitted — see the Draft type comment.
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, email, step }))
    } catch {}
  }, [name, email, step])

  // Autofocus the input on every step change — TikTok's WebView won't
  // pop the keyboard automatically otherwise.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 220)
    return () => clearTimeout(t)
  }, [step])

  async function handleGoogle() {
    if (googleLoading || loading) return
    setGoogleLoading(true)
    setError("")
    fireOnce("click_google_signup", { iab: iab.platform ?? "none" })
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/onboarding?auth=google",
        errorCallbackURL: "/register?google_error=1",
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
      // Read the DOM, not React state: keystrokes typed before hydration
      // never reach onChange, and iOS autofill can populate a field without
      // firing events. The ref value is the ground truth.
      const rawName = (inputRef.current?.value ?? name).trim()
      if (rawName.length < 2) {
        logSignupStage("validation_failed", { step: "name", reason: "too_short" })
        return setError("Enter your name (2+ characters).")
      }
      setName(rawName)
      fireOnce("start_signup", { wizard: true })
      logSignupStage("step_done", { step: "name" })
      setStep(1)
    } else if (step === 1) {
      // Normalize as the user advances — mobile keyboards autofill emails with
      // a trailing space or a random uppercase first letter, both of which
      // silently create phantom accounts the user can never sign back into.
      const cleaned = (inputRef.current?.value ?? email).trim().toLowerCase()
      if (!/.+@.+\..+/.test(cleaned)) {
        logSignupStage("validation_failed", { step: "email", reason: "invalid_email" })
        return setError("Enter a valid email.")
      }
      setEmail(cleaned)
      logSignupStage("step_done", { step: "email" })
      setStep(2)
    } else if (step === 2) {
      submit()
    }
  }

  function back() {
    setError("")
    if (step > 0) setStep(step - 1)
  }

  async function submit() {
    // Same DOM-first read as next(): the password field may hold characters
    // React never saw. Never trim the password — users may intentionally
    // include leading/trailing spaces and we must respect that.
    const pw = inputRef.current?.value ?? password
    if (pw.length < 8) {
      logSignupStage("validation_failed", { step: "password", reason: "too_short" })
      return setError("Password must be 8+ characters.")
    }
    if (pw !== password) setPassword(pw)

    fireOnce("submit_signup", { wizard: true })
    setLoading(true)
    setError("")
    setIsNetworkError(false)

    const payload = {
      email: email.trim().toLowerCase(),
      password: pw,
      name: name.trim(),
      callbackURL: "/onboarding",
    }
    let timedOutOnce = false
    let result: Awaited<ReturnType<typeof signUp.email>> | null = null
    let lastNetworkError: unknown = null

    // Retry envelope covers three failure modes:
    //   1. Network / timeout — obvious retry.
    //   2. Thrown error from signUp.email — same.
    //   3. FAILED_TO_CREATE_USER 500 — surfaces the residual (~1/65k)
    //      username-suffix collision from the auth hook. The hook re-rolls
    //      entropy on each call, so retrying is guaranteed-terminating.
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1])
      try {
        logSignupStage("submit", { attempt })
        const raced = await Promise.race([
          signUp.email(payload),
          sleep(ATTEMPT_TIMEOUT_MS).then(() => TIMED_OUT as typeof TIMED_OUT),
        ])
        if (raced === TIMED_OUT) {
          timedOutOnce = true
          lastNetworkError = new Error("Request timed out")
          continue
        }
        const racedErr = (raced as { error?: { code?: string; status?: number; statusCode?: number } }).error
        if (racedErr?.code === "FAILED_TO_CREATE_USER") {
          // Ask the server to roll a fresh username on the next try.
          lastNetworkError = new Error("FAILED_TO_CREATE_USER")
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
        const msg = lastNetworkError instanceof Error ? lastNetworkError.message : "fetch failed"
        setIsNetworkError(true)
        setError("Connection issue — tap to try again")
        track("error_signup", { reason: "network", detail: msg.slice(0, 80), timed_out: timedOutOnce })
        logSignupStage("submit_result", { ok: false, reason: "network", detail: msg.slice(0, 60) })
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
        if (timedOutOnce && (errObj.code === "USER_ALREADY_EXISTS" || status === 409)) {
          try {
            const s = await signIn.email({ email: payload.email, password: pw, callbackURL: "/onboarding" })
            if (!(s as { error?: unknown }).error) {
              try { localStorage.removeItem(DRAFT_KEY) } catch {}
              // urgent: hardNavigate tears the document down — a deferred
              // track() would be dropped and the funnel loses its success event.
              fireOnce("create_account", { recovered: "timeout_signin", wizard: true }, true)
              logSignupStage("submit_result", { ok: true, recovered: "timeout_signin" })
              hardNavigate("/onboarding")
              return
            }
          } catch {
            logSignupStage("submit_result", { ok: false, reason: "timeout_signin_recovery_failed" })
          }
        }
        const msg = errObj.message || friendlyMessage(errObj.code, status) || "Sign up failed"
        setError(msg)
        track("error_signup", { reason: errObj.code ?? msg.slice(0, 80), status: status ?? null })
        logSignupStage("submit_result", { ok: false, code: errObj.code ?? null, status: status ?? null })
        return
      }
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      fireOnce("create_account", { wizard: true }, true)
      logSignupStage("submit_result", { ok: true })
      hardNavigate("/onboarding")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(msg)
      logSignupStage("submit_result", { ok: false, reason: "client_exception", detail: msg.slice(0, 60) })
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || googleLoading
  const progress = Math.round(((step + 1) / 3) * 100)

  return (
    <div className="min-h-screen min-h-dvh text-white relative overflow-hidden" style={{ background: "#030303" }}>
      {/* Ambient */}
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
        <div className="flex items-center justify-between py-4">
          <button
            onClick={back}
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
              v3
            </span>
          </Link>
          <div className="w-11" />
        </div>

        {/* Progress rail */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#666]">
            step {step + 1} of 3
          </span>
          <span className="text-[10px] font-mono text-[#00ff88] font-bold">
            {progress}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            layout
            animate={{ width: `${progress}%` }}
            transition={springs.standard}
            className="h-full"
            style={{
              background: "#00ff88",
              boxShadow: "0 0 10px rgba(0,255,136,0.5)",
            }}
          />
        </div>
      </div>

      <main className="relative z-10 max-w-md mx-auto px-5 pt-4 pb-24">
        {iab.isIAB && (
          <div className="mb-4">
            <IABBanner platform={iab.platform} />
          </div>
        )}

        {/* Google button — only on step 0, only outside IAB */}
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
                or email · 3 steps
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
                kicker="what should we call you?"
                title="Your name."
                sub="This is what people see on your page."
              >
                <BigInput
                  ref={inputRef}
                  data-testid="signup-name"
                  type="text"
                  placeholder="Sara Miller"
                  autoComplete="name"
                  enterKeyHint="next"
                  autoCapitalize="words"
                  spellCheck={false}
                  translate="no"
                  // Uncontrolled (defaultValue) on purpose: a controlled input
                  // gets reset to React state on the first post-hydration
                  // render, silently erasing anything the user typed while the
                  // JS bundle was still loading. next() reads the DOM value.
                  defaultValue={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  disabled={disabled}
                />
              </StepShell>
            )}
            {step === 1 && (
              <StepShell
                kicker="where should we send the receipt?"
                title="Your email."
                sub="One tap · we never spam."
              >
                <BigInput
                  ref={inputRef}
                  data-testid="signup-email"
                  type="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  enterKeyHint="next"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  translate="no"
                  defaultValue={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  disabled={disabled}
                />
              </StepShell>
            )}
            {step === 2 && (
              <StepShell
                kicker="last thing"
                title="Pick a password."
                sub="8+ characters. That's it."
              >
                <div className="relative">
                  <BigInput
                    ref={inputRef}
                    data-testid="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    enterKeyHint="go"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    translate="no"
                    defaultValue={password}
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
                {password.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(100, (password.length / 12) * 100)}%`,
                        }}
                        className="h-full"
                        style={{
                          background:
                            password.length >= 8
                              ? "#00ff88"
                              : password.length >= 6
                              ? "#f59e0b"
                              : "#ff5555",
                          boxShadow:
                            password.length >= 8
                              ? "0 0 10px rgba(0,255,136,0.5)"
                              : "none",
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono uppercase tracking-widest"
                      style={{
                        color:
                          password.length >= 8
                            ? "#00ff88"
                            : password.length >= 6
                            ? "#f59e0b"
                            : "#ff5555",
                      }}
                    >
                      {password.length >= 8 ? "strong" : password.length >= 6 ? "ok" : "weak"}
                    </span>
                  </div>
                )}
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="mt-4">
            {isNetworkError ? (
              <button
                onClick={submit}
                disabled={disabled}
                className="w-full rounded-xl px-4 py-3 text-[13px] font-mono font-semibold"
                style={{
                  background: "rgba(245,158,11,0.08)",
                  border: "0.5px solid rgba(245,158,11,0.3)",
                  color: "#f59e0b",
                  minHeight: 48,
                }}
              >
                {loading ? "Retrying…" : `${error} ↻`}
              </button>
            ) : (
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
            )}
          </div>
        )}

        {/* Primary CTA — same button for "Continue" (steps 0-1) and
            "Publish" (step 2). Tests target it via data-testid to survive
            copy changes. */}
        <button
          data-testid="signup-continue"
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
              Publishing…
            </>
          ) : step < 2 ? (
            <>
              Continue
              <ArrowRight size={16} strokeWidth={2.75} />
            </>
          ) : (
            <>
              Publish my page — free
              <ArrowRight size={16} strokeWidth={2.75} />
            </>
          )}
        </button>

        {/* Step 3 reassure */}
        {step === 2 && (
          <p className="mt-3 text-center text-[11px] font-mono text-[#00ff88] font-semibold">
            No card · Cancel anytime · 0% fees
          </p>
        )}

        {/* Sign in */}
        <p className="mt-6 text-center text-[12px] text-[#666] font-mono">
          Already have an account?{" "}
          <Link href="/login" className="text-[#00ff88] font-semibold">
            Sign in
          </Link>
        </p>

        {/* Legal footer — required for Google OAuth review + basic
            trust signal that measurably lifts signup conversion. */}
        <p className="mt-4 text-center text-[11px] text-[#444] leading-relaxed">
          By creating an account you agree to our{" "}
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
      <h1 className="text-[32px] font-bold text-white leading-[1.05]">
        {title}
      </h1>
      <p className="mt-2 text-[13px] text-[#888]">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

// Big input designed for thumb typing — 60px tall, 18px font, no border chrome.
const BigInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function BigInput(props, ref) {
    return (
      <input
        {...props}
        ref={ref}
        className="w-full bg-transparent text-white text-[20px] font-semibold outline-none placeholder:text-[#444]"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "18px 18px",
          minHeight: 60,
          ...(props.style ?? {}),
        }}
      />
    )
  },
)

function friendlyMessage(code: string | undefined, status: number | undefined): string | null {
  if (code === "USER_ALREADY_EXISTS" || status === 409)
    return "An account with that email already exists. Try signing in."
  if (code === "INVALID_EMAIL") return "That email address looks invalid."
  if (code === "WEAK_PASSWORD")
    return "That password is too weak. Use at least 8 characters."
  // INVALID_ORIGIN is a server-side trustedOrigins misconfig — telling the
  // user to switch browsers sends them on a wild goose chase. Point them at
  // support so we hear about it fast.
  if (code === "INVALID_ORIGIN" || status === 403)
    return "Sign-up was blocked by our server. Please email support@paytree.to and we'll fix it."
  if (code === "TOO_MANY_REQUESTS" || status === 429)
    return "Too many attempts. Wait a minute and try again."
  // FAILED_TO_CREATE_USER survives past retries — surface as retryable instead
  // of a dead-end message so the user doesn't bounce.
  if (code === "FAILED_TO_CREATE_USER")
    return "Couldn't finish creating your account. Please try again."
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

