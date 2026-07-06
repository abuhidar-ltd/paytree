"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Loader2, X, Check, History, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface BioHistoryItem {
  id: string
  bio: string
  prompt: string | null
  createdAt: string
}

interface AiBioWriterProps {
  open: boolean
  onClose: () => void
  currentBio: string
  name: string
  username: string
  onSelect: (bio: string) => void
}

const inferNiche = (bio: string) => {
  if (!bio) return ""
  // First short clause is usually the role/niche
  const firstClause = bio.split(/[.|,—–]/)[0]?.trim() || ""
  return firstClause.length <= 60 ? firstClause : ""
}

export function AiBioWriter({
  open, onClose, currentBio, name, username, onSelect,
}: AiBioWriterProps) {
  const [niche, setNiche] = useState("")
  const [bios, setBios] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [history, setHistory] = useState<BioHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // ── Lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setNiche(inferNiche(currentBio))
      setBios([])
      setError(null)
    }
  }, [open, currentBio])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Fetch history when opened
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch("/api/ai/bio-history")
      if (!res.ok) throw new Error("Failed to fetch history")
      const data: BioHistoryItem[] = await res.json()
      setHistory(data.slice(0, 5))
    } catch (e) {
      console.error("Bio history fetch failed", e)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => { if (open) fetchHistory() }, [open, fetchHistory])

  // ── Generate ─────────────────────────────────────────────────
  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentBio, name, username, niche }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to generate")
        if (typeof data.remaining === "number") setRemaining(data.remaining)
        return
      }
      setBios(Array.isArray(data.bios) ? data.bios : [])
      if (typeof data.remaining === "number") setRemaining(data.remaining)
      fetchHistory()
    } catch {
      setError("Network error — try again")
    } finally {
      setLoading(false)
    }
  }

  const pick = (bio: string) => {
    onSelect(bio)
    toast.success("Bio updated ✓")
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        key="ai-bio-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center"
      >
        <motion.div
          key="ai-bio-sheet"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
          style={{
            background: "#0a0a0a",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.06), 0 -16px 64px rgba(0,0,0,0.6)",
          }}
        >
          {/* Reflection */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,255,136,0.3) 50%, transparent)",
            }}
          />

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles size={16} className="text-[#00ff88]" />
              </motion.span>
              <h2 className="text-sm font-medium text-white">AI Bio Writer</h2>
            </div>
            <div className="flex items-center gap-3">
              {remaining !== null && (
                <span className="text-[10px] font-mono text-[#c9c9d1] tabular-nums">
                  {remaining} left today
                </span>
              )}
              <button
                onClick={onClose}
                className="text-[#b0b0b0] hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Body ───────────────────────────────────────────── */}
          <div className="p-6 space-y-5">

            {/* Niche input */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#c9c9d1] mb-2 block">
                What do you do? (optional)
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. crypto trader, fitness coach…"
                maxLength={120}
                disabled={loading}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[#e0e0e0] text-sm font-mono focus:border-[#00ff88]/30 outline-none disabled:opacity-50"
              />
            </div>

            {/* Generate / Generate more button */}
            {bios.length === 0 ? (
              <button
                onClick={generate}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating bio ideas…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate bios
                  </>
                )}
              </button>
            ) : null}

            {/* Error */}
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-xs font-mono text-[#ff8888]"
                style={{ background: "rgba(255,85,85,0.06)", border: "0.5px solid rgba(255,85,85,0.25)" }}
              >
                {error}
              </div>
            )}

            {/* ── Bio suggestion cards ─────────────────────────── */}
            <AnimatePresence>
              {loading && bios.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-10 gap-3"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 20, -10, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles size={28} className="text-[#00ff88]" />
                  </motion.div>
                  <p className="text-xs font-mono text-[#b0b0b0]">Generating bio ideas…</p>
                </motion.div>
              )}
            </AnimatePresence>

            {bios.length > 0 && (
              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#c9c9d1]">
                  Pick a bio
                </div>
                {bios.map((bio, i) => (
                  <BioCard key={`${bio}-${i}`} bio={bio} onUse={() => pick(bio)} index={i} />
                ))}

                <button
                  onClick={generate}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.08] text-[#c9c9d1] font-mono rounded-xl px-4 py-2.5 text-xs hover:border-white/[0.18] hover:text-[#e0e0e0] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <RotateCcw size={12} />
                      Generate 3 more
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Previous bios ────────────────────────────────── */}
            {history.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#c9c9d1] mb-3">
                  <History size={11} /> Previous bios
                </div>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-xl group"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "0.5px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <p className="text-xs text-[#c9c9d1] flex-1 line-clamp-2 leading-relaxed">
                        {h.bio}
                      </p>
                      <button
                        onClick={() => pick(h.bio)}
                        className="text-[10px] font-mono text-[#b0b0b0] hover:text-[#00ff88] transition-colors flex-shrink-0 px-2 py-1 rounded-md hover:bg-[#00ff88]/[0.06]"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.length === 0 && historyLoading && (
              <div className="text-[10px] font-mono text-[#b8b8b8] text-center py-2">
                Loading history…
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Bio card ─────────────────────────────────────────────────────
function BioCard({ bio, onUse, index }: { bio: string; onUse: () => void; index: number }) {
  const count = bio.length
  const overLimit = count > 160
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 300, damping: 28 }}
      className="relative overflow-hidden group cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
      whileHover={{
        background: "rgba(255,255,255,0.05)",
        transition: { duration: 0.15 },
      }}
      onClick={onUse}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
        }}
      />
      <div className="p-4 pr-24">
        <p className="text-sm text-white leading-relaxed">{bio}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#b8b8b8]">
            Option {index + 1}
          </span>
          <span
            className={`text-[11px] font-mono tabular-nums ${
              overLimit ? "text-[#ff5555]" : "text-[#00ff88]"
            }`}
          >
            {count}/160
          </span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onUse() }}
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 bg-[#00ff88] text-black font-mono font-semibold rounded-lg px-2.5 py-1 text-[10px]"
      >
        <Check size={10} />
        Use
      </button>
    </motion.div>
  )
}
