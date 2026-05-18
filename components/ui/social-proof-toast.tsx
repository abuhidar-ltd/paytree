"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SocialProofEvent {
  type: string
  message: string
  country: string | null
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes === 1) return "1 minute ago"
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return "1 hour ago"
  return `${hours} hours ago`
}

export function SocialProofToast({ username }: { username: string }) {
  const [events, setEvents] = useState<SocialProofEvent[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch(`/api/social-proof?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.events?.length > 0) setEvents(data.events)
      })
      .catch(() => {})
  }, [username])

  useEffect(() => {
    if (events.length === 0) return

    let idx = 0
    let cancelled = false

    const showNext = () => {
      if (cancelled || idx >= events.length) return
      setCurrentIndex(idx)
      setVisible(true)

      setTimeout(() => {
        if (cancelled) return
        setVisible(false)
        idx++
        if (idx < events.length) {
          setTimeout(showNext, 3000)
        }
      }, 4000)
    }

    const initial = setTimeout(showNext, 2000)
    return () => {
      cancelled = true
      clearTimeout(initial)
    }
  }, [events])

  if (events.length === 0 || currentIndex === null) return null

  const event = events[currentIndex]

  return (
    <div className="fixed bottom-6 left-4 z-50 pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={currentIndex}
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-auto"
          >
            <div className="w-[280px] bg-[#0f0f0f] border border-white/[0.08] rounded-xl p-3 shadow-lg">
              <div className="flex items-start gap-2.5">
                <div className="mt-1 w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#e0e0e0] text-sm leading-snug">{event.message}</p>
                  <p className="text-[#444] text-xs font-mono mt-1">
                    {event.country ? `${event.country} · ` : ""}
                    {timeAgo(event.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
