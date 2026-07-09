"use client"

/**
 * TEMPORARY "payments back soon" UI — shown on money-movement surfaces while
 * Stripe reviews our live Connect application. See lib/payments-live.ts for the
 * single toggle that turns all of this off. Obsidian glass, calm not alarming.
 *
 * Gold #FFD60A is a deliberate STATUS colour — intentionally distinct from the
 * block-type accents (drop=green, vault=amber #f59e0b, product=blue, video=red)
 * so it reads as "notice", never as a normal card.
 */
import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import { PAYMENTS_MAINTENANCE } from "@/lib/payments-live"

const GOLD = "#FFD60A"
const GOLD_BG = "rgba(255,214,10,0.10)"
const GOLD_BORDER = "rgba(255,214,10,0.28)"
const GOLD_GLOW = "0 0 24px rgba(255,214,10,0.14)"

/**
 * Rotated corner sticker. Drop it into any `relative` parent with absolute
 * positioning (e.g. `className="absolute top-2 right-2"`).
 */
export function PaymentsMaintenanceSticker({
  short = false,
  className = "",
}: {
  short?: boolean
  className?: string
}) {
  return (
    <motion.span
      initial={{ opacity: 0, rotate: -14, scale: 0.82 }}
      animate={{ opacity: 1, rotate: -8, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 18 }}
      className={`inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md select-none pointer-events-none ${className}`}
      style={{
        background: GOLD,
        color: "#0a0a0a",
        boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
        transformOrigin: "center",
      }}
    >
      {short ? PAYMENTS_MAINTENANCE.stickerShort : PAYMENTS_MAINTENANCE.sticker}
    </motion.span>
  )
}

/**
 * Non-clickable gold status pill — the drop-in replacement for a Buy / Tip /
 * Unlock / Connect button while payments are paused. Looks deliberate, not
 * disabled or broken.
 */
export function PaymentsMaintenancePill({
  label,
  fullWidth = true,
  className = "",
}: {
  label?: string
  fullWidth?: boolean
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="status"
      aria-label={`${PAYMENTS_MAINTENANCE.title}. ${PAYMENTS_MAINTENANCE.body}`}
      className={`${fullWidth ? "flex w-full" : "inline-flex"} items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-mono font-semibold cursor-default select-none ${className}`}
      style={{
        background: GOLD_BG,
        border: `0.5px solid ${GOLD_BORDER}`,
        color: GOLD,
        boxShadow: GOLD_GLOW,
      }}
    >
      <Clock size={14} className="opacity-90" />
      {label ?? PAYMENTS_MAINTENANCE.pill}
    </motion.div>
  )
}

/**
 * Fuller notice — sticker + title + one calming line. Used where there's room
 * for a sentence (the Connect area, editor panels). `body` can be overridden,
 * e.g. to reassure a creator their draft is safe.
 */
export function PaymentsMaintenanceNotice({
  body = PAYMENTS_MAINTENANCE.body,
  className = "",
}: {
  body?: string
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="status"
      className={`rounded-xl px-3.5 py-3 ${className}`}
      style={{ background: GOLD_BG, border: `0.5px solid ${GOLD_BORDER}` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <PaymentsMaintenanceSticker />
        <span className="text-xs font-mono font-semibold" style={{ color: GOLD }}>
          {PAYMENTS_MAINTENANCE.title}
        </span>
      </div>
      <p className="text-[11px] text-[#c9c9d1] leading-relaxed">{body}</p>
    </motion.div>
  )
}
