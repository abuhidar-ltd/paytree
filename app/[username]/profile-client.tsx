"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LiveStatusPill } from "@/components/ui/live-status-pill"
import { SocialIcon } from "@/components/social-icon"
import { useApplyAccentColor } from "@/contexts/accent-color-context"
import { AiAgentChat } from "@/components/ui/ai-agent-chat"
import { SocialProofToast } from "@/components/ui/social-proof-toast"
import { BlockRenderer, type Block } from "@/components/ui/block-renderer"
import { Sparkles } from "lucide-react"

// ─── Interfaces ───────────────────────────────────────────────

interface SocialLink {
  id: string
  platform: string
  url: string
}

interface User {
  id: string
  name: string | null
  username: string
  bio: string | null
  image: string | null
  liveStatus: boolean
  liveMessage: string | null
  statsStudents: number
  statsWinRate: number
  statsFollowers: number
  statsLabel1: string | null
  statsLabel2: string | null
  statsLabel3: string | null
  accentColor: string | null
  heroStyle?: string | null
  heroImage?: string | null
  heroVideo?: string | null
}

interface ProfileClientProps {
  user: User
  blocks: Block[]
  socialLinks: SocialLink[]
  socialIconPosition: string
  isPublished: boolean
  isLive?: boolean
  buttonStyle?: string
  showAiAgent?: boolean
  accentColor?: string
  creatorStripeReady?: boolean
  removeBranding?: boolean
  isPreview?: boolean
  isOwner?: boolean
}

// ─── ProfileClient ────────────────────────────────────────────

