"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PhoneMockup } from "@/components/phone-mockup"
import { IABBanner } from "@/components/iab-banner"
import { signUp, signIn } from "@/lib/auth-client"
import { detectIAB, type IABInfo } from "@/lib/iab"
import { track, type EventName } from "@/lib/analytics"
import { ArrowRight, Eye, EyeOff, Star, Zap } from "lucide-react"

/**
 * Minimum-viable signup: two fields — email + password. Name is derived
 * from the email prefix on the server (jane.smith@x.com → "Jane Smith") and
 * refined during onboarding where the user has already committed.
 *
 * Rationale: every field on a signup form removes ~10% of completions in
 * high-friction WebViews (TikTok, Instagram). Two fields ≈ ~20% higher
 * completion than three. We accept "worse name quality" as the trade — the
 * onboarding welcome screen already asks for a display name.
 *
 * Same Better Auth wiring, same 10s timeout + retry, same USER_ALREADY_EXISTS
 * recovery as production sign-up-screen.tsx. Only the field count and copy
 * differ.
 */

interface Props {
  userAgent?: string
}

const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "1"
const DRAFT_KEY = "pt_signup_v4_draft"
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

// jane.smith@example.com → "Jane Smith". Names look OK 90% of the time and
// the onboarding step lets users fix the 10% that don't. Better Auth accepts
// any string, so no validation risk here.
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? ""
  if (!local) return "Creator"
  return local
    .replace(/\+.*$/, "")
    .split(/[._-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase())
    .join(" ")
    || "Creator"
}

