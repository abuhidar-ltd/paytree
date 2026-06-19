"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ObsidianCard, GlassBrick } from "@/components/ui/obsidian-card"
import { LiveStatusPill } from "@/components/ui/live-status-pill"

export function HomeScrollStory() {
  const [activeStage, setActiveStage] = useState(0)
  const scrollStoryRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastStageRef = useRef(0)

  // RAF-throttled scroll handler — only calls setState when activeStage actually changes
  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) return

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      if (!scrollStoryRef.current) return

      const rect = scrollStoryRef.current.getBoundingClientRect()
      const scrollEnd = scrollStoryRef.current.offsetHeight - window.innerHeight

      let newStage: number
      if (rect.top > 0) {
        newStage = 0
      } else if (rect.bottom < window.innerHeight) {
        newStage = 4
      } else {
        const progress = Math.abs(rect.top) / scrollEnd
        newStage = Math.min(4, Math.floor(Math.min(1, Math.max(0, progress)) * 5))
      }

      if (newStage !== lastStageRef.current) {
        lastStageRef.current = newStage
        setActiveStage(newStage)
      }
    })
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [handleScroll])

  return (
    <section ref={scrollStoryRef} className="scroll-story relative">
      <div className="scroll-story-sticky">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <ObsidianCard variant="accent" enableTilt={true} className="p-6 sm:p-8">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="pfp-lg mx-auto mb-4">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#00ff88] to-[#0a0a0a] flex items-center justify-center text-3xl font-bold">
                    T
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white">T.Tricks</h2>
                <p className="text-[#888888] text-sm">@tricks_academy</p>
              </div>

              {/* Stage 1: Live Status */}
              <AnimatePresence>
                {activeStage >= 1 && (
                  <motion.div
                    initial={{ y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="flex justify-center mb-6"
                  >
                    <LiveStatusPill message="LIVE: TRADING ON SOLANA" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stage 2: Video Module */}
              <AnimatePresence>
                {activeStage >= 2 && (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="mb-4"
                  >
                    <GlassBrick className="aspect-video relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,255,136,0.1)] to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.1)] backdrop-blur-xl flex items-center justify-center border border-[rgba(255,255,255,0.2)]">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <div className="label">Featured</div>
                        <div className="font-bold text-white">Latest Analysis</div>
                      </div>
                    </GlassBrick>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stage 3: Bento Stats */}
              <AnimatePresence>
                {activeStage >= 3 && (
                  <motion.div
                    initial={{ opacity: 1, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="grid grid-cols-2 gap-3 mb-4"
                  >
                    <GlassBrick className="!p-4 text-center">
                      <div className="text-2xl font-bold text-white">5.2k</div>
                      <div className="label">Students</div>
                    </GlassBrick>
                    <GlassBrick className="!p-4 text-center">
                      <div className="text-2xl font-bold text-[#00ff88]">98%</div>
                      <div className="label">Win Rate</div>
                    </GlassBrick>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stage 4: Portal Links */}
              <AnimatePresence>
                {activeStage >= 4 && (
                  <motion.div
                    initial={{ opacity: 1, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="space-y-3"
                  >
                    <GlassBrick className="!py-4">
                      <div className="label">Portal</div>
                      <div className="title flex items-center justify-between">
                        <span>📚 The Academy</span>
                        <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </GlassBrick>
                    <GlassBrick className="!py-4">
                      <div className="label">Finances</div>
                      <div className="title">💳 Payment Links</div>
                    </GlassBrick>
                  </motion.div>
                )}
              </AnimatePresence>
            </ObsidianCard>

            {/* Progress indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {[0, 1, 2, 3, 4].map((stage) => (
                <div
                  key={stage}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeStage >= stage
                      ? "bg-[#00ff88] shadow-[0_0_10px_#00ff88]"
                      : "bg-[rgba(255,255,255,0.2)]"
                  }`}
                />
              ))}
            </div>

            {/* Stage labels */}
            <div className="text-center mt-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeStage}
                  initial={{ opacity: 1, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-[#888888]"
                >
                  {activeStage === 0 && "Scroll to explore features"}
                  {activeStage === 1 && "Live Broadcast Mode"}
                  {activeStage === 2 && "Embedded Media"}
                  {activeStage === 3 && "Authority Counters"}
                  {activeStage === 4 && "Deep Portals"}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
