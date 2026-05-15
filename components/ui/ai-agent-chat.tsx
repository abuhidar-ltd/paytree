"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, X, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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

export function AiAgentChat({ username, creatorName, accentColor = "#00ff88" }: AiAgentChatProps) {
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

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 200)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || isLoading || isStreaming) return

    const userMsg: Message = { role: "user", content, ts: Date.now() }
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

  const ThreeDots = () => (
    <span className="inline-flex gap-1 items-center h-4">
      <span className="w-1.5 h-1.5 rounded-full bg-[#666] animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-[#666] animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 rounded-full bg-[#666] animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  )

  return (
    <>
      {/* Floating trigger button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setIsOpen(true)}
              className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
              style={{ backgroundColor: accentColor }}
              aria-label={`Ask ${creatorName}'s AI`}
            >
              <Sparkles className="w-6 h-6 text-black" />
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-25 pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 sm:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 right-0 z-50 flex flex-col w-full sm:w-[380px] h-[72vh] sm:h-full overflow-hidden"
              style={{
                background: "#0f0f0f",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                borderTopLeftRadius: "20px",
                borderTopRightRadius: "20px",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {creatorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-[#e0e0e0] truncate">Ask {creatorName}&apos;s AI</p>
                  <p className="text-[10px] font-mono text-[#444]">Powered by Paytree</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:text-[#e0e0e0] hover:bg-white/[0.05] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed font-mono ${
                        msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              backgroundColor: `${accentColor}18`,
                              border: `1px solid ${accentColor}30`,
                              color: "#fff",
                            }
                          : {
                              backgroundColor: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "#e0e0e0",
                            }
                      }
                    >
                      {msg.content.length > 0
                        ? msg.content
                        : isStreaming && i === messages.length - 1
                        ? <ThreeDots />
                        : null}
                    </div>
                    <span className="text-[10px] font-mono text-[#333] mt-1 px-1">
                      {formatTime(msg.ts)}
                    </span>
                  </div>
                ))}

                {/* Loading indicator (before first chunk) */}
                {isLoading && (
                  <div className="flex flex-col items-start">
                    <div
                      className="px-3 py-2.5 rounded-2xl rounded-bl-sm text-sm"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <ThreeDots />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-3 pb-4 pt-2 border-t border-white/[0.06] flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    rows={1}
                    className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono placeholder-[#333] focus:border-white/20 outline-none resize-none leading-5"
                    style={{ maxHeight: "100px" }}
                    disabled={isLoading || isStreaming}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading || isStreaming}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
                    style={{ backgroundColor: accentColor }}
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
