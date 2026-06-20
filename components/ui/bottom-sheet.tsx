"use client"

import { AnimatePresence, motion, type PanInfo } from "framer-motion"
import { useEffect } from "react"

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** Optional title shown above the content area. */
  title?: string
  /**
   * Vertical size cap — defaults to 85vh so the top of the sheet always
   * stays clear of the dynamic island / notch. Pass "auto" for content-fit.
   */
  maxHeight?: string
  /**
   * If true, the sheet renders full-height (95vh) and behaves like a sticky
   * page (search pickers, add-card flow). Default false = standard sheet.
   */
  fullHeight?: boolean
  children: React.ReactNode
}

/**
 * iOS-style modal bottom sheet. Use this instead of centered dialogs on
 * mobile — taps anywhere on the backdrop close, and the user can drag the
 * handle downward to dismiss. Drops back into spring on release.
 *
 * On desktop (>= sm) it still slides up from the bottom — the larger viewport
 * makes it feel like a sticky bottom drawer, which is consistent enough.
 * If you want a centered desktop dialog, use `confirm-dialog.tsx` instead.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  maxHeight = "85vh",
  fullHeight = false,
  children,
}: BottomSheetProps) {
  // Lock body scroll while open — prevents the page underneath from
  // scrolling when the user swipes inside the sheet.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Esc-to-close so the sheet is keyboard-accessible on desktop.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  function onDragEnd(_: unknown, info: PanInfo) {
    // Threshold: 120px drop OR a fast flick downward.
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 90,
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32, mass: 1 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={onDragEnd}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: fullHeight ? "95vh" : maxHeight,
              background: "#0a0a0a",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTop: "0.5px solid rgba(255,255,255,0.1)",
              boxShadow: "0 -32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
              touchAction: "pan-y",
            }}
          >
            {/* Drag handle — also the visual cue for swipe-to-dismiss. */}
            <div
              style={{
                width: 40,
                height: 4,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                margin: "12px auto 8px",
                flexShrink: 0,
              }}
            />
            {title && (
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#f0f0f0",
                  textAlign: "center",
                  padding: "8px 24px 12px",
                  borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                  flexShrink: 0,
                }}
              >
                {title}
              </div>
            )}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                padding: "16px 20px 24px",
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
