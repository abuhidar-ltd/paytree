"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { signIn, useSession } from "@/lib/auth-client"
import { trackEvent } from "@/lib/analytics"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fired = useRef<Set<string>>(new Set())

  function fireOnce(stage: string, props: Record<string, string | number | boolean | null> = {}) {
    if (fired.current.has(stage)) return
    fired.current.add(stage)
    trackEvent(stage, props)
  }

  useEffect(() => {
    trackEvent("login_page_viewed")
    fireOnce("signin_form_mounted")
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

    try {
      const { error: authError } = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      })

      if (authError) {
        const msg = authError.message || "Sign in failed"
        setError(msg)
        trackEvent(`signin_error_${slugify(msg)}`, { message: msg.slice(0, 80) })
        return
      }

      router.push("/dashboard")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(msg)
      trackEvent(`signin_error_${slugify(msg)}`, { message: msg.slice(0, 80) })
    } finally {
      setLoading(false)
    }
  }

  if (!isPending && session) return null

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

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => fireOnce("signin_email_focused")}
            autoComplete="email"
            disabled={loading}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => fireOnce("signin_password_focused")}
            autoComplete="current-password"
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
              fontSize: 15,
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
            <Link href="/start" className="text-[#00ff88] hover:text-[#00ff88]/80 font-semibold">
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
  fontSize: 15,
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