export function ProfileClient({
  user,
  blocks,
  socialLinks,
  socialIconPosition,
  isPublished,
  isLive = false,
  buttonStyle,
  showAiAgent = false,
  accentColor,
  creatorStripeReady = false,
  removeBranding = false,
  isPreview = false,
  isOwner = false,
}: ProfileClientProps) {
  const [showAiChat, setShowAiChat] = useState(false)
  const [activeCollection, setActiveCollection] = useState<Block | null>(null)

  useApplyAccentColor(user.accentColor)

  const resolvedAccent = accentColor || user.accentColor || "#00ff88"
  const heroStyle = user.heroStyle ?? "classic"
  const showStats = user.statsStudents > 0 || user.statsWinRate > 0 || user.statsFollowers > 0
  const socialBlocks = blocks.filter(b => b.type === "social_link")
  const contentBlocks = blocks.filter(b => b.type !== "social_link")
  const hasSocials = socialLinks.length > 0 || socialBlocks.length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`min-h-screen bg-[#030303] ${isPreview ? "pointer-events-none" : ""}`}
    >
      {/* ─── Hero ─── */}
      {heroStyle === "cinematic" ? (
        <CinematicHero user={user} socialLinks={socialLinks} socialBlocks={socialBlocks} socialIconPosition={socialIconPosition} isLive={isLive} />
      ) : (
        <ClassicHero user={user} socialLinks={socialLinks} socialBlocks={socialBlocks} socialIconPosition={socialIconPosition} isPublished={isPublished} isLive={isLive} />
      )}

      {/* ─── Stats ─── */}
      {showStats && (
        <div className="max-w-[480px] mx-auto px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {user.statsStudents > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white font-mono">{formatNumber(user.statsStudents)}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mt-1">{user.statsLabel1 || "Students"}</div>
              </motion.div>
            )}
            {user.statsWinRate > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 text-center">
                <div className={`text-2xl font-bold font-mono ${user.statsWinRate >= 90 ? "text-[#00ff88]" : "text-white"}`}>
                  {user.statsWinRate}%
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mt-1">{user.statsLabel2 || "Win Rate"}</div>
              </motion.div>
            )}
            {user.statsFollowers > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className={`bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 text-center ${user.statsStudents > 0 && user.statsWinRate > 0 ? "col-span-2" : ""}`}>
                <div className="text-2xl font-bold text-white font-mono">{formatNumber(user.statsFollowers)}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mt-1">{user.statsLabel3 || "Followers"}</div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ─── Blocks Section ─── */}
      {contentBlocks.length > 0 ? (
        <div className="max-w-[480px] mx-auto px-4 mt-6">
          <AnimatePresence mode="wait">
            {activeCollection ? (
              <motion.div
                key="collection-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
              >
                <button
                  onClick={() => setActiveCollection(null)}
                  className="flex items-center gap-2 text-[#00ff88] font-mono text-sm mb-4 hover:opacity-80 transition-opacity"
                >
                  ← {activeCollection.title}
                </button>
                <CardsGrid
                  blocks={(activeCollection.children || []).map((c) => ({ ...c, children: [] }))}
                  commonProps={{
                    userId: user.id,
                    accentColor: resolvedAccent,
                    buttonStyle: buttonStyle || "glass",
                    username: user.username,
                    creatorStripeReady,
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="root-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.18 }}
              >
                <CardsGrid
                  blocks={contentBlocks}
                  commonProps={{
                    userId: user.id,
                    accentColor: resolvedAccent,
                    buttonStyle: buttonStyle || "glass",
                    username: user.username,
                    creatorStripeReady,
                  }}
                  onOpenCollection={setActiveCollection}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="max-w-[480px] mx-auto px-4 mt-6">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3 opacity-30">🔗</div>
            <p className="text-sm font-medium text-white">No links yet</p>
            <p className="text-xs text-[#555] mt-1">This terminal is just getting started</p>
          </div>
        </div>
      )}

      {/* ─── Social Icons Bottom ─── */}
      {socialIconPosition === "bottom" && hasSocials && (
        <div className="max-w-[480px] mx-auto px-4 mt-8 mb-4">
          <div className="flex justify-center gap-3">
            {socialLinks.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}>
                <SocialIcon platform={s.platform} url={s.url} size={36} />
              </motion.div>
            ))}
            {socialBlocks.map((b, i) => {
              const bCfg = (b.config || {}) as Record<string, string>
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (socialLinks.length + i) * 0.05, type: "spring", stiffness: 260, damping: 20 }}>
                  <SocialIcon platform={bCfg.platform || b.title} url={b.url || ""} size={36} />
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Branding ─── */}
      {!removeBranding && !isOwner && !isPreview && (
        <div className="text-center py-10">
          <a href="/" className="inline-flex items-center gap-2 text-[#444] hover:text-[#666] transition-colors text-xs font-mono">
            Made with Paytree · paytree.to
          </a>
        </div>
      )}

      {/* ─── AI Agent Button ─── */}
      {showAiAgent && !isPreview && (
        <>
          <motion.button
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setShowAiChat(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#00ff88] flex items-center justify-center shadow-lg"
            style={{
              boxShadow: "0 0 20px rgba(0,255,136,0.3), 0 4px 16px rgba(0,0,0,0.3)",
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-[#00ff88]"
              animate={{ boxShadow: ["0 0 0 0 rgba(0,255,136,0.4)", "0 0 0 12px rgba(0,255,136,0)", "0 0 0 0 rgba(0,255,136,0.4)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <Sparkles size={22} className="text-black relative z-10" />
          </motion.button>

          <AnimatePresence>
            {showAiChat && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 z-[60]"
              >
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowAiChat(false)} />
                <div className="absolute bottom-0 left-0 right-0 max-h-[80vh]">
                  <AiAgentChat
                    username={user.username}
                    creatorName={user.name || user.username}
                    accentColor={resolvedAccent}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <SocialProofToast username={user.username} />
    </motion.div>
  )
}

// ─── Classic Hero ─────────────────────────────────────────────

function ClassicHero({ user, socialLinks, socialBlocks, socialIconPosition, isPublished, isLive }: {
  user: ProfileClientProps["user"]
  socialLinks: SocialLink[]
  socialBlocks: Block[]
  socialIconPosition: string
  isPublished: boolean
  isLive: boolean
}) {
  return (
    <div className="pt-12 pb-6 px-4">
      <div className="max-w-[480px] mx-auto text-center">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
          className="mx-auto mb-4 w-[88px] h-[88px] rounded-full overflow-hidden"
          style={{
            border: "2px solid rgba(0,255,136,0.2)",
            boxShadow: "0 0 0 4px rgba(0,255,136,0.06), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {user.image ? (
            <img src={user.image} alt={user.name || user.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#00ff88] to-[#0a0a0a] flex items-center justify-center text-3xl font-bold text-white">
              {(user.name || user.username).charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        {/* Verified */}
        {isPublished && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 mb-3">
            <svg className="w-3 h-3 text-[#00ff88]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <span className="text-[10px] font-mono font-bold text-[#00ff88] uppercase tracking-wider">Verified</span>
          </motion.div>
        )}

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
          className="text-2xl font-bold text-white"
        >
          {user.name || user.username}
        </motion.h1>

        {/* Handle */}
        {user.name && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-[#00ff88] font-mono mt-1"
          >
            @{user.username}
          </motion.p>
        )}

        {/* Bio */}
        {user.bio && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-sm text-[#555] mt-2 max-w-xs mx-auto leading-relaxed"
          >
            {user.bio}
          </motion.p>
        )}

        {/* Live Status */}
        {user.liveStatus && user.liveMessage && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="flex justify-center mt-3">
            <LiveStatusPill message={user.liveMessage} size="md" />
          </motion.div>
        )}

        {/* Social Icons Top */}
        {socialIconPosition === "top" && (socialLinks.length > 0 || socialBlocks.length > 0) && (
          <div className="flex justify-center gap-3 mt-5">
            {socialLinks.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}>
                <SocialIcon platform={s.platform} url={s.url} size={36} />
              </motion.div>
            ))}
            {socialBlocks.map((b, i) => {
              const bCfg = (b.config || {}) as Record<string, string>
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (socialLinks.length + i) * 0.05, type: "spring", stiffness: 260, damping: 20 }}>
                  <SocialIcon platform={bCfg.platform || b.title} url={b.url || ""} size={36} />
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Cinematic Hero ───────────────────────────────────────────

function CinematicHero({ user, socialLinks, socialBlocks, socialIconPosition, isLive }: {
  user: ProfileClientProps["user"]
  socialLinks: SocialLink[]
  socialBlocks: Block[]
  socialIconPosition: string
  isLive: boolean
}) {
  const hasHeroMedia = user.heroImage || user.heroVideo

  return (
    <div className="relative">
      {/* Hero image/video */}
      {hasHeroMedia && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative w-full h-[320px] overflow-hidden"
        >
          {user.heroVideo ? (
            <video autoPlay muted loop playsInline className="w-full h-full object-cover object-top">
              <source src={user.heroVideo} />
            </video>
          ) : (
            <img src={user.heroImage!} alt="" className="w-full h-full object-cover object-top" />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(180,100,40,0.3) 0%, transparent 30%, #080808 85%, #080808 100%)",
            }}
          />
        </motion.div>
      )}

      {/* Overlaid content */}
      <div className={`${hasHeroMedia ? "absolute bottom-0 left-0 right-0" : "pt-16 pb-6"} px-5 pb-6`}>
        <div className="max-w-[480px] mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
            className="text-3xl font-bold text-white drop-shadow-lg"
          >
            {user.name || user.username}
          </motion.h1>

          {user.name && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-sm text-[#00ff88] font-mono mt-1 drop-shadow">
              @{user.username}
            </motion.p>
          )}

          {user.bio && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-sm text-white/70 mt-2 max-w-sm leading-relaxed drop-shadow">
              {user.bio}
            </motion.p>
          )}

          {user.liveStatus && user.liveMessage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="mt-3">
              <LiveStatusPill message={user.liveMessage} size="md" />
            </motion.div>
          )}

          {socialIconPosition === "top" && (socialLinks.length > 0 || socialBlocks.length > 0) && (
            <div className="flex gap-3 mt-4">
              {socialLinks.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}>
                  <SocialIcon platform={s.platform} url={s.url} size={36} />
                </motion.div>
              ))}
              {socialBlocks.map((b, i) => {
                const bCfg = (b.config || {}) as Record<string, string>
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + (socialLinks.length + i) * 0.05, type: "spring", stiffness: 260, damping: 20 }}>
                    <SocialIcon platform={bCfg.platform || b.title} url={b.url || ""} size={36} />
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Cards Grid ───────────────────────────────────────────────
// Universal CSS-grid layout. Full-width blocks span both columns,
// half-width blocks take one. Each card scroll-animates in with a stagger.

function CardsGrid({ blocks, commonProps, onOpenCollection }: {
  blocks: Block[]
  commonProps: { userId: string; accentColor: string; buttonStyle: string; username: string; creatorStripeReady: boolean }
  onOpenCollection?: (block: Block) => void
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {blocks.map((block, i) => {
        const span = block.size === "half" ? 1 : 2
        return (
          <motion.div
            key={block.id}
            style={{ gridColumn: `span ${span}`, minWidth: 0 }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 280, damping: 24, delay: i * 0.05 }}
          >
            <BlockRenderer block={block} {...commonProps} onOpenCollection={onOpenCollection} />
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Utility ──────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`
  return num.toString()
}
