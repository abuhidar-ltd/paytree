"use client"

// Create form for promo codes — the interactive island on /admin/promo-codes.
// Validation and authorization live in the server action; this is presentation.

import { useActionState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPromoCodeAction, type PromoActionState } from "./actions"

const spring = { type: "spring", stiffness: 300, damping: 28 } as const

const PLAN_OPTIONS = [
  { id: "pro", label: "Pro" },
  { id: "ultra", label: "Ultra" },
]

const DURATION_OPTIONS = [
  { id: "7", label: "7 days" },
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "180", label: "180 days" },
  { id: "365", label: "365 days" },
  { id: "lifetime", label: "Lifetime" },
]

const inputCls =
  "bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#f0f0f0] outline-none focus:border-[#00ff88]/40"

// Client-side twin of lib/promo.ts generatePromoCode — same unambiguous
// alphabet (no 0/O, 1/I/L), suggestion only, uniqueness enforced on create.
function suggestCode(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  let suffix = ""
  for (let i = 0; i < 4; i++) suffix += alphabet[bytes[i] % alphabet.length]
  return `PAYTREE-${suffix}`
}

export function PromoCodeForm() {
  const [state, action, pending] = useActionState<PromoActionState, FormData>(
    createPromoCodeAction,
    null
  )
  const codeRef = useRef<HTMLInputElement>(null)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      <form action={action} className="flex flex-wrap items-end gap-3">
        <Field label="Code">
          <div className="flex gap-1.5">
            <input
              ref={codeRef}
              type="text"
              name="code"
              required
              placeholder="LAUNCH50"
              maxLength={40}
              className={`${inputCls} w-44 uppercase`}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase()
              }}
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={spring}
              onClick={() => {
                if (codeRef.current) codeRef.current.value = suggestCode()
              }}
              className="rounded-lg px-2.5 py-2 text-xs font-mono text-[#00ff88] border border-[#00ff88]/30 hover:bg-[#00ff88]/10 cursor-pointer whitespace-nowrap"
              title="Suggest a random code"
            >
              ⚄ Generate
            </motion.button>
          </div>
        </Field>
        <Field label="Plan">
          <select name="plan" defaultValue="pro" className={inputCls}>
            {PLAN_OPTIONS.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#080808]">
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duration">
          <select name="duration" defaultValue="30" className={inputCls}>
            {DURATION_OPTIONS.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#080808]">
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Max uses (blank = ∞)">
          <input type="number" name="maxRedemptions" min={1} placeholder="∞" className={`${inputCls} w-24`} />
        </Field>
        <Field label="Code expiry (optional)">
          <input type="date" name="expiresAt" className={`${inputCls} [color-scheme:dark]`} />
        </Field>
        <Field label="Note (internal)">
          <input
            type="text"
            name="note"
            maxLength={500}
            placeholder="TikTok giveaway"
            className={`${inputCls} w-48`}
          />
        </Field>
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={spring}
          className="rounded-lg px-4 py-2 text-xs font-mono font-bold text-black bg-[#00ff88] cursor-pointer disabled:opacity-40"
        >
          {pending ? "Creating…" : "Create code"}
        </motion.button>
      </form>

      <AnimatePresence>
        {state ? (
          <motion.p
            key={state.message}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className={`text-xs font-mono mt-4 ${state.ok ? "text-[#00ff88]" : "text-[#ff5555]"}`}
          >
            {state.message}
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
