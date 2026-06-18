"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { trackEvent } from "@/lib/analytics"

interface Message {
  role: "user" | "assistant"
  content: string
  ts: number
}

interface AiAgentChatProps {
  username: string
  creatorName: string
  accentColor?: string
}

// ── Siri-like animated orb ────────────────────────────────────────────────────

function SiriOrb({
  accent,
  onClick,
  creatorName,
}: {
  accent: string
  onClick: () => void
  creatorName: string
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className="fixed bottom-6 right-6 z-50"
    >
      {/* Atmospheric outer glow — slow breathe */}
      <motion.div
        className="absolute -inset-4 rounded-full pointer-events-none"
        animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.14, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `radial-gradient(circle, ${accent}38 0%, transparent 70%)` }}
      />

      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-14 h-14 rounded-full cursor-pointer select-none"
        aria-label={`Ask ${creatorName}'s AI`}
      >
        {/* ── Layer 0: dark base ── */}
        <div className="absolute inset-0 rounded-full" style={{ background: "#080808" }} />

        {/* ── Layer 1: outer spinning conic gradient ── */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${accent} 22%, transparent 44%, ${accent}66 66%, transparent 88%, ${accent}33 100%)`,
          }}
        />

        {/* ── Layer 2: inner counter-rotating gradient ── */}
        <motion.div
          className="absolute inset-[2px] rounded-full"
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
          style={{
            background: `conic-gradient(from 120deg, transparent 0%, ${accent}50 28%, transparent 55%, ${accent}28 82%, transparent 100%)`,
          }}
        />

        {/* ── Layer 3: inner dark sphere (creates the orb depth) ── */}
        <div
          className="absolute inset-[3px] rounded-full"
          style={{ background: "radial-gradient(circle at 40% 35%, #1a1a1a, #040404 70%)" }}
        />

        {/* ── Layer 4: morphing highlight blob ── */}
        <motion.div
          className="absolute inset-[4px] rounded-full"
          animate={{
            background: [
              `radial-gradient(ellipse at 38% 32%, ${accent}60 0%, transparent 58%)`,
              `radial-gradient(ellipse at 62% 28%, ${accent}48 0%, transparent 58%)`,
              `radial-gradient(ellipse at 50% 60%, ${accent}36 0%, transparent 58%)`,
              `radial-gradient(ellipse at 38% 32%, ${accent}60 0%, transparent 58%)`,
            ],
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Layer 5: breathing center glow ── */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${accent}40 0%, transparent 55%)`,
          }}
        />

        {/* ── Sparkle icon ── */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.12, 0.96, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={21} style={{ color: accent }} strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* ── Outer edge ring ── */}
        <motion.div
          className="absolute -inset-[1px] rounded-full pointer-events-none"
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            border: `1.5px solid ${accent}`,
            boxShadow: `0 0 10px ${accent}55, inset 0 0 6px ${accent}18`,
          }}
        />
      </motion.button>
    </motion.div>
  )
}

// ── Suggestion chips ──────────────────────────────────────────────────────────

function SuggestionChips({
  accent,
  onSelect,
}: {
  accent: string
  onSelect: (text: string) => void
}) {
  const chips = [
    "What do you offer?",
    "What's your best product?",
    "How can I get started?",
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap gap-2 px-4 pb-1"
    >
      {chips.map((chip, i) => (
        <motion.button
          key={chip}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 + i * 0.06, type: "spring", stiffness: 340, damping: 26 }}
          onClick={() => onSelect(chip)}
          className="text-[11px] font-mono px-3 py-1.5 rounded-full transition-all"
          style={{
            background: `${accent}0f`,
            border: `1px solid ${accent}28`,
            color: accent,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${accent}1e`
            e.currentTarget.style.borderColor = `${accent}55`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${accent}0f`
            e.currentTarget.style.borderColor = `${accent}28`
          }}
        >
          {chip}
        </motion.button>
      ))}
    </motion.div>
  )
}

// ── Three dot typing indicator ────────────────────────────────────────────────

