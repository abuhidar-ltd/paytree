"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  BadgeCheck,
} from "lucide-react"
import { track } from "@/lib/analytics"

/**
 * Cinematic walkthrough onboarding. 3 questions (name → accent → what you
 * do) and every keystroke re-shapes the live phone preview at the top:
 * initials materialize, accent re-tints the entire UI, ghost cards glow in
 * as the niche is picked. By the time the user hits Publish they've *seen*
 * their page get built.
 *
 * Backend responsibilities preserved from the previous 5-step form:
 *   1. PATCH /api/profile with accentColor, name, category
 *   2. PATCH /api/profile with { onboarded: true } — REQUIRED, or the
 *      dashboard auth guard sends the user back here in an infinite loop
 *   3. POST /api/publish — Publish button *actually publishes*; the
 *      celebration on /dashboard fires from ?published=1
 *   4. POST /api/referral if paytree_ref cookie is set
 *   5. Skip path sets sane defaults (mint accent, classic hero) so the
 *      dashboard never looks half-configured — same behaviour as before.
 *
 * Category IDs match the previous flow (trader/creator/educator/musician/
 * developer/other) so the API stays backwards-compatible with any code
 * that reads user.category.
 */

interface UserData {
  username: string
  name: string | null
  image: string | null
}

const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 32 },
  standard: { type: "spring" as const, stiffness: 300, damping: 28 },
}

