"use client"

// Manage panel for manual plan grants — the one interactive island in /admin.
// Renders inside a server-side Card on the user detail page; all validation
// and authorization live in the server actions, this is presentation only.

import { useActionState, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { grantPlanAction, revokePlanAction, type PlanActionState } from "./actions"

const spring = { type: "spring", stiffness: 300, damping: 28 } as const

const PLAN_OPTIONS = [
  { id: "pro", label: "Pro" },
  { id: "ultra", label: "Ultra" },
]

const DURATION_OPTIONS = [
  { id: "1m", label: "1 month" },
  { id: "3m", label: "3 months" },
  { id: "6m", label: "6 months" },
  { id: "12m", label: "1 year" },
  { id: "lifetime", label: "Lifetime" },
]

const inputCls =
  "bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#f0f0f0] outline-none focus:border-[#00ff88]/40"

export function PlanManager({
  userId,
  currentPlan,
  isComped,
  compedExpiresAt,
  compedReason,
  compedBy,
  hasStripeSubscription,
}: {
  userId: string
  currentPlan: string
  isComped: boolean
  compedExpiresAt: string | null // ISO string — server components pass serializable props
  compedReason: string | null
  compedBy: string | null
  hasStripeSubscription: boolean
}) {
  const [grantState, grantAction, granting] = useActionState<PlanActionState, FormData>(grantPlanAction, null)
  const [revokeState, revokeAction, revoking] = useActionState<PlanActionState, FormData>(revokePlanAction, null)
  // Show the feedback of whichever action ran LAST — both hook states persist,
  // so `grantState ?? revokeState` would hide every revoke result after the
  // first successful grant.
  const [lastAction, setLastAction] = useState<"grant" | "revoke" | null>(null)
  const feedback = lastAction === "revoke" ? revokeState : lastAction === "grant" ? grantState : null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      {/* Current state */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono">
        <span className="text-[#b0b0b0]">Current plan:</span>
        <span className="text-white font-bold uppercase">{currentPlan}</span>
        {isComped ? (
          <span className="text-[#f59e0b] border border-[#f59e0b]/30 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-widest">
            comped
          </span>
        ) : null}
        {isComped ? (
          <span className="text-[#c9c9d1]">
            {compedExpiresAt ? `until ${compedExpiresAt.slice(0, 10)}` : "lifetime"}
            {compedBy ? ` · by ${compedBy}` : ""}
            {compedReason ? ` · “${compedReason}”` : ""}
          </span>
        ) : null}
      </div>

      {hasStripeSubscription ? (
        <p className="text-xs font-mono text-[#f59e0b] mb-4">
          This user has a live Stripe subscription — plan changes belong in Stripe, so granting is
          disabled here.
        </p>
      ) : (
        <form action={grantAction} onSubmit={() => setLastAction("grant")} className="flex flex-wrap items-end gap-3 mb-4">
          <input type="hidden" name="userId" value={userId} />
          <Field label="Grant plan">
            <select name="plan" defaultValue="ultra" className={inputCls}>
              {PLAN_OPTIONS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#080808]">
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration">
            <select name="duration" defaultValue="3m" className={inputCls}>
              {DURATION_OPTIONS.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#080808]">
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reason (required)">
            <input
              type="text"
              name="reason"
              required
              minLength={3}
              maxLength={500}
              placeholder="partnership / support gesture / friend"
              className={`${inputCls} w-64`}
            />
          </Field>
          <motion.button
            type="submit"
            disabled={granting}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className="rounded-lg px-4 py-2 text-xs font-mono font-bold text-black bg-[#00ff88] cursor-pointer disabled:opacity-40"
          >
            {granting ? "Granting…" : "Grant plan"}
          </motion.button>
        </form>
      )}

      {isComped ? (
        <form
          action={revokeAction}
          onSubmit={(e) => {
            if (!window.confirm("Revoke this comped plan? The user reverts to Free immediately.")) {
              e.preventDefault()
              return
            }
            setLastAction("revoke")
          }}
        >
          <input type="hidden" name="userId" value={userId} />
          <motion.button
            type="submit"
            disabled={revoking}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className="rounded-lg px-4 py-2 text-xs font-mono font-bold text-[#ff5555] border border-[#ff5555]/30 hover:bg-[#ff5555]/10 cursor-pointer disabled:opacity-40"
          >
            {revoking ? "Revoking…" : "Revoke comp → Free"}
          </motion.button>
        </form>
      ) : null}

      <AnimatePresence>
        {feedback ? (
          <motion.p
            key={feedback.message}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className={`text-xs font-mono mt-4 ${feedback.ok ? "text-[#00ff88]" : "text-[#ff5555]"}`}
          >
            {feedback.message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-mono uppercase tracking-widest text-[#b0b0b0]">{label}</label>
      {children}
    </div>
  )
}
