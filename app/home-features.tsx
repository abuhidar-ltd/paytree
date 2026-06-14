"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MiniGlobe } from "./home-mini-globe"

export function HomeFeatures() {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-16">
        {/* Badge + Headline */}
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-[#888] text-xs font-mono px-3 py-1.5 rounded-full">
            Features
          </span>
        </motion.div>

        <motion.h2
          className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#f0f0f0] mb-12"
          initial={{ opacity: 1, y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 20 }}
        >
          Built different.
        </motion.h2>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: AI Sales Agent */}
          <motion.div
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 transition-colors duration-300 flex flex-col h-full hover:border-white/[0.18] hover:bg-white/[0.035]"
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 24 } }}
            initial={{ opacity: 1, y: 30 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0, type: "spring", stiffness: 120, damping: 20 }}
          >
            <div className="bg-[#00ff88]/[0.06] rounded-xl p-4 w-fit mb-5">
              <svg className="w-6 h-6 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#f0f0f0] mb-2">
              Your AI sells while you sleep
            </h3>
            <p className="text-[#888] text-sm leading-relaxed mb-6">
              An AI trained on your content answers questions and closes sales 24/7.
            </p>

            {/* Mini chat demo */}
            <div className="mt-auto space-y-2">
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 1, y: 8 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-white/[0.06] rounded-xl rounded-br-none px-3 py-2 max-w-[80%]">
                  <p className="text-[11px] text-[#aaa]">How much is the course?</p>
                </div>
              </motion.div>
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 1, y: 8 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
              >
                <div className="bg-[#00ff88]/[0.08] border border-[#00ff88]/[0.12] rounded-xl rounded-bl-none px-3 py-2 max-w-[85%]">
                  <p className="text-[11px] text-[#ccc]">The Pro Signals course is $49. It includes...</p>
                </div>
              </motion.div>
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 1, y: 8 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                <div className="bg-[#00ff88]/[0.05] rounded-xl rounded-bl-none px-3 py-2">
                  <TypingIndicator />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Card 2: Globe Analytics */}
          <motion.div
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 transition-colors duration-300 flex flex-col h-full hover:border-white/[0.18] hover:bg-white/[0.035]"
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 24 } }}
            initial={{ opacity: 1, y: 30 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.12, type: "spring", stiffness: 120, damping: 20 }}
          >
            <div className="bg-[#00ff88]/[0.06] rounded-xl p-4 w-fit mb-5">
              <svg className="w-6 h-6 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#f0f0f0] mb-2">
              See your audience from space
            </h3>
            <p className="text-[#888] text-sm leading-relaxed mb-6">
              Watch visitors appear as glowing dots across a 3D globe in real time.
            </p>

            {/* Mini globe */}
            <motion.div
              className="mt-auto flex justify-center"
              initial={{ scale: 0.92 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <MiniGlobe />
            </motion.div>
          </motion.div>

          {/* Card 3: Drop Countdown */}
          <motion.div
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 transition-colors duration-300 flex flex-col h-full hover:border-white/[0.18] hover:bg-white/[0.035]"
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 24 } }}
            initial={{ opacity: 1, y: 30 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.24, type: "spring", stiffness: 120, damping: 20 }}
          >
            <div className="bg-[#00ff88]/[0.06] rounded-xl p-4 w-fit mb-5">
              <svg className="w-6 h-6 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#f0f0f0] mb-2">
              Launches that sell out
            </h3>
            <p className="text-[#888] text-sm leading-relaxed mb-6">
              Create urgency with countdown timers that drive instant action on your biggest launches.
            </p>

            {/* Mini countdown */}
            <motion.div
              className="mt-auto"
              initial={{ opacity: 1, y: 12 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <CountdownDemo />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center h-4">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]/60 animate-[typing_1.2s_ease-in-out_infinite]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]/60 animate-[typing_1.2s_ease-in-out_0.2s_infinite]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]/60 animate-[typing_1.2s_ease-in-out_0.4s_infinite]" />
      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  )
}

function CountdownDemo() {
  const [time, setTime] = useState({ d: 2, h: 14, m: 37, s: 52 })

  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { d, h, m, s } = t
        s--
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) { h = 23; d-- }
        if (d < 0) { d = 2; h = 14; m = 37; s = 52 }
        return { d, h, m, s }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, "0")

  return (
    <div className="bg-[#00ff88]/[0.06] border border-[#00ff88]/[0.15] rounded-xl p-4 text-center">
      <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest mb-2">Drops In</p>
      <div className="flex items-center justify-center gap-1.5 font-mono text-[#00ff88] text-xl font-bold tabular-nums">
        <span>{pad(time.d)}</span>
        <span className="text-[#00ff88]/40">:</span>
        <span>{pad(time.h)}</span>
        <span className="text-[#00ff88]/40">:</span>
        <span>{pad(time.m)}</span>
        <span className="text-[#00ff88]/40">:</span>
        <span>{pad(time.s)}</span>
      </div>
      <p className="text-[10px] text-[#888] mt-2">Pro Signals Course — $49</p>
    </div>
  )
}
