"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import { LiveStatusPill } from "@/components/ui/live-status-pill"
import { SocialIcon } from "@/components/social-icon"
import { useApplyAccentColor } from "@/contexts/accent-color-context"
import { AiAgentChat } from "@/components/ui/ai-agent-chat"
import { SocialProofToast } from "@/components/ui/social-proof-toast"
import { BlockRenderer, type Block } from "@/components/ui/block-renderer"
import { trackEvent } from "@/lib/analytics"

// ─── Font loading ─────────────────────────────────────────────

const GOOGLE_FONTS: Record<string, string> = {
  "space-mono": "Space+Mono:ital,wght@0,400;0,700",
  "syne": "Syne:wght@400;500;600;700;800",
  "outfit": "Outfit:wght@300;400;500;600;700",
  "cal-sans": "Plus+Jakarta+Sans:wght@400;500;600;700",
}

const FONT_FAMILY_MAP: Record<string, string> = {
  "inter": "'Inter', sans-serif",
  "space-mono": "'Space Mono', monospace",
  "syne": "'Syne', sans-serif",
  "outfit": "'Outfit', sans-serif",
  "cal-sans": "'Plus Jakarta Sans', sans-serif",
}

const BLOCK_RADIUS_MAP: Record<string, string> = {
  "none": "0px",
  "md": "8px",
  "xl": "16px",
  "full": "999px",
  "medium": "12px",
}

