"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { signUp } from "@/lib/auth-client"
import { trackEvent } from "@/lib/analytics"

/**
 * Custom Better Auth signup screen. Used by both /start (canonical, TikTok-safe)
 * and /join (legacy alias). Both wrappers render without props.
 */
export function SignUpScreen() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isTikTokIAB, setIsTikTokIAB] = useState(false)
  const fired = useRef<Set<string>>(new Set())

  function fireOnce(stage: string, props: Record<string, string | number | boolean | null> = {}) {
    if (fired.current.has(stage)) return
    fired.current.add(stage)
    trackEvent(stage, props)
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
        trackEvent(`signup_error_${slugify(msg)}`, { message: msg.slice(0, 80) })
        return
      }

      trackEvent("signup_completed")
      router.push("/onboarding")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(msg)
      trackEvent(`signup_error_${slugify(msg)}`, { message: msg.slice(0, 80) })
    } finally {
      setLoading(false)
    }
  }

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

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => fireOnce("signup_name_focused")}
            autoComplete="name"
            disabled={loading}
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => fireOnce("signup_email_focused")}
            autoComplete="email"
            disabled={loading}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => fireOnce("signup_password_focused")}
            autoComplete="new-password"
            disabled={loading}
            style={inputStyle}
          />

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
            disabled={loading}
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
}
