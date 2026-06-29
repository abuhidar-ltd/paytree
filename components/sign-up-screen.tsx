"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { signIn, signUp } from "@/lib/auth-client"
import { trackEvent } from "@/lib/analytics"

/**
 * Custom Better Auth signup screen. Used by both /start (canonical, TikTok-safe)
 * and /join (legacy alias). Callers pass initialIsTikTokIAB from the server
 * page (detected via headers().get('user-agent')) so the warning banner is
 * present in the initial HTML — a client useEffect alone is too late for
 * bounce-prone TikTok traffic.
 */
interface SignUpScreenProps {
  initialIsTikTokIAB?: boolean
}

const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "1"

export function SignUpScreen({ initialIsTikTokIAB = false }: SignUpScreenProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [isTikTokIAB, setIsTikTokIAB] = useState(initialIsTikTokIAB)
  const fired = useRef<Set<string>>(new Set())

  function fireOnce(stage: string, props: Record<string, string | number | boolean | null> = {}) {
    if (fired.current.has(stage)) return
    fired.current.add(stage)
    trackEvent(stage, props)
  }

  async function handleGoogle() {
    if (googleLoading || loading) return
    setGoogleLoading(true)
    setError("")
    fireOnce("signup_google_clicked")
    try {
      await signIn.social({ provider: "google", callbackURL: "/onboarding" })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start Google sign-in. Try again."
      setError(msg)
      trackEvent("signup_google_failed", { reason: msg.slice(0, 80) })
      setGoogleLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref) {
      document.cookie = `paytree_ref=${encodeURIComponent(ref)}; path=/; max-age=604800; SameSite=Lax`
    }
    trackEvent("signup_page_viewed", { ref: ref ?? null })

    const ua = navigator.userAgent
    const isTikTok = /musical_ly|MusicallyApp|TikTok|BytedanceWebview|bytedance|aweme|snssdk|xigua/i.test(ua)
    const forceIAB = params.get("iab") === "tiktok"
    if (isTikTok || forceIAB) setIsTikTokIAB(true)

    fireOnce("signup_form_mounted")
  }, [])

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) {
      setError("Please fill in all fields")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    fireOnce("signup_submit_clicked")
    setLoading(true)
    setError("")

    try {
      const { error: authError } = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/onboarding",
      })

      if (authError) {
        const msg = authError.message || "Sign up failed"
        setError(msg)
        trackEvent("signup_failed", { reason: msg.slice(0, 80) })
        return
      }

      // Fires only after Better Auth confirms the account was created.
      fireOnce("signup_account_created")
      router.push("/onboarding")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(msg)
      trackEvent("signup_failed", { reason: msg.slice(0, 80) })
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || googleLoading

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white relative">
      <PremiumBackground />

      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl sm:text-3xl font-bold kinetic-shimmer-accent">Paytree</h1>
            <h3 className="text-sm sm:text-sm font-light text-[#00ff88]">
              Create your free page, No Credit card required.
            </h3>
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

        <form
          onSubmit={handleSignUp}
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

          {GOOGLE_LOGIN_ENABLED && (
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

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => fireOnce("signup_name_focused")}
            autoComplete="name"
            disabled={disabled}
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => fireOnce("signup_email_focused")}
            autoComplete="email"
            disabled={disabled}
            style={inputStyle}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => fireOnce("signup_password_focused")}
              autoComplete="new-password"
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
            {loading ? "Creating account..." : "Start free →"}
          </button>

          <div style={{ textAlign: "center", color: "#444", fontSize: 12, marginTop: 4 }}>
            No credit card · Cancel anytime · 0% fees
          </div>
        </form>

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
