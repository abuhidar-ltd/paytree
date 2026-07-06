"use client"

import { useActionState, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  createAffiliateAction,
  updateAffiliateAction,
  regenerateAffiliateSlugAction,
  type AffiliateActionState,
} from "./actions"

const spring = { type: "spring", stiffness: 300, damping: 28 } as const

const inputCls =
  "bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#f0f0f0] outline-none focus:border-[#00ff88]/40"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-mono uppercase tracking-widest text-[#b0b0b0]">{label}</label>
      {children}
      {hint ? <p className="text-[10px] font-mono text-[#909090] mt-0.5">{hint}</p> : null}
    </div>
  )
}

function Feedback({ state }: { state: AffiliateActionState }) {
  return (
    <AnimatePresence>
      {state ? (
        <motion.p
          key={state.message}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={spring}
          className={`text-xs font-mono mt-3 ${state.ok ? "text-[#00ff88]" : "text-[#ff5555]"}`}
        >
          {state.message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}

// ─── Create ─────────────────────────────────────────────────────────────────

function slugPreview(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

export function CreateAffiliateForm() {
  const [state, action, pending] = useActionState<AffiliateActionState, FormData>(
    createAffiliateAction,
    null
  )
  const [name, setName] = useState("")
  const [slugOverride, setSlugOverride] = useState("")
  const autoSlug = useMemo(() => slugPreview(name), [name])

  return (
    <form action={action} className="grid gap-5 max-w-lg">
      <Field label="Partner name" hint="Shown in admin only — not on the referral URL.">
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sara Al-Ahmad"
          className={inputCls}
        />
      </Field>

      <Field
        label="Slug"
        hint={
          slugOverride
            ? "Manual override — must be lowercase letters, digits, dashes."
            : `Auto-generated: ${autoSlug || "—"} — leave blank to use it, or type to override.`
        }
      >
        <div className="flex gap-2 items-center">
          <span className="text-xs font-mono text-[#b0b0b0]">paytree.to/?ref=</span>
          <input
            name="slug"
            type="text"
            maxLength={40}
            value={slugOverride}
            onChange={(e) => setSlugOverride(e.target.value)}
            placeholder={autoSlug}
            className={`${inputCls} flex-1`}
          />
        </div>
      </Field>

      <Field label="Commission %" hint="0 – 100, applied to each referred paid user's MRR.">
        <input
          name="commissionPercent"
          type="number"
          required
          min={0}
          max={100}
          step={0.5}
          defaultValue={20}
          className={`${inputCls} w-32`}
        />
      </Field>

      <div>
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={spring}
          className="rounded-lg px-4 py-2 text-xs font-mono font-bold text-black bg-[#00ff88] cursor-pointer disabled:opacity-40"
        >
          {pending ? "Creating…" : "Create affiliate"}
        </motion.button>
        <Feedback state={state} />
      </div>
    </form>
  )
}

// ─── Edit (commission + active) ────────────────────────────────────────────

export function EditAffiliateForm({
  id,
  initialCommission,
  initialActive,
}: {
  id: string
  initialCommission: number
  initialActive: boolean
}) {
  const [state, action, pending] = useActionState<AffiliateActionState, FormData>(
    updateAffiliateAction,
    null
  )
  return (
    <form action={action} className="grid gap-4 max-w-md">
      <input type="hidden" name="id" value={id} />
      <Field label="Commission %">
        <input
          name="commissionPercent"
          type="number"
          required
          min={0}
          max={100}
          step={0.5}
          defaultValue={initialCommission}
          className={`${inputCls} w-32`}
        />
      </Field>
      <Field label="Active" hint="Paused affiliates stop new attributions immediately.">
        <label className="inline-flex items-center gap-2 text-xs text-[#f0f0f0]">
          <input type="checkbox" name="active" defaultChecked={initialActive} className="accent-[#00ff88]" />
          Referrals attribute to this partner
        </label>
      </Field>
      <div>
        <motion.button
          type="submit"
          disabled={pending}
          whileTap={{ scale: 0.97 }}
          transition={spring}
          className="rounded-lg px-4 py-2 text-xs font-mono font-bold text-black bg-[#00ff88] cursor-pointer disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save"}
        </motion.button>
        <Feedback state={state} />
      </div>
    </form>
  )
}

// ─── Regenerate slug (destructive) ─────────────────────────────────────────

export function RegenerateSlugForm({ id, currentSlug }: { id: string; currentSlug: string }) {
  const [state, action, pending] = useActionState<AffiliateActionState, FormData>(
    regenerateAffiliateSlugAction,
    null
  )
  const [open, setOpen] = useState(false)

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-mono text-[#f59e0b] hover:text-[#f59e0b]/80 underline decoration-dotted"
        >
          Change slug…
        </button>
      ) : (
        <form
          action={action}
          onSubmit={(e) => {
            const confirmed = window.confirm(
              `Changing the slug from "${currentSlug}" to a new value will BREAK every existing referral link the partner has shared. Continue?`
            )
            if (!confirmed) e.preventDefault()
          }}
          className="grid gap-3 mt-2 p-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/[0.03]"
        >
          <input type="hidden" name="id" value={id} />
          <p className="text-[11px] font-mono text-[#f59e0b] leading-relaxed">
            ⚠ This rewrites <code className="bg-white/[0.06] px-1 rounded">/?ref={currentSlug}</code>.
            Existing links stop attributing immediately.
          </p>
          <Field label="New slug">
            <input
              name="newSlug"
              type="text"
              required
              maxLength={40}
              placeholder={currentSlug}
              className={inputCls}
            />
          </Field>
          <div className="flex gap-2">
            <motion.button
              type="submit"
              disabled={pending}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              className="rounded-lg px-4 py-2 text-xs font-mono font-bold text-black bg-[#f59e0b] cursor-pointer disabled:opacity-40"
            >
              {pending ? "Changing…" : "Change slug"}
            </motion.button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-xs font-mono text-[#c9c9d1] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <Feedback state={state} />
        </form>
      )}
    </div>
  )
}

// ─── Copy-to-clipboard button (used for referral + stats links) ────────────

export function CopyLinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Copy failed — select and copy manually")
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#b0b0b0]">{label}</span>
      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2">
        <code className="flex-1 text-xs font-mono text-[#f0f0f0] break-all">{url}</code>
        <button
          type="button"
          onClick={copy}
          className="rounded-md px-3 py-1 text-[11px] font-mono font-bold bg-[#00ff88] text-black hover:brightness-110 transition-all flex-shrink-0"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}
