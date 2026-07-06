"use client"

// "Have a promo code?" — collapsed link that expands into a one-field redeem
// form. Used in Settings (billing section) and on /pricing near the plan
// cards. All validation happens server-side in /api/promo/redeem.

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const spring = { type: "spring", stiffness: 300, damping: 28 } as const

const PLAN_NAMES: Record<string, string> = { pro: "Pro", ultra: "Ultra" }

export function PromoRedeem({
  onSuccess,
  className = "",
}: {
  /** Called after a successful redemption so the parent can refresh plan state. */
  onSuccess?: () => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        const plan = PLAN_NAMES[data.plan] ?? data.plan
        setSuccess(
          data.expiresAt
            ? `You now have ${plan} until ${new Date(data.expiresAt).toLocaleDateString()} 🎉`
            : `You now have ${plan} forever 🎉`
        )
        onSuccess?.()
      } else {
        setError(data.error || "Invalid or expired code")
      }
    } catch {
      setError("Network error — please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={className}>
      {success ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="text-sm font-mono text-[#00ff88]"
        >
          {success}
        </motion.p>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-mono text-[#00ff88] hover:underline cursor-pointer"
        >
          Have a promo code?
        </button>
      ) : (
        <AnimatePresence>
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-2 sm:items-center"
          >
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setError(null)
              }}
              placeholder="Enter promo code"
              autoFocus
              maxLength={40}
              className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm font-mono text-[#f0f0f0] uppercase outline-none focus:border-[#00ff88]/40 min-h-[44px] w-full sm:w-56 placeholder:normal-case placeholder:text-[#666]"
            />
            <motion.button
              type="submit"
              disabled={submitting || !code.trim()}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              className="rounded-xl px-5 py-2.5 text-sm font-mono font-bold text-black bg-[#00ff88] cursor-pointer disabled:opacity-40 min-h-[44px]"
            >
              {submitting ? "Redeeming…" : "Redeem"}
            </motion.button>
          </motion.form>
        </AnimatePresence>
      )}
      <AnimatePresence>
        {error ? (
          <motion.p
            key={error}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className="text-xs font-mono text-[#ff5555] mt-2"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