function useLoadFont(fontFamily: string | null | undefined) {
  useEffect(() => {
    if (!fontFamily || fontFamily === "inter") return
    const query = GOOGLE_FONTS[fontFamily]
    if (!query) return
    const id = `gfont-${fontFamily}`
    if (document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`
    document.head.appendChild(link)
  }, [fontFamily])
}

// ─── Interfaces ───────────────────────────────────────────────

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
  fontFamily?: string | null
  cornerRadius?: string | null
}

interface ProfileClientProps {
  user: User
  blocks: Block[]
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
  useApplyAccentColor(user.accentColor)
  useLoadFont(user.fontFamily)

  // Public profile view event — fire once per mount, skip when owner is
  // previewing their own page so we don't pollute "real fan" metrics.
  useEffect(() => {
    if (isPreview || isOwner) return
    trackEvent("profile_viewed", {
      username: user.username,
      is_published: isPublished,
      block_count: blocks.length,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolvedAccent = accentColor || user.accentColor || "#00ff88"
  const heroStyle = user.heroStyle ?? "classic"
  const resolvedFont = FONT_FAMILY_MAP[user.fontFamily ?? ""] ?? "'Inter', sans-serif"
  const resolvedRadius = BLOCK_RADIUS_MAP[user.cornerRadius ?? ""] ?? "16px"

  // Set CSS vars on :root — inline style on motion.div is wiped during framer-motion hydration
  useEffect(() => {
    document.documentElement.style.setProperty("--block-radius", resolvedRadius)
  }, [resolvedRadius])
  useEffect(() => {
    const accent = resolvedAccent
    document.documentElement.style.setProperty("--accent", accent)
    document.documentElement.style.setProperty("--accent-faint", accent + "08")
    document.documentElement.style.setProperty("--accent-soft", accent + "1a")
    document.documentElement.style.setProperty("--accent-dim", accent + "22")
    document.documentElement.style.setProperty("--accent-border", accent + "40")
    document.documentElement.style.setProperty("--accent-glow", accent + "4d")
    document.documentElement.style.setProperty("--accent-strong", accent + "66")
  }, [resolvedAccent])
  const showStats = user.statsStudents > 0 || user.statsWinRate > 0 || user.statsFollowers > 0
  const socialBlocks = blocks.filter(b => b.type === "social_link")
  const contentBlocks = blocks.filter(b => b.type !== "social_link")
  const hasSocials = socialBlocks.length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-safe"
      style={{ fontFamily: resolvedFont }}
    >
      {/* ─── Hero ─── */}
      {heroStyle === "cinematic" ? (
        <CinematicHero user={user} socialBlocks={socialBlocks} socialIconPosition={socialIconPosition} isLive={isLive} />
      ) : (
        <ClassicHero user={user} socialBlocks={socialBlocks} socialIconPosition={socialIconPosition} isPublished={isPublished} isLive={isLive} accentColor={resolvedAccent} />
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
                <div
                  className="text-2xl font-bold font-mono"
                  style={{ color: user.statsWinRate >= 90 ? "var(--accent)" : "#f0f0f0" }}
                >
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
          <CardsGrid
            blocks={contentBlocks}
            commonProps={{
              userId: user.id,
              accentColor: resolvedAccent,
              buttonStyle: buttonStyle || "glass",
              username: user.username,
              creatorStripeReady,
            }}
          />
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
            {socialBlocks.map((b, i) => {
              const bCfg = (b.config || {}) as Record<string, string>
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}>
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

      {/* ─── AI Agent (renders its own FAB + sheet) ─── */}
      {showAiAgent && !isPreview && (
        <AiAgentChat
          username={user.username}
          creatorName={user.name || user.username}
          accentColor={resolvedAccent}
        />
      )}

      <SocialProofToast username={user.username} />
    </motion.div>
  )
}

// ─── Classic Hero ─────────────────────────────────────────────

function ClassicHero({ user, socialBlocks, socialIconPosition, isPublished, isLive, accentColor }: {
  user: ProfileClientProps["user"]
  socialBlocks: Block[]
  socialIconPosition: string
  isPublished: boolean
  isLive: boolean
  accentColor: string
}) {
  return (
    <div className="pt-12 pb-6 px-4">
      <div className="max-w-[480px] mx-auto text-center">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
          className="mx-auto mb-4 w-[108px] h-[108px] rounded-full overflow-hidden"
          style={{
            border: `2px solid ${accentColor}66`,
            boxShadow: `0 0 0 4px ${accentColor}18, 0 0 20px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          {user.image ? (
            <img src={user.image} alt={user.name || user.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #0a0a0a 100%)` }}>
              {(user.name || user.username).charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        {/* Verified */}
        {isPublished && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full mb-3"
            style={{ background: `${accentColor}1a`, border: `1px solid ${accentColor}33` }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: accentColor }}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: accentColor }}>Verified</span>
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
            className="text-sm font-mono mt-1"
            style={{ color: accentColor }}
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
            className="text-sm text-[#888] mt-2 max-w-xs mx-auto leading-relaxed"
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
        {socialIconPosition === "top" && socialBlocks.length > 0 && (
          <div className="flex justify-center gap-3 mt-5">
            {socialBlocks.map((b, i) => {
              const bCfg = (b.config || {}) as Record<string, string>
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}>
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
// The parent page renders the hero image at z-[1] as a full-bleed background.
// This component only renders the overlaid text content — no image here.

function CinematicHero({ user, socialBlocks, socialIconPosition, isLive }: {
  user: ProfileClientProps["user"]
  socialBlocks: Block[]
  socialIconPosition: string
  isLive: boolean
}) {
  return (
    <div className="px-5 pb-6">
      <div className="max-w-[480px] mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
          className="text-4xl font-bold text-white drop-shadow-lg"
        >
          {user.name || user.username}
        </motion.h1>

        {user.name && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="text-sm font-mono mt-1.5 drop-shadow"
            style={{ color: "var(--accent, #00ff88)" }}>
            @{user.username}
          </motion.p>
        )}

        {user.bio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="text-sm text-white/70 mt-3 max-w-sm mx-auto leading-relaxed drop-shadow">
            {user.bio}
          </motion.p>
        )}

        {user.liveStatus && user.liveMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="mt-3 flex justify-center">
            <LiveStatusPill message={user.liveMessage} size="md" />
          </motion.div>
        )}

        {socialIconPosition === "top" && socialBlocks.length > 0 && (
          <div className="flex justify-center gap-3 mt-4">
            {socialBlocks.map((b, i) => {
              const bCfg = (b.config || {}) as Record<string, string>
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}>
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

// ─── Cards Grid ───────────────────────────────────────────────
// Universal CSS-grid layout. Full-width blocks span both columns,
// half-width blocks take one. Each card scroll-animates in with a stagger.
//
// On mobile (<480px), certain card types are forced to full width because
// their content (countdown numbers, video thumbnails, forms) can't render
// legibly inside a half-width column.

const FORCE_FULL_ON_MOBILE = new Set([
  "drop", "youtube", "product", "vault",
  "faq", "contact_form", "podcast",
])

// Cards whose content can't render legibly in a half-width column at any viewport
const FORCE_FULL_ALWAYS = new Set([
  "drop", "faq", "contact_form", "podcast", "twitch", "collection",
])

function CardsGrid({ blocks, commonProps, onOpenCollection }: {
  blocks: Block[]
  commonProps: { userId: string; accentColor: string; buttonStyle: string; username: string; creatorStripeReady: boolean }
  onOpenCollection?: (block: Block) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {blocks.map((block, i) => {
        const isHalf = block.size === "half"
        const forceAlways = FORCE_FULL_ALWAYS.has(block.type)
        const forceFullOnMobile = FORCE_FULL_ON_MOBILE.has(block.type)
        const colSpan = !isHalf || forceAlways
          ? "col-span-2"
          : forceFullOnMobile
            ? "col-span-2 min-[480px]:col-span-1"
            : "col-span-1"
        return (
          <motion.div
            key={block.id}
            className={`${colSpan} min-w-0`}
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
