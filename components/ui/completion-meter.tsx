"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

/**
 * Profile completion meter — a slim % bar that expands into a punch list.
 * Each missing item deep-links to the screen that fixes it. Hidden at 100%.
 */

export interface CompletionInput {
  hasPhoto: boolean
  hasBio: boolean
  hasThreeCards: boolean
  stripeConnected: boolean
  published: boolean
}

interface CompletionMeterProps {
  input: CompletionInput
  onAddCard: () => void
  onPublish: () => void
}

export function CompletionMeter({ input, onAddCard, onPublish }: CompletionMeterProps) {
  const [expanded, setExpanded] = useState(false)

  const items = [
    { label: "Add a profile photo", done: input.hasPhoto, href: "/dashboard/studio" },
    { label: "Write a bio", done: input.hasBio, href: "/dashboard/studio" },
    { label: "Add 3+ cards", done: input.hasThreeCards, action: onAddCard },
    { label: "Connect Stripe to get paid", done: input.stripeConnected, href: "/dashboard/payments" },
    { label: "Publish your page", done: input.published, action: onPublish },
  ]

  const doneCount = items.filter((i) => i.done).length
  const percent = Math.round((doneCount / items.length) * 100)

  if (percent === 100) return null

  return (
    <div
      className="mb-4 rounded-xl relative max-w-[800px] mx-auto"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
      data-testid="completion-meter"
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#444] flex-shrink-0">
          Profile
        </span>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 24 }}
            className="h-full rounded-full"
            style={{ background: "#00ff88", boxShadow: "0 0 8px rgba(0,255,136,0.5)" }}
          />
        </div>
        <span className="text-[11px] font-mono text-[#00ff88] flex-shrink-0">{percent}%</span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-[#444] flex-shrink-0">
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex flex-col gap-1">
              {items.map((item) => {
                const inner = (
                  <span className="flex items-center gap-2.5 py-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        border: item.done ? "1px solid rgba(0,255,136,0.5)" : "1px solid rgba(255,255,255,0.15)",
                        background: item.done ? "rgba(0,255,136,0.15)" : "transparent",
                      }}
                    >
                      {item.done && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="#00ff88" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color: item.done ? "#444" : "#c0c0c0",
                        textDecoration: item.done ? "line-through" : "none",
                        textDecorationColor: "rgba(255,255,255,0.2)",
                      }}
                    >
                      {item.label}
                    </span>
                    {!item.done && <span className="text-[10px] font-mono text-[#00ff88] ml-auto">→</span>}
                  </span>
                )

                if (item.done) return <div key={item.label}>{inner}</div>
                return item.href ? (
                  <Link key={item.label} href={item.href} className="block hover:bg-white/[0.03] rounded-lg px-1 -mx-1 transition-colors">
                    {inner}
                  </Link>
                ) : (
                  <button key={item.label} onClick={item.action} className="block w-full text-left hover:bg-white/[0.03] rounded-lg px-1 -mx-1 transition-colors">
                    {inner}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
