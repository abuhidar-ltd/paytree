"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useStorageFlag } from "@/lib/use-storage-flag"

/**
 * "3 steps to go live" — the first-five-minutes guide for new accounts.
 *
 * 12 accounts → 5 added a card → ~0 published last week. Each step checks
 * off live from real data (no separate progress state to drift), the current
 * step glows #00ff88, and the card is dismissible once everything is done.
 * Dismissal is per-account in localStorage.
 */

export interface ChecklistState {
  addedCard: boolean
  madeItYours: boolean
  published: boolean
}

interface GoLiveChecklistProps {
  userId: string
  state: ChecklistState
  onAddCard: () => void
  onPublish: () => void
  publishing: boolean
}

const dismissKey = (userId: string) => `pt_golive_dismissed_${userId}`

export function GoLiveChecklist({ userId, state, onAddCard, onPublish, publishing }: GoLiveChecklistProps) {
  // serverFallback=true hides the card during SSR; the client reads the real
  // dismissal on first render (no flash, no effect-driven setState).
  const [dismissed, setDismissed] = useStorageFlag(dismissKey(userId), true)

  const steps = [
    {
      label: "Add your first card",
      hint: "A link, a product, anything",
      done: state.addedCard,
      action: onAddCard,
      actionLabel: "Add card",
    },
    {
      label: "Make it yours",
      hint: "Photo, bio, colors",
      done: state.madeItYours,
      href: "/dashboard/studio",
      actionLabel: "Open design",
    },
    {
      label: "Publish & copy your link",
      hint: "Free — no card required",
      done: state.published,
      action: onPublish,
      actionLabel: publishing ? "Publishing..." : "Publish now",
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length
  const currentIndex = steps.findIndex((s) => !s.done)

  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="mb-4 rounded-2xl p-4 sm:p-5 relative max-w-[800px] mx-auto"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
        data-testid="go-live-checklist"
      >
        <div
          aria-hidden
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            pointerEvents: "none",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
          }}
        />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#444]">
              {allDone ? "You're live" : "3 steps to go live"}
            </span>
            <span className="text-[10px] font-mono text-[#00ff88]">{doneCount}/3</span>
          </div>
          {allDone && (
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss checklist"
              className="text-[#444] hover:text-[#888] transition-colors -m-2 p-2"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {steps.map((step, i) => {
            const isCurrent = i === currentIndex
            const row = (
              <div
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                style={{
                  background: isCurrent ? "rgba(0,255,136,0.05)" : "transparent",
                  border: isCurrent
                    ? "0.5px solid rgba(0,255,136,0.2)"
                    : "0.5px solid transparent",
                }}
              >
                {/* Check circle */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background: step.done ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.04)",
                    border: step.done
                      ? "1.5px solid rgba(0,255,136,0.5)"
                      : isCurrent
                        ? "1.5px solid rgba(0,255,136,0.35)"
                        : "1.5px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {step.done ? (
                    <motion.svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <path d="M5 13l4 4L19 7" stroke="#00ff88" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  ) : (
                    <span
                      className="text-[10px] font-mono font-bold"
                      style={{ color: isCurrent ? "#00ff88" : "#444" }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium leading-tight"
                    style={{
                      color: step.done ? "#555" : isCurrent ? "#f0f0f0" : "#888",
                      textDecoration: step.done ? "line-through" : "none",
                      textDecorationColor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-[#444] leading-tight mt-0.5">{step.hint}</p>
                </div>

                {!step.done && isCurrent && (
                  <span
                    className="flex-shrink-0 text-[11px] font-mono font-semibold rounded-lg px-3 py-2"
                    style={{ background: "#00ff88", color: "#000" }}
                  >
                    {step.actionLabel} →
                  </span>
                )}
              </div>
            )

            // Whole row is tappable for the current step; completed/future rows are inert.
            if (!step.done && isCurrent) {
              return step.href ? (
                <Link key={step.label} href={step.href} className="block active:scale-[0.99] transition-transform">
                  {row}
                </Link>
              ) : (
                <button
                  key={step.label}
                  onClick={step.action}
                  disabled={publishing}
                  className="block w-full text-left active:scale-[0.99] transition-transform disabled:opacity-60"
                >
                  {row}
                </button>
              )
            }
            return <div key={step.label}>{row}</div>
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
