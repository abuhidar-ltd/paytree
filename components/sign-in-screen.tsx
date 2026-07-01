"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { IABBanner } from "@/components/iab-banner"
import { signIn, useSession } from "@/lib/auth-client"
import { detectIAB, type IABInfo } from "@/lib/iab"
import { trackEvent } from "@/lib/analytics"

// Render the Google button only when the env flag is set. lib/auth.ts ALSO
// gates on the Google secret keys, so without both we can never show a
// broken OAuth flow.
const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "1"

interface SignInScreenProps {
  userAgent?: string
}

export function SignInScreen({ userAgent }: SignInScreenProps) {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  // Pre-June-21 Clerk-era accounts were wiped in the Better Auth migration.
  // Those users still try to log in (5 invalid-credential errors in the last
  // week) — after a failed attempt, tell them what happened and route them
  // to /register instead of letting them retry into a wall.
  const [showLegacyNotice, setShowLegacyNotice] = useState(false)
  // Server-detected on first paint; re-checked client-side after mount.
  const [iab, setIab] = useState<IABInfo>(() => detectIAB(userAgent))
  const fired = useRef<Set<string>>(new Set())

  function fireOnce(stage: string, props: Record<string, string | number | boolean | null> = {}) {
    if (fired.current.has(stage)) return
    fired.current.add(stage)
    trackEvent(stage, props)
  }

  // Sign-in (not sign-up): existing users go to /dashboard. Sending them to
  // /onboarding would loop them back through the welcome flow they already
  // completed.
  async function handleGoogle() {
    if (googleLoading || loading) return
    setGoogleLoading(true)
    setError("")
    // Only reachable in a real browser — the button is hidden inside IABs.
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
      trackEvent("error_google_login", { reason: msg.slice(0, 80) })
      setGoogleLoading(false)
    }
  }

  useEffect(() => {
    trackEvent("login_page_viewed")

    const params = new URLSearchParams(window.location.search)
    if (params.get("google_error")) {
      trackEvent("error_google_login", { reason: "oauth_callback" })
      setError("Google sign-in didn't complete. Use your email and password instead.")
    }

    const forced = params.get("iab")
    const detected = forced
      ? { isIAB: true, platform: forced as IABInfo["platform"] }
      : detectIAB()
    if (detected.isIAB) setIab(detected)
  }, [])

  useEffect(() => {
    if (!isPending && session) {
      try {
        if (!sessionStorage.getItem("paytree_login_completed")) {
          sessionStorage.setItem("paytree_login_completed", "1")
          trackEvent("login_completed")
        }
      } catch {
        trackEvent("login_completed")
      }
      router.push("/dashboard")
    }
  }, [isPending, session, router])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    fireOnce("signin_submit_clicked")
    setLoading(true)
    setError("")

    console.log("[signin] submitting", { email, origin: window.location.origin })

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      })
      console.log("[signin] signIn.email returned", result)

      const authError = (result as { error?: unknown }).error
      if (authError) {
        const errObj = authError as {
          message?: string
          code?: string
          status?: number
          statusCode?: number
          body?: { message?: string; error?: string }
        }
        const status = errObj.status ?? errObj.statusCode
        const isInvalidCredentials =
          errObj.code === "INVALID_EMAIL_OR_PASSWORD" ||
          errObj.code === "USER_NOT_FOUND" ||
          status === 401
        const msg =
          errObj.message ||
          errObj.body?.message ||
          errObj.body?.error ||
          friendlyMessage(errObj.code, status) ||
          "Sign in failed"
        console.error("[signin] authError", errObj)
        setError(msg)
        if (isInvalidCredentials) setShowLegacyNotice(true)
        trackEvent("error_login", {
          reason: isInvalidCredentials ? "invalid_credentials" : (errObj.code ?? msg.slice(0, 40)),
          status: status ?? null,
        })
        return
      }

      console.log("[signin] success, redirecting to /dashboard")
      router.push("/dashboard")
    } catch (err) {
      console.error("[signin] threw", err)
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(msg)
      trackEvent("error_login", { reason: "network", detail: msg.slice(0, 80) })
    } finally {
      setLoading(false)
    }
  }

  if (!isPending && session) return null

  const disabled = loading || googleLoading

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white relative">
      <PremiumBackground />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl sm:text-4xl font-bold kinetic-shimmer-accent">Paytree</h1>
          </Link>
          <p className="text-sm sm:text-base text-gray-400 mt-2">Sign in to your account</p>
        </div>

        {iab.isIAB && <IABBanner platform={iab.platform} />}

        <form
          onSubmit={handleSignIn}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            position: "relative",
            overflow: "hidden",
            padding: "24px",
          }}
          className="flex flex-col gap-3"
        >
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 1, pointerEvents: "none",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
          }} />

          {/* Google hard-blocks OAuth inside WebViews (403 disallowed_useragent).
              Inside an IAB the button is a guaranteed dead end — hide it and
              say why, instead of letting users hit Google's error wall. */}
          {GOOGLE_LOGIN_ENABLED && !iab.isIAB && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={disabled}
                style={googleButtonStyle(disabled)}
              >
                <GoogleIcon />
                {googleLoading ? "Connecting..." : "Continue with Google"}
              </button>

              <div style={dividerWrapStyle}>
                <div style={dividerLineStyle} />
                <span style={dividerTextStyle}>or</span>
                <div style={dividerLineStyle} />
              </div>
            </>
          )}
          {GOOGLE_LOGIN_ENABLED && iab.isIAB && (
            <p style={{ color: "#555", fontSize: 12, textAlign: "center", margin: "0 0 4px" }}>
              Google sign-in needs a full browser — email works right here.
            </p>
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => fireOnce("signin_email_focused")}
            autoComplete="email"
            disabled={disabled}
            style={inputStyle}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => fireOnce("signin_password_focused")}
              autoComplete="current-password"
              disabled={disabled}
              style={{ ...inputStyle, paddingRight: 56 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={passwordToggleStyle}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <div style={{
              color: "#ff5555",
              fontSize: 13,
              textAlign: "center",
              padding: "8px",
              background: "rgba(255,85,85,0.08)",
              borderRadius: 8,
              border: "0.5px solid rgba(255,85,85,0.2)",
            }}>
              {error}
            </div>
          )}

          {showLegacyNotice && (
            <div
              data-testid="legacy-account-notice"
              style={{
                color: "#888",
                fontSize: 12,
                lineHeight: 1.5,
                textAlign: "center",
                padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                border: "0.5px solid rgba(255,255,255,0.08)",
              }}
            >
              Signed up before June 21? We rebuilt our accounts system —{" "}
              <Link
                href="/register"
                className="text-[#00ff88] hover:text-[#00ff88]/80 font-semibold"
              >
                please create a new account →
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={disabled}
            style={{
              background: loading ? "rgba(0,255,136,0.5)" : "#00ff88",
              color: "#000",
              fontWeight: 700,
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 16,
              padding: "16px",
              borderRadius: 12,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
              width: "100%",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        <div className="text-center space-y-2 text-sm">
          <p className="text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#00ff88] hover:text-[#00ff88]/80 font-semibold">
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

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: "14px 16px",
  color: "#f0f0f0",
  fontSize: 16,
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
}

function googleButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.04)",
    border: "0.5px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "14px 16px",
    color: "#f0f0f0",
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "opacity 0.15s",
  }
}

const dividerWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
}

const dividerLineStyle: React.CSSProperties = {
  flex: 1,
  height: "0.5px",
  background: "rgba(255,255,255,0.08)",
}

const dividerTextStyle: React.CSSProperties = {
  color: "#444",
  fontSize: 12,
  fontFamily: "var(--font-mono, monospace)",
}

const passwordToggleStyle: React.CSSProperties = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
  color: "#888",
  fontSize: 12,
  fontFamily: "monospace",
  padding: "8px 10px",
  cursor: "pointer",
  minHeight: 36,
}

function friendlyMessage(code: string | undefined, status: number | undefined): string | null {
  if (code === "INVALID_EMAIL_OR_PASSWORD" || status === 401) return "Email or password doesn't match. Try again."
  if (code === "USER_NOT_FOUND") return "No account with that email. Create one at /register."
  if (code === "INVALID_ORIGIN" || status === 403) return "Your browser blocked the sign-in request. Try opening paytree.to directly in Safari or Chrome."
  if (code === "TOO_MANY_REQUESTS" || status === 429) return "Too many attempts. Wait a minute and try again."
  if (status === 500) return "Our server hit a snag. Try again in a moment."
  return null
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  )
}

