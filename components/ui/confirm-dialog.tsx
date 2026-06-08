"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const spring = { type: "spring" as const, stiffness: 320, damping: 28 }

export function ConfirmDialog({
  open,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, loading, onCancel])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={loading ? undefined : onCancel}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        >
          <motion.div
            key="confirm-card"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="relative w-full max-w-md p-6 overflow-hidden"
            style={{
              background: "#0a0a0a",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            {/* Reflection */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
              }}
            />

            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                <AlertTriangle size={18} className="text-[#f59e0b]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="confirm-title" className="text-sm font-semibold text-white">
                  {title}
                </h2>
                <p
                  id="confirm-desc"
                  className="text-xs font-mono text-[#888] mt-1.5 leading-relaxed"
                >
                  {description}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 text-xs font-mono px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  color: "#e0e0e0",
                }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 text-xs font-mono font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                style={
                  destructive
                    ? {
                        background: "rgba(255,85,85,0.1)",
                        border: "0.5px solid rgba(255,85,85,0.35)",
                        color: "#ff7777",
                      }
                    : {
                        background: "#00ff88",
                        border: "0.5px solid rgba(0,255,136,0.4)",
                        color: "#030303",
                      }
                }
              >
                {loading ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