const ACCENTS = [
  { name: "Mint", hex: "#00ff88" },
  { name: "Purple", hex: "#9146ff" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Blue", hex: "#378add" },
  { name: "Pink", hex: "#ff2d78" },
]

const NICHES: {
  id: "trader" | "creator" | "educator" | "musician" | "developer" | "other"
  label: string
  card: string
}[] = [
  { id: "trader", label: "Trader / Investor", card: "Live signals · $29/mo" },
  { id: "educator", label: "Educator / Coach", card: "1:1 call · $150" },
  { id: "creator", label: "Content Creator", card: "Latest YouTube video" },
  { id: "musician", label: "Musician / Artist", card: "New drop · pre-save" },
  { id: "developer", label: "Developer / Builder", card: "Open-source project" },
  { id: "other", label: "Something else", card: "My best link" },
]

export function OnboardingFlow({ user }: { user: UserData }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(user.name ?? "")
  const [accent, setAccent] = useState<string>(ACCENTS[0].hex)
  const [niche, setNiche] = useState<(typeof NICHES)[number]["id"] | null>(null)
  const [saving, setSaving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savedRef = useRef(false)

  useEffect(() => {
    track("start_onboarding")
    // Google OAuth signup lands at /onboarding?auth=google — that's the
    // only reliable client-side signal to complete the Google funnel.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("auth") === "google") {
        track("complete_google_signup")
      }
    }
  }, [])

  const nameValid = name.trim().length >= 2
  const nicheValid = !!niche
  const nichePreview =
    NICHES.find((n) => n.id === niche)?.card ?? "My best link"

  const canAdvance =
    (step === 0 && nameValid) ||
    step === 1 ||
    (step === 2 && nicheValid) ||
    step === 3

  const total = 4
  const progress = Math.round(((step + 1) / total) * 100)

  function goBack() {
    if (step > 0) {
      setStep((s) => s - 1)
      setError(null)
    }
  }

  function next() {
    if (!canAdvance) return
    // Fire the step the user just completed so funnel counts don't double.
    track("complete_onboarding_step", { step })
    if (step < 3) {
      setStep((s) => s + 1)
    } else {
      publish()
    }
  }

  /**
   * The real publish path — three API calls in strict order:
   *   PATCH profile (design fields) → PATCH profile (onboarded=true) → POST publish.
   * Referral posts in parallel because failure is silent (analytics only).
   * On publish failure we still route to the dashboard so the user isn't
   * stranded on a "publish failed" screen when their account is fine.
   */
  async function publish() {
    if (savedRef.current) return
    savedRef.current = true
    setSaving(true)
    setError(null)

    try {
      const profileBody: Record<string, unknown> = {
        accentColor: accent,
        name: name.trim(),
      }
      if (niche) profileBody.category = niche

      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileBody),
      })
      if (!profileRes.ok) {
        throw new Error(`profile save failed (${profileRes.status})`)
      }

      const onboardedRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarded: true }),
      })
      if (!onboardedRes.ok) {
        // If this fails, dashboard will kick the user back to /onboarding —
        // surface an error and let them retry rather than infinite-looping.
        throw new Error(`onboarding save failed (${onboardedRes.status})`)
      }

      // Fire publish + referral in parallel — neither should block
      // navigation to the dashboard. Publish failure ≠ dead account.
      const publishPromise = fetch("/api/publish", { method: "POST" }).catch(
        (err) => {
          console.warn("[onboarding] /api/publish failed, continuing:", err)
        },
      )

      const refCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("paytree_ref="))
        ?.split("=")[1]
      if (refCookie) {
        fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: decodeURIComponent(refCookie) }),
        }).catch(() => {})
        document.cookie = "paytree_ref=; path=/; max-age=0"
      }

      await publishPromise
      track("complete_onboarding", { chose_category: !!niche })
      // ?published=1 makes the dashboard fire the confetti celebration.
      router.push("/dashboard?published=1")
    } catch (err) {
      console.error("[onboarding] publish flow failed:", err)
      savedRef.current = false
      setSaving(false)
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Try again.",
      )
    }
  }

  /**
   * Skip path — same smart defaults as the previous onboarding so the
   * dashboard + public page never look half-configured. Sets onboarded=true
   * before navigating; skipping and pushing to /dashboard while
   * onboarded=false triggers an infinite bounce (dashboard guard).
   */
  async function skipToDashboard() {
    if (skipping) return
    setSkipping(true)
    setError(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboarded: true,
          accentColor: "#00ff88",
          heroStyle: "classic",
        }),
      })
      if (!res.ok) throw new Error(`skip failed ${res.status}`)
      track("skip_onboarding")
      router.push("/dashboard")
    } catch (err) {
      console.error("[onboarding] skip failed:", err)
      setSkipping(false)
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      )
    }
  }

  const busy = saving || skipping

  return (
    <div
      // dvh so the CTA doesn't slide under the mobile keyboard on Step 0.
      className="min-h-screen min-h-dvh text-white relative overflow-hidden"
      style={{ background: "#030303" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 10%, ${accent}22 0%, transparent 55%)`,
          transition: "background 0.4s ease",
        }}
      />

      {/* Header + progress */}
      <div className="relative z-10 max-w-md mx-auto px-5 pt-safe">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={goBack}
            disabled={step === 0 || busy}
            aria-label="Back"
            className="w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-0 transition-opacity"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <ArrowLeft size={16} className="text-white" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}80)`,
              }}
            />
            <span className="font-semibold text-[13px] text-white">Paytree</span>
          </Link>
          <div className="w-11" />
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#666]">
            step {step + 1} of {total}
          </span>
          <span
            className="text-[10px] font-mono font-bold"
            style={{ color: accent }}
          >
            {progress}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={springs.standard}
            className="h-full"
            style={{
              background: accent,
              boxShadow: `0 0 10px ${accent}80`,
            }}
          />
        </div>
      </div>

      <main className="relative z-10 max-w-md mx-auto px-5 pt-6 pb-40">
        {/* Live preview — the whole point of the design. */}
        <LivePreview
          name={name}
          username={user.username}
          image={user.image}
          accent={accent}
          niche={niche}
          nicheCardTitle={nichePreview}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={springs.standard}
            className="mt-6"
          >
            {step === 0 && (
              <StepShell
                kicker="first thing"
                title="Your name."
                sub="Watch it land on your page."
              >
                <BigInput
                  data-testid="onboarding-name"
                  autoFocus
                  placeholder="Sara Rahman"
                  autoComplete="name"
                  enterKeyHint="next"
                  autoCapitalize="words"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && nameValid && next()
                  }
                />
              </StepShell>
            )}
            {step === 1 && (
              <StepShell
                kicker="pick a vibe"
                title="Your color."
                sub="Every glow, ring, and button re-tints instantly."
              >
                <div className="grid grid-cols-5 gap-3 mt-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.hex}
                      data-testid={`onboarding-accent-${a.hex.slice(1)}`}
                      onClick={() => setAccent(a.hex)}
                      aria-label={a.name}
                      className="relative aspect-square rounded-2xl transition-transform active:scale-[0.94]"
                      style={{
                        background: `linear-gradient(135deg, ${a.hex}, ${a.hex}66)`,
                        border:
                          accent === a.hex
                            ? `1.5px solid ${a.hex}`
                            : "0.5px solid rgba(255,255,255,0.1)",
                        boxShadow:
                          accent === a.hex
                            ? `0 0 24px ${a.hex}80, inset 0 1px 0 rgba(255,255,255,0.2)`
                            : "inset 0 1px 0 rgba(255,255,255,0.06)",
                      }}
                    >
                      {accent === a.hex && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={springs.snappy}
                          className="absolute inset-0 grid place-items-center"
                        >
                          <Check
                            size={16}
                            strokeWidth={3}
                            className="text-white"
                            style={{
                              filter: `drop-shadow(0 0 8px ${a.hex})`,
                            }}
                          />
                        </motion.span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center text-[12px] font-mono text-[#666]">
                  {ACCENTS.find((a) => a.hex === accent)?.name}
                </div>
              </StepShell>
            )}
            {step === 2 && (
              <StepShell
                kicker="you're a"
                title="What do you do?"
                sub="We'll seed your page with the right card."
              >
                <div className="mt-2 flex flex-col gap-2">
                  {NICHES.map((n) => {
                    const selected = niche === n.id
                    return (
                      <button
                        key={n.id}
                        data-testid={`onboarding-niche-${n.id}`}
                        onClick={() => setNiche(n.id)}
                        className="text-left flex items-center gap-3 rounded-2xl px-4 py-3 transition-transform active:scale-[0.98] relative overflow-hidden"
                        style={{
                          background: selected
                            ? `${accent}0F`
                            : "rgba(255,255,255,0.03)",
                          border: selected
                            ? `0.5px solid ${accent}66`
                            : "0.5px solid rgba(255,255,255,0.08)",
                          minHeight: 56,
                        }}
                      >
                        <span className="flex-1 text-[15px] font-semibold text-white">
                          {n.label}
                        </span>
                        {selected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springs.snappy}
                          >
                            <Check
                              size={16}
                              strokeWidth={3}
                              style={{ color: accent }}
                            />
                          </motion.span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </StepShell>
            )}
            {step === 3 && (
              <StepShell
                kicker="last step"
                title="Publish."
                sub="You can change everything after. Publish first, polish later."
              >
                <div
                  className="mt-2 rounded-2xl p-4 relative overflow-hidden"
                  style={{
                    background: `${accent}0A`,
                    border: `0.5px solid ${accent}55`,
                  }}
                >
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <BadgeCheck
                      size={13}
                      strokeWidth={2.75}
                      style={{ color: accent }}
                    />
                    <span
                      className="uppercase tracking-widest font-bold"
                      style={{ color: accent }}
                    >
                      ready
                    </span>
                  </div>
                  <div className="mt-2 text-white font-semibold text-[15px] break-all">
                    paytree.to/{user.username}
                  </div>
                  <div className="text-[12px] text-[#888] mt-1">
                    Your page will be live in 2 seconds.
                  </div>
                </div>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div
            className="mt-5 rounded-xl px-4 py-3 text-[13px] text-center"
            style={{
              background: "rgba(255,85,85,0.08)",
              border: "0.5px solid rgba(255,85,85,0.25)",
              color: "#ff5555",
            }}
          >
            {error}
          </div>
        )}
      </main>

      {/* Fixed CTA bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 pb-safe-12 px-4 pt-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,3,3,0) 0%, rgba(3,3,3,0.9) 40%, rgba(3,3,3,0.98) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <motion.button
            data-testid="onboarding-continue"
            onClick={next}
            disabled={!canAdvance || busy}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl text-black font-mono font-bold text-[15px] px-6 disabled:opacity-40"
            style={{
              background: accent,
              minHeight: 56,
              boxShadow: canAdvance ? `0 0 40px ${accent}66` : "none",
              cursor: canAdvance && !busy ? "pointer" : "not-allowed",
            }}
          >
            {saving ? (
              <>
                <motion.span
                  className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black/70 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                Publishing your page…
              </>
            ) : step < 3 ? (
              <>
                Continue
                <ArrowRight size={16} strokeWidth={2.75} />
              </>
            ) : (
              <>
                Publish my page
                <ArrowRight size={16} strokeWidth={2.75} />
              </>
            )}
          </motion.button>
          {step < 3 && (
            <button
              data-testid="onboarding-skip"
              onClick={skipToDashboard}
              disabled={busy}
              className="text-[12px] font-mono text-[#666] py-2 disabled:opacity-40"
              // Copy intentionally matches the previous flow so muscle
              // memory + any external docs / screenshots still make sense.
              aria-label="Skip and go to dashboard"
            >
              {skipping ? "Skipping…" : "Skip and go to dashboard"}
            </button>
          )}
        </div>
      </div>
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
      <h1 className="text-[28px] font-bold text-white leading-[1.05]">
        {title}
      </h1>
      <p className="mt-2 text-[13px] text-[#888]">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

function BigInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      // 16px minimum kills iOS auto-zoom on focus; the 20px visual size
      // comes from font-weight + tracking, not fontSize.
      className="w-full bg-transparent text-white text-[20px] font-semibold outline-none placeholder:text-[#444]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: "18px",
        minHeight: 60,
        fontSize: 20,
        ...(props.style ?? {}),
      }}
    />
  )
}

/* Live phone preview — every state change re-shapes it so the user
   physically watches their page get built as they answer. */
function LivePreview({
  name,
  username,
  image,
  accent,
  niche,
  nicheCardTitle,
}: {
  name: string
  username: string
  image: string | null
  accent: string
  niche: string | null
  nicheCardTitle: string
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || username[0]?.toUpperCase() || "?"
  const nameValid = name.trim().length >= 2

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex items-center gap-1.5">
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
        />
        <span
          className="text-[10px] font-mono uppercase tracking-widest"
          style={{ color: accent }}
        >
          building your page
        </span>
      </div>

      <div
        className="relative"
        style={{
          width: 240,
          height: 320,
          borderRadius: 36,
          padding: 6,
          background:
            "linear-gradient(180deg, #1c1c1c 0%, #0a0a0a 40%, #000 100%)",
          boxShadow: `0 30px 60px rgba(0,0,0,0.6), 0 0 40px ${accent}18`,
        }}
      >
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 h-3.5 w-14 rounded-full"
          style={{ background: "#000" }}
        />
        <div
          className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: 30,
            background: `radial-gradient(circle at 50% 12%, ${accent}18 0%, transparent 55%), #050505`,
          }}
        >
          <div className="flex items-center justify-center gap-1 pt-4 pb-1">
            <span className="text-[8px] font-mono text-[#555]">paytree.to/</span>
            <span
              className="text-[9px] font-mono font-bold"
              style={{ color: accent }}
            >
              {username}
            </span>
          </div>

          <div className="flex flex-col items-center pt-2">
            <motion.div
              animate={{
                boxShadow: nameValid
                  ? `0 0 0 3px ${accent}20, 0 0 20px ${accent}55`
                  : "0 0 0 3px rgba(255,255,255,0.05)",
              }}
              transition={{ duration: 0.3 }}
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold text-white"
              style={{
                border: `1.5px solid ${nameValid ? accent : "rgba(255,255,255,0.15)"}80`,
                background: image
                  ? undefined
                  : nameValid
                    ? `linear-gradient(135deg, ${accent} 0%, #0a0a0a 100%)`
                    : "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
              }}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={initials}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={springs.snappy}
                  >
                    {initials}
                  </motion.span>
                </AnimatePresence>
              )}
            </motion.div>

            <div className="mt-2 h-4 flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={name || "empty"}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={springs.snappy}
                  className="text-white text-[12px] font-bold"
                >
                  {name || "Your name"}
                </motion.div>
              </AnimatePresence>
            </div>
            <div
              className="text-[8px] font-mono mt-0.5"
              style={{ color: accent }}
            >
              @{username}
            </div>
          </div>

          <div className="mt-3 px-3 flex flex-col gap-1.5">
            <motion.div
              animate={{
                opacity: nameValid ? 1 : 0.4,
                borderColor: nameValid ? `${accent}60` : "rgba(255,255,255,0.06)",
              }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 relative overflow-hidden"
              style={{
                background: nameValid ? `${accent}10` : "rgba(255,255,255,0.02)",
                border: "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-4 h-4 rounded"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}44)`,
                }}
              />
              <span className="text-[9px] text-white/85 font-semibold truncate">
                {niche ? nicheCardTitle : "Your first link"}
              </span>
              {niche && (
                <span
                  className="ml-auto text-[7px] font-mono font-bold rounded px-1.5 py-0.5"
                  style={{ background: accent, color: "#000" }}
                >
                  BUY
                </span>
              )}
            </motion.div>

            <motion.div
              animate={{ opacity: niche ? 1 : 0.35 }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="w-4 h-4 rounded bg-white/[0.06]" />
              <span className="text-[9px] text-white/80 font-medium">
                Free intro PDF
              </span>
            </motion.div>

            <motion.div
              animate={{ opacity: niche ? 1 : 0.25 }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="w-4 h-4 rounded bg-white/[0.06]" />
              <span className="text-[9px] text-white/75 font-medium">
                AI agent · online
              </span>
              <span
                className="ml-auto w-1.5 h-1.5 rounded-full"
                style={{ background: accent }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