export function SignUpV4({ userAgent }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [isNetworkError, setIsNetworkError] = useState(false)
  const [iab, setIab] = useState<IABInfo>(() => detectIAB(userAgent))
  const fired = useRef<Set<string>>(new Set())

  function fireOnce(stage: EventName, props: Record<string, string | number | boolean | null> = {}) {
    if (fired.current.has(stage)) return
    fired.current.add(stage)
    track(stage, props)
  }

  useEffect(() => {
    // Restore draft (WebView kill safety).
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw) as { email?: string; password?: string }
        if (typeof d.email === "string") setEmail(d.email)
        if (typeof d.password === "string") setPassword(d.password)
      }
    } catch {}

    track("view_signup", { variant: "v4" })
    const params = new URLSearchParams(window.location.search)
    if (params.get("google_error")) {
      setError("Google sign-in didn't complete. Email works right here.")
    }
    const detected = detectIAB()
    if (detected.isIAB) setIab(detected)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ email, password }))
    } catch {}
  }, [email, password])

  const emailValid = /.+@.+\..+/.test(email)
  const passwordStrong = password.length >= 8
  const derivedName = emailValid ? nameFromEmail(email) : "You"

  async function handleGoogle() {
    if (googleLoading || loading) return
    setGoogleLoading(true)
    setError("")
    fireOnce("click_google_signup", { iab: iab.platform ?? "none" })
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/onboarding?auth=google",
        errorCallbackURL: "/register-v4?google_error=1",
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start Google sign-in. Try again."
      setError(msg)
      setGoogleLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailValid) return setError("Enter a valid email.")
    if (!passwordStrong) return setError("Password must be 8+ characters.")

    fireOnce("submit_signup", { variant: "v4" })
    setLoading(true)
    setError("")
    setIsNetworkError(false)

    const payload = {
      email,
      password,
      name: nameFromEmail(email),
      callbackURL: "/onboarding",
    }
    let timedOutOnce = false
    let result: Awaited<ReturnType<typeof signUp.email>> | null = null
    let lastNetworkError: unknown = null

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1])
      try {
        const raced = await Promise.race([
          signUp.email(payload),
          sleep(ATTEMPT_TIMEOUT_MS).then(() => TIMED_OUT as typeof TIMED_OUT),
        ])
        if (raced === TIMED_OUT) {
          timedOutOnce = true
          lastNetworkError = new Error("Request timed out")
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
            const s = await signIn.email({ email, password, callbackURL: "/onboarding" })
            if (!(s as { error?: unknown }).error) {
              try { localStorage.removeItem(DRAFT_KEY) } catch {}
              fireOnce("create_account", { recovered: "timeout_signin", variant: "v4" })
              router.push("/onboarding")
              return
            }
          } catch {}
        }
        const msg = errObj.message || friendlyMessage(errObj.code, status) || "Sign up failed"
        setError(msg)
        track("error_signup", { reason: errObj.code ?? msg.slice(0, 80), status: status ?? null })
        return
      }
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      fireOnce("create_account", { variant: "v4" })
      router.push("/onboarding")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || googleLoading

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "#030303" }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% -5%, rgba(0,255,136,0.16) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 max-w-md mx-auto px-5 pt-safe">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
            <span className="font-semibold text-[14px] text-white">Paytree</span>
            <span className="text-[9px] font-mono text-[#00ff88] border border-[rgba(0,255,136,0.35)] rounded px-1.5 py-0.5">
              v4
            </span>
          </Link>
          <Link
            href="/login"
            className="text-[#888] text-[13px] font-mono min-h-11 flex items-center px-2"
          >
            Sign in
          </Link>
        </div>
      </div>

      <main className="relative z-10 max-w-md mx-auto px-5 pb-16">
        {/* Chip */}
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: "rgba(0,255,136,0.10)",
              border: "0.5px solid rgba(0,255,136,0.35)",
              boxShadow: "0 0 20px rgba(0,255,136,0.18)",
            }}
          >
            <Zap size={11} className="text-[#00ff88]" strokeWidth={2.5} />
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#00ff88] font-bold">
              2 fields · 30 seconds
            </span>
          </span>
        </div>

        <h1 className="mt-5 text-center font-bold tracking-tight leading-[1.02]">
          <span
            className="block text-[36px] text-[#00ff88]"
            style={{
              textShadow:
                "0 0 24px rgba(0,255,136,0.45), 0 0 52px rgba(0,255,136,0.22)",
            }}
          >
            Email + password.
          </span>
          <span className="block text-[18px] text-white/95 font-semibold mt-1">
            That&apos;s the whole thing.
          </span>
        </h1>

        {iab.isIAB && (
          <div className="mt-4">
            <IABBanner platform={iab.platform} />
          </div>
        )}

        {/* Cinematic photo — live AI-selling demo, tucked between headline
            and form so users see the product they're about to build.
            Doubles as visual proof for the 2-field claim. */}
        <div className="mt-6 flex flex-col items-center">
          <div className="mb-2 flex items-center gap-1.5">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"
              style={{ boxShadow: "0 0 6px #00ff88" }}
            />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88]">
              this is what you&apos;re building
            </span>
          </div>
          <PhoneMockup className="scale-90 origin-top" />
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.standard}
          onSubmit={submit}
          className="mt-6 rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 50%, transparent)",
            }}
          />

          {GOOGLE_LOGIN_ENABLED && !iab.isIAB && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-white font-semibold text-[14px] active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                  minHeight: 48,
                }}
              >
                <GoogleIcon />
                {googleLoading ? "Connecting…" : "Continue with Google"}
              </button>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">
                  or with email
                </span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>
            </>
          )}
          {GOOGLE_LOGIN_ENABLED && iab.isIAB && (
            <p className="text-[11px] text-[#666] font-mono text-center mb-3">
              Google sign-in needs a full browser — email works here.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="v4-email"
                className="text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1 block"
              >
                email
              </label>
              <input
                id="v4-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => fireOnce("start_signup", { variant: "v4" })}
                disabled={disabled}
                className="w-full bg-transparent text-white text-[16px] outline-none placeholder:text-[#555]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  minHeight: 48,
                }}
              />
              {/* Auto-derived name hint — shown once email is valid */}
              {emailValid && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.snappy}
                  className="mt-1.5 text-[11px] font-mono text-[#888]"
                >
                  We&apos;ll call you{" "}
                  <span className="text-[#00ff88] font-semibold">
                    {derivedName}
                  </span>
                  . You can change it after.
                </motion.p>
              )}
            </div>

            <div>
              <label
                htmlFor="v4-password"
                className="text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1 block"
              >
                password
              </label>
              <div className="relative">
                <input
                  id="v4-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="8+ characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => fireOnce("start_signup", { variant: "v4" })}
                  disabled={disabled}
                  className="w-full bg-transparent text-white text-[16px] outline-none placeholder:text-[#555]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "14px 48px 14px 16px",
                    minHeight: 48,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#666] hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (password.length / 12) * 100)}%` }}
                      className="h-full"
                      style={{
                        background: passwordStrong
                          ? "#00ff88"
                          : password.length >= 6
                          ? "#f59e0b"
                          : "#ff5555",
                        boxShadow: passwordStrong
                          ? "0 0 10px rgba(0,255,136,0.5)"
                          : "none",
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest"
                    style={{
                      color: passwordStrong
                        ? "#00ff88"
                        : password.length >= 6
                        ? "#f59e0b"
                        : "#ff5555",
                    }}
                  >
                    {passwordStrong ? "strong" : password.length >= 6 ? "ok" : "weak"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4">
              {isNetworkError ? (
                <button
                  type="submit"
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

          <motion.button
            type="submit"
            disabled={disabled}
            whileTap={{ scale: 0.98 }}
            animate={
              emailValid && passwordStrong && !loading
                ? {
                    boxShadow: [
                      "0 0 24px rgba(0,255,136,0.35)",
                      "0 0 44px rgba(0,255,136,0.55)",
                      "0 0 24px rgba(0,255,136,0.35)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl text-black font-mono font-bold text-[15px] px-4 disabled:opacity-70"
            style={{
              background: loading ? "rgba(0,255,136,0.6)" : "#00ff88",
              minHeight: 56,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <motion.span
                  className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black/70 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                Publishing your page…
              </>
            ) : (
              <>
                Publish my page — free
                <ArrowRight size={16} strokeWidth={2.75} />
              </>
            )}
          </motion.button>

          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-mono text-[#888]">
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={10} className="fill-[#00ff88] text-[#00ff88]" />
              ))}
            </div>
            <span>1,247 creators · no card</span>
          </div>
        </motion.form>

        <p className="mt-6 text-center text-[12px] text-[#666] font-mono">
          Already have an account?{" "}
          <Link href="/login" className="text-[#00ff88] font-semibold">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  )
}

function friendlyMessage(code: string | undefined, status: number | undefined): string | null {
  if (code === "USER_ALREADY_EXISTS" || status === 409)
    return "An account with that email already exists. Try signing in."
  if (code === "INVALID_EMAIL") return "That email address looks invalid."
  if (code === "WEAK_PASSWORD") return "That password is too weak. Use at least 8 characters."
  if (code === "INVALID_ORIGIN" || status === 403)
    return "Your browser blocked the sign-up. Open paytree.to directly in Safari or Chrome."
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
