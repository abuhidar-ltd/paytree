"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

/**
 * The publish moment. Shown once right after /api/publish succeeds — this is
 * the moment the creator screenshots and shares on TikTok, so it has to feel
 * earned: confetti burst, spring-in card, live URL front and center with a
 * one-tap copy.
 */

const CONFETTI_COLORS = ["#00ff88", "#f59e0b", "#378add", "#9146ff", "#f0f0f0"]
const CONFETTI_COUNT = 42

interface Particle {
  x: number       // launch x offset (vw units)
  drift: number   // horizontal drift while falling
  delay: number
  duration: number
  size: number
  color: string
  rotate: number
}

function makeParticles(): Particle[] {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x: Math.random() * 100,
    drift: (Math.random() - 0.5) * 30,
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.6,
    size: 5 + Math.random() * 7,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotate: 360 + Math.random() * 540,
  }))
}

interface PublishCelebrationProps {
  open: boolean
  username: string
  onClose: () => void
}

export function PublishCelebration({ open, username, onClose }: PublishCelebrationProps) {
  return (
    <AnimatePresence>
      {open && <CelebrationOverlay username={username} onClose={onClose} />}
    </AnimatePresence>
  )
}

// Inner overlay owns copied-state and particles; unmounting on close resets
// both, so reopening never shows a stale "Copied" or replays old confetti.
function CelebrationOverlay({ username, onClose }: { username: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const particles = useMemo(() => makeParticles(), [])

  const liveUrl = `https://paytree.to/${username}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard blocked (some WebViews) — select-able text is still there.
    }
  }

  return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: "rgba(3,3,3,0.85)", backdropFilter: "blur(12px)" }}
          data-testid="publish-celebration"
        >
          {/* Confetti layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            {particles.map((p, i) => (
              <motion.div
                key={i}
                initial={{ x: `${p.x}vw`, y: "-4vh", rotate: 0, opacity: 1 }}
                animate={{
                  y: "108vh",
                  x: `${p.x + p.drift}vw`,
                  rotate: p.rotate,
                  opacity: [1, 1, 0.9, 0],
                }}
                transition={{ delay: p.delay, duration: p.duration, ease: "easeIn" }}
                style={{
                  position: "absolute",
                  width: p.size,
                  height: p.size * 0.45,
                  borderRadius: 1.5,
                  background: p.color,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="relative w-full max-w-sm rounded-2xl p-7 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(0,255,136,0.25)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 64px rgba(0,255,136,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                pointerEvents: "none",
                background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.35) 50%, transparent)",
              }}
            />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.15 }}
              className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0,255,136,0.1)",
                border: "2px solid rgba(0,255,136,0.35)",
                boxShadow: "0 0 40px rgba(0,255,136,0.3)",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
                <motion.path
                  d="M5 13l4 4L19 7"
                  stroke="#00ff88"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.35 }}
                />
              </svg>
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-1.5">Your page is live.</h2>
            <p className="text-sm text-[#888] mb-6">Drop the link in your bio and start earning.</p>

            <div
              className="rounded-xl px-4 py-3 mb-4 font-mono text-sm text-[#e0e0e0] select-all break-all"
              style={{
                background: "rgba(0,255,136,0.06)",
                border: "0.5px solid rgba(0,255,136,0.2)",
              }}
            >
              paytree.to/{username}
            </div>

            <button
              onClick={handleCopy}
              className="w-full bg-[#00ff88] text-black font-mono font-bold text-sm rounded-xl active:scale-[0.97] transition-transform"
              style={{ minHeight: 52 }}
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>

            <div className="flex items-center justify-center gap-5 mt-4">
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-[#888] hover:text-white transition-colors"
                style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}
              >
                View page ↗
              </a>
              <button
                onClick={onClose}
                className="text-xs font-mono text-[#555] hover:text-[#888] transition-colors"
                style={{ minHeight: 44 }}
              >
                Back to dashboard
              </button>
            </div>
          </motion.div>
        </motion.div>
  )
}