function ThreeDots({ accent }: { accent: string }) {
  return (
    <span className="inline-flex gap-1 items-center h-4">
      {[0, 150, 300].map((delay) => (
        <motion.span
          key={delay}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: accent }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: delay / 1000 }}
        />
      ))}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AiAgentChat({ username, creatorName, accentColor = "#00ff88" }: AiAgentChatProps) {
  const accent = accentColor

  const welcomeMessage: Message = {
    role: "assistant",
    content: `Hi! I'm ${creatorName}'s AI. Ask me anything about their content, products, or how I can help you today.`,
    ts: Date.now(),
  }

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([welcomeMessage])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const hasUserMessages = messages.some((m) => m.role === "user")

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 350)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendMessage = async (content?: string) => {
    const text = (content ?? input).trim()
    if (!text || isLoading || isStreaming) return

    const userMsg: Message = { role: "user", content: text, ts: Date.now() }
    const historyForAPI = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, messages: historyForAPI }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Something went wrong" }))
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: err.error || "Sorry, I'm unavailable right now.", ts: Date.now() },
        ])
        setIsLoading(false)
        return
      }

      const assistantMsg: Message = { role: "assistant", content: "", ts: Date.now() }
      setMessages((prev) => [...prev, assistantMsg])
      setIsLoading(false)
      setIsStreaming(true)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (chunk) {
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
            return updated
          })
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again.", ts: Date.now() },
      ])
      setIsLoading(false)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <>
      {/* ── Siri orb (hidden when panel is open) ── */}
      <AnimatePresence>
        {!isOpen && (
          <SiriOrb
            accent={accent}
            onClick={() => {
              trackEvent("ai_agent_opened", { username })
              setIsOpen(true)
            }}
            creatorName={creatorName}
          />
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24, transformOrigin: "bottom right" }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="fixed bottom-0 right-0 z-50 flex flex-col w-full sm:bottom-6 sm:right-6 sm:w-[380px] sm:rounded-[20px] overflow-hidden"
              style={{
                height: "min(580px, 80vh)",
                background: "#0c0c0c",
                border: "0.5px solid rgba(255,255,255,0.1)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.06)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
              >
                {/* Mini orb in header */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0 rounded-full" style={{ background: "#080808" }} />
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                    style={{
                      background: `conic-gradient(from 0deg, transparent 0%, ${accent} 22%, transparent 44%, ${accent}55 70%, transparent 100%)`,
                    }}
                  />
                  <div
                    className="absolute inset-[2px] rounded-full"
                    style={{ background: "radial-gradient(circle at 40% 35%, #1a1a1a, #040404 70%)" }}
                  />
                  <motion.div
                    className="absolute inset-[3px] rounded-full"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    style={{ background: `radial-gradient(circle, ${accent}44, transparent 60%)` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Sparkles size={12} style={{ color: accent }} strokeWidth={1.5} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-[#e0e0e0] truncate">
                    Ask {creatorName}&apos;s AI
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: accent }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <p className="text-[10px] font-mono text-[#555]">Online · Powered by Paytree</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555] hover:text-[#e0e0e0] hover:bg-white/[0.06] transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed font-mono ${
                        msg.role === "user" ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              background: `${accent}18`,
                              border: `1px solid ${accent}30`,
                              color: "#fff",
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "0.5px solid rgba(255,255,255,0.09)",
                              color: "#e0e0e0",
                            }
                      }
                    >
                      {msg.content.length > 0 ? (
                        msg.content
                      ) : isStreaming && i === messages.length - 1 ? (
                        <ThreeDots accent={accent} />
                      ) : null}
                    </div>
                    <span className="text-[10px] font-mono text-[#2e2e2e] mt-1 px-1">
                      {formatTime(msg.ts)}
                    </span>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-start"
                  >
                    <div
                      className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "0.5px solid rgba(255,255,255,0.09)",
                      }}
                    >
                      <ThreeDots accent={accent} />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestion chips — only before first user message */}
              <AnimatePresence>
                {!hasUserMessages && !isLoading && (
                  <SuggestionChips accent={accent} onSelect={(t) => sendMessage(t)} />
                )}
              </AnimatePresence>

              {/* Input */}
              <div
                className="px-3 pb-4 pt-2.5 flex-shrink-0"
                style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    rows={1}
                    className="flex-1 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-sm text-[#e0e0e0] font-mono placeholder-[#2e2e2e] focus:border-white/20 outline-none resize-none leading-5 transition-colors"
                    style={{ maxHeight: 100 }}
                    disabled={isLoading || isStreaming}
                  />
                  <motion.button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading || isStreaming}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
                    style={{ background: accent }}
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4 text-black" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
