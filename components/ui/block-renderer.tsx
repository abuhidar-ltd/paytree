"use client"

import { useState, useEffect, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { CryptoVaultPortal } from "./crypto-vault"
import { LiveStatusPill } from "./live-status-pill"
import { DropCard } from "./drop-card"
import { glass, glassReflection } from "@/lib/glass"
import { Link as LinkIcon, ChevronRight, ArrowUpRight, Folder, ShoppingBag } from "lucide-react"

// ─── Interfaces ───────────────────────────────────────────────

interface BlockChild {
  id: string
  type: string
  title: string
  url?: string | null
  description?: string | null
  thumbnail?: string | null
  style?: string
  size?: string
  layout?: string
  lockType?: string
  lockValue?: string | null
  config?: Record<string, unknown>
}

export interface Block {
  id: string
  type: string
  title: string
  url?: string | null
  description?: string | null
  thumbnail?: string | null
  style?: string
  size?: string
  layout?: string
  priority?: string
  lockType?: string
  lockValue?: string | null
  config?: Record<string, unknown>
  children?: BlockChild[]
}

interface BaseBlockProps {
  block: Block
  accentColor: string
  buttonStyle: string
  userId: string
  username: string
  creatorStripeReady: boolean
  onOpenCollection?: (block: Block) => void
}

// ─── Universal glass card shell ───────────────────────────────
// Wraps every card with the shared reflection line + hover lift.
// Bare types (social_link, text) opt out and render their own markup.

const BARE_TYPES = new Set(["social_link", "text"])

function GlassShell({ type, children }: { type: string; children: ReactNode }) {
  if (BARE_TYPES.has(type)) return <>{children}</>
  return (
    <motion.div
      className="relative"
      style={{ borderRadius: "var(--block-radius, 16px)", overflow: "hidden", transition: "all 150ms ease" }}
      whileHover={{ y: -1 }}
    >
      {/* Top reflection line — sits above the inner card's own border */}
      <div
        className="absolute top-0 left-3 right-3 h-px pointer-events-none z-10"
        style={{ background: glassReflection }}
      />
      {children}
    </motion.div>
  )
}

// ─── URL Meta Detection ───────────────────────────────────────

interface URLMeta {
  icon: ReactNode
  color: string
  label: string
}

function YouTubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.9 31.9 0 000 12a31.9 31.9 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.9 31.9 0 0024 12a31.9 31.9 0 00-.5-5.8zM9.6 15.5V8.5l6.3 3.5-6.3 3.5z"/>
    </svg>
  )
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.8 19.8 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.3 18.3 0 00-5.487 0 12.6 12.6 0 00-.617-1.25.077.077 0 00-.079-.037A19.7 19.7 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.1 14.1 0 001.226-1.994.076.076 0 00-.041-.106 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.3 12.3 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.8 19.8 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

function SpotifyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 004.86 1.56V11.2a4.85 4.85 0 01-.72.05 4.8 4.8 0 01-2.56-.73V13a6.34 6.34 0 004 5.86V6.69z"/>
    </svg>
  )
}

function TwitchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  )
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

export function getURLMeta(url: string): URLMeta {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be"))
      return { icon: <YouTubeIcon />, color: "#ff0000", label: "YouTube" }
    if (hostname.includes("instagram.com"))
      return { icon: <InstagramIcon />, color: "#E1306C", label: "Instagram" }
    if (hostname.includes("twitter.com") || hostname.includes("x.com"))
      return { icon: <XIcon />, color: "#ffffff", label: "X" }
    if (hostname.includes("discord.gg") || hostname.includes("discord.com"))
      return { icon: <DiscordIcon />, color: "#5865F2", label: "Discord" }
    if (hostname.includes("spotify.com"))
      return { icon: <SpotifyIcon />, color: "#1DB954", label: "Spotify" }
    if (hostname.includes("tiktok.com"))
      return { icon: <TikTokIcon />, color: "#ffffff", label: "TikTok" }
    if (hostname.includes("twitch.tv"))
      return { icon: <TwitchIcon />, color: "#9146FF", label: "Twitch" }
    if (hostname.includes("github.com"))
      return { icon: <GitHubIcon />, color: "#ffffff", label: "GitHub" }
  } catch {}
  return { icon: <LinkIcon size={16} />, color: "#00ff88", label: "Link" }
}

// ─── Utilities ────────────────────────────────────────────────

function trackBlockClick(blockId: string) {
  const data = JSON.stringify({ linkId: blockId })
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track-click", data)
  } else {
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data,
      keepalive: true,
    }).catch(() => {})
  }
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

function formatPodcastDuration(dur: string): string {
  if (dur.includes(":")) return dur
  const secs = Number(dur)
  if (isNaN(secs)) return dur
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "1 day ago"
  if (days < 7) return `${days} days ago`
  return `${Math.floor(days / 7)} weeks ago`
}

const spring = { type: "spring" as const, stiffness: 400, damping: 30 }
const gentleSpring = { type: "spring" as const, stiffness: 300, damping: 24 }

// ─── Main BlockRenderer ──────────────────────────────────────

export function BlockRenderer({ block, userId, accentColor, buttonStyle, username, creatorStripeReady = false, onOpenCollection }: BaseBlockProps & { block: Block }) {
  const cfg = (block.config || {}) as Record<string, unknown>

  useEffect(() => {
    if (block.priority === "redirect" && block.url) {
      window.open(block.url, "_blank")
    }
  }, [block.priority, block.url])

  // Animation comes from config.animation (style tab) or legacy priority="animate"
  const animation = (cfg.animation as string) || (block.priority === "animate" ? "pulse" : "none")
  const isStarred = block.priority === "starred"

  const content = block.lockType && block.lockType !== "none"
    ? <LockedBlock block={block} userId={userId} cfg={cfg} accentColor={accentColor} buttonStyle={buttonStyle} username={username} creatorStripeReady={creatorStripeReady} />
    : <BlockContent block={block} userId={userId} cfg={cfg} accentColor={accentColor} buttonStyle={buttonStyle} username={username} creatorStripeReady={creatorStripeReady} onOpenCollection={onOpenCollection} />

  const animationClass =
    animation === "pulse" ? "animate-pulse"
    : animation === "bounce" ? "animate-bounce"
    : ""

  return (
    <div
      className={`relative ${animationClass} ${isStarred ? "p-[1px]" : ""}`}
      style={{ borderRadius: "var(--block-radius, 16px)" }}
    >
      {isStarred && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: "var(--block-radius, 16px)", border: "1px solid rgba(0,255,136,0.4)" }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <GlassShell type={block.type}>{content}</GlassShell>
    </div>
  )
}

// ─── Block Type Router ───────────────────────────────────────

function BlockContent({ block, userId, cfg, accentColor, buttonStyle, username, creatorStripeReady, onOpenCollection }: {
  block: Block; userId: string; cfg: Record<string, unknown>; accentColor: string; buttonStyle: string; username: string; creatorStripeReady: boolean; onOpenCollection?: (block: Block) => void
}) {
  const baseProps: BaseBlockProps = { block, accentColor, buttonStyle, userId, username, creatorStripeReady, onOpenCollection }

  switch (block.type) {
    case "link":
      return <ProfileLinkCard {...baseProps} />
    case "collection":
      return <ProfileCollectionCard {...baseProps} />
    case "vault":
      return <ProfileVaultCard {...baseProps} />
    case "drop":
      return <ProfileDropCard {...baseProps} />
    case "youtube":
      return <ProfileYouTubeCard {...baseProps} />
    case "product":
      return <ProfileProductCard {...baseProps} />
    case "podcast":
      return <PodcastBlock block={block} cfg={cfg} />
    case "spotify":
      return <SpotifyBlock block={block} cfg={cfg} />
    case "twitch":
      return <TwitchBlock block={block} cfg={cfg} />
    case "crypto":
      return (
        <CryptoVaultPortal
          addresses={[{
            id: block.id,
            currency: (cfg.currency as string) || "BTC",
            address: (cfg.address as string) || "",
            label: block.title,
            enabled: true,
          }]}
        />
      )
    case "stats":
      return (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold font-mono" style={{ color: "var(--accent, #00ff88)" }}>{(cfg.value as string) || "0"}</div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#444] mt-2">{(cfg.label as string) || block.title}</div>
        </div>
      )
    case "live_status":
      return (cfg.isLive as boolean) ? (
        <div className="bg-red-500/[0.05] border border-red-500/[0.15] rounded-2xl p-4 flex items-center justify-center">
          <LiveStatusPill message={(cfg.message as string) || block.title} />
        </div>
      ) : null
    case "text":
      return (cfg.style as string) === "heading" ? (
        <h2 className="text-2xl font-bold text-[#f0f0f0] text-center py-4">{block.title}</h2>
      ) : (
        <p className="text-[#666] text-sm leading-relaxed px-1 py-2">{(cfg.content as string) || block.title}</p>
      )
    case "image":
      return (
        <div className="w-full">
          {(block.thumbnail || cfg.imageUrl) ? (
            <img src={(block.thumbnail || cfg.imageUrl) as string} alt={block.title || ""} className="w-full rounded-2xl object-cover" />
          ) : (
            <div className="bg-white/[0.03] border border-dashed border-white/[0.08] rounded-2xl p-8 text-center text-[#333] text-sm">
              Add an image URL in the dashboard
            </div>
          )}
          {block.title && block.title !== "Untitled" && (
            <p className="text-xs text-[#555] font-mono mt-2 text-center">{block.title}</p>
          )}
        </div>
      )
    case "faq":
      return <FaqBlock block={block} cfg={cfg} />
    case "contact_form":
      return <ContactFormBlock block={block} username={username} />
    case "discount_code":
      return <DiscountCodeBlock block={block} cfg={cfg} />
    case "social_link":
      return null
    default:
      return null
  }
}

// ─── ProfileLinkCard ─────────────────────────────────────────

function getButtonCardStyle(buttonStyle: string, accentColor: string): React.CSSProperties {
  switch (buttonStyle) {
    case "solid":
      return {
        background: "rgba(255,255,255,0.05)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: "var(--block-radius, 16px)",
      }
    case "gradient":
      return {
        background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
        border: `0.5px solid ${accentColor}40`,
        borderRadius: "var(--block-radius, 16px)",
      }
    case "glow":
      return {
        ...glass.card,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px ${accentColor}22`,
      }
    case "neon":
      return {
        background: "transparent",
        border: `1px solid ${accentColor}66`,
        borderRadius: "var(--block-radius, 16px)",
      }
    case "glass":
    default:
      return glass.card
  }
}

function ProfileLinkCard({ block, accentColor, buttonStyle }: BaseBlockProps) {
  const cfg = (block.config || {}) as Record<string, unknown>
  const url = block.url || (cfg.url as string) || "#"
  const meta = getURLMeta(url)

  const handleClick = () => {
    trackBlockClick(block.id)
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (block.layout === "featured" && block.thumbnail) {
    return (
      <motion.div
        className="relative rounded-2xl overflow-hidden cursor-pointer bg-white/[0.02] border border-white/[0.07] group"
        style={{ height: 120 }}
        whileHover={{ y: -1, borderColor: "rgba(255,255,255,0.12)" }}
        whileTap={{ scale: 0.98 }}
        transition={spring}
        onClick={handleClick}
      >
        <img src={block.thumbnail} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-2 left-2">
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: `${accentColor}33`, color: accentColor }}
          >
            Featured
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-sm font-medium text-white truncate">{block.title}</p>
        </div>
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight size={14} className="text-white/60" />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex items-center gap-3 px-4 cursor-pointer group"
      style={{ ...getButtonCardStyle(buttonStyle, accentColor), height: 60 }}
      whileHover={{ scale: 1.0 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      onClick={handleClick}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{block.title}</p>
        <p className="text-[11px] text-[#555] font-mono truncate">{meta.label}</p>
      </div>
      <ArrowUpRight size={14} className="text-[#444] group-hover:text-white/60 transition-colors flex-shrink-0" />
    </motion.div>
  )
}

// ─── ProfileCollectionCard ───────────────────────────────────

function ProfileCollectionCard({ block, userId, accentColor, buttonStyle, username, creatorStripeReady, onOpenCollection }: BaseBlockProps) {
  // When a parent provides onOpenCollection, the collection opens as a full-page
  // Apple-style transition handled in ProfileClient. Otherwise fall back to inline expand.
  const [expanded, setExpanded] = useState(block.priority === "auto_expand")
  const children = block.children || []
  const useTransition = typeof onOpenCollection === "function"

  return (
    <div className="w-full">
      <motion.div
        className="flex items-center gap-3 px-4 cursor-pointer"
        style={{ ...glass.card, height: 72 }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={spring}
        onClick={() => useTransition ? onOpenCollection!(block) : setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
          <Folder size={16} className="text-[#555]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{block.title}</p>
          <p className="text-[11px] text-[#555] font-mono">{children.length} links inside</p>
        </div>
        <motion.div
          animate={{ rotate: !useTransition && expanded ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <ChevronRight size={16} style={{ color: "var(--accent, #00ff88)" }} />
        </motion.div>
      </motion.div>

      {!useTransition && (
        <AnimatePresence>
          {expanded && children.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={gentleSpring}
              className="pl-4 border-l border-white/[0.07] ml-5 mt-2 space-y-2 overflow-hidden"
            >
              {children.map((child, i) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, ...gentleSpring }}
                >
                  <BlockRenderer
                    block={{ ...child, children: [] }}
                    userId={userId}
                    accentColor={accentColor}
                    buttonStyle={buttonStyle}
                    username={username}
                    creatorStripeReady={creatorStripeReady}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

// ─── ProfileVaultCard ────────────────────────────────────────

function ProfileVaultCard({ block, userId }: BaseBlockProps) {
  const cfg = (block.config || {}) as Record<string, unknown>
  const [step, setStep] = useState<"locked" | "email" | "code" | "unlocked">("locked")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const key = `vault_unlocked_${block.id}`
    if (localStorage.getItem(key)) setStep("unlocked")
  }, [block.id])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/vault/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, linkId: block.id, ownerId: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send code")
      if (data.alreadyVerified) {
        localStorage.setItem(`vault_unlocked_${block.id}`, email)
        setStep("unlocked")
      } else {
        setStep("code")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/vault/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, linkId: block.id, ownerId: userId, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Verification failed")
      localStorage.setItem(`vault_unlocked_${block.id}`, email)
      setContent(data.content || null)
      setStep("unlocked")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (step === "unlocked") {
    const vaultContent = (content?.vaultContent as string) || (cfg.content as string)
    const downloadUrl = (content?.downloadUrl as string) || (cfg.downloadUrl as string)
    const downloadName = (content?.downloadName as string) || (cfg.downloadName as string)
    const accessUrl = (content?.url as string) || block.url

    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring}
        className="bg-amber-500/[0.04] border border-amber-500/[0.15] rounded-2xl overflow-hidden"
      >
        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent, #00ff88)1a" }}>
              <svg className="w-5 h-5" style={{ color: "var(--accent, #00ff88)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{block.title}</p>
              <p className="text-xs font-mono" style={{ color: "var(--accent, #00ff88)" }}>Unlocked</p>
            </div>
          </div>
          {vaultContent && (
            <p className="text-sm text-[#e0e0e0] font-mono whitespace-pre-wrap mb-3">{vaultContent}</p>
          )}
          {downloadUrl && (
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-black font-mono font-semibold rounded-xl px-4 py-2.5 text-sm hover:opacity-90 transition-opacity"
              style={{ background: "var(--accent, #00ff88)" }}>
              ↓ {downloadName || "Download"}
            </a>
          )}
          {accessUrl && (
            <a href={accessUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-black font-mono font-semibold rounded-xl px-4 py-2.5 text-sm hover:opacity-90 transition-opacity ml-2"
              style={{ background: "var(--accent, #00ff88)" }}>
              Access now →
            </a>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-amber-500/[0.04] border border-amber-500/[0.15] rounded-2xl overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className="w-9 h-9 rounded-full bg-amber-500/[0.08] border border-amber-500/[0.2] flex items-center justify-center flex-shrink-0"
            whileHover={{ rotate: [-3, 3, 0], transition: { duration: 0.3 } }}
          >
            <svg className="w-5 h-5 text-amber-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-white">{block.title}</p>
            <p className="text-[10px] text-amber-400/60 font-mono">Email gated</p>
          </div>
        </div>
        {(cfg.content as string) && (
          <p className="text-sm text-[#888] font-mono select-none mb-3" style={{ filter: "blur(4px)" }}>
            {String(cfg.content).slice(0, 50)}
          </p>
        )}
      </div>

      <div className="border-t border-amber-500/[0.08]" />

      <AnimatePresence mode="wait">
        {(step === "locked" || step === "email") && (
          <motion.div key="email-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
            <form onSubmit={handleSendCode}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#e0e0e0] font-mono focus:border-amber-500/30 outline-none mb-3" />
              <button type="submit" disabled={loading}
                className="w-full text-black font-mono font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent, #00ff88)" }}>
                {loading ? "Sending..." : "Send unlock code →"}
              </button>
            </form>
          </motion.div>
        )}
        {step === "code" && (
          <motion.div key="code-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={spring} className="p-4">
            <form onSubmit={handleVerify}>
              <p className="text-xs mb-3 font-mono" style={{ color: "var(--accent, #00ff88)" }}>Code sent to {email}</p>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-lg tracking-widest text-center mb-3 outline-none"
                style={{ color: "var(--accent, #00ff88)" }} />
              <button type="submit" disabled={loading}
                className="w-full text-black font-mono font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent, #00ff88)" }}>
                {loading ? "Verifying..." : "Verify code →"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="text-xs text-red-400 px-4 pb-3">{error}</p>}
    </div>
  )
}

// ─── ProfileDropCard ─────────────────────────────────────────

function ProfileDropCard({ block, accentColor }: BaseBlockProps) {
  const cfg = (block.config || {}) as Record<string, unknown>
  const dropAt = (cfg.dropAt as string) || new Date().toISOString()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const target = new Date(dropAt).getTime()
  const diff = target - now
  const isLive = diff <= 0 && diff > -86400000
  const isEnded = diff <= -86400000
  const isScheduled = diff > 0

  const hours = Math.max(0, Math.floor(diff / 3600000))
  const minutes = Math.max(0, Math.floor((diff % 3600000) / 60000))
  const seconds = Math.max(0, Math.floor((diff % 60000) / 1000))

  const status = isEnded ? "ENDED" : isLive ? "LIVE" : "SCHEDULED"
  const statusColor = isEnded ? "#555" : accentColor

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: `${accentColor}0a`,
        border: `1px solid ${accentColor}33`,
      }}
    >
      <div className="h-[2px]" style={{ background: `linear-gradient(to right, transparent, ${accentColor}66, transparent)` }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {isLive && (
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: accentColor }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: statusColor }}>
            DROP · {status}
          </span>
        </div>
        <p className="text-[15px] font-semibold text-white mb-3">{block.title}</p>

        {isScheduled && (
          <div className="flex gap-2">
            {[
              { label: "HR", value: String(hours).padStart(2, "0") },
              { label: "MIN", value: String(minutes).padStart(2, "0") },
              { label: "SEC", value: String(seconds).padStart(2, "0") },
            ].map((unit) => (
              <div key={unit.label} className="bg-black/40 rounded-lg px-3 py-2 text-center min-w-[48px]">
                <motion.div
                  key={unit.value}
                  initial={{ scale: 1.1, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="font-mono font-bold text-lg leading-none"
                  style={{ color: accentColor }}
                >
                  {unit.value}
                </motion.div>
                <div className="text-[8px] font-mono text-[#555] mt-1">{unit.label}</div>
              </div>
            ))}
          </div>
        )}

        {isLive && (
          <div className="flex gap-2">
            <DropCard drop={{
              id: block.id, title: block.title,
              description: block.description || (cfg.description as string) || undefined,
              dropAt, revealUrl: (cfg.revealUrl as string) || block.url || undefined,
              revealText: (cfg.revealText as string) || undefined,
              status: "live", limitedSpots: cfg.limitedSpots as number | undefined,
              spotsLeft: cfg.spotsLeft as number | undefined,
            }} />
          </div>
        )}

        {isEnded && (cfg.revealUrl || cfg.revealText || block.url) && (
          <div className="mt-2">
            {(cfg.revealText as string) && (
              <p className="text-sm text-[#888] mb-2">{cfg.revealText as string}</p>
            )}
            {((cfg.revealUrl as string) || block.url) && (
              <a href={(cfg.revealUrl as string) || block.url || "#"} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-black font-mono font-semibold rounded-xl px-4 py-2.5 text-sm hover:opacity-90 transition-opacity"
                style={{ background: accentColor }}>
                View reveal →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ProfileYouTubeCard ──────────────────────────────────────

function ProfileYouTubeCard({ block }: BaseBlockProps) {
  const cfg = (block.config || {}) as Record<string, unknown>
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    const channelId = cfg.channelId as string
    if (!channelId) { setFetchError(true); return }
    fetch(`/api/social/youtube?channelId=${channelId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setFetchError(true))
  }, [cfg.channelId])

  if (fetchError) {
    return (
      <div className="bg-red-500/[0.03] border border-red-500/[0.15] rounded-2xl p-5 text-center">
        <p className="text-xs text-[#888] font-mono">Could not load latest video</p>
      </div>
    )
  }

  if (!data) {
    return <div className="bg-red-500/[0.03] border border-red-500/[0.15] rounded-2xl h-[180px] animate-pulse" />
  }

  const videoId = data.videoId as string
  const thumbnail = data.thumbnail as string
  const title = data.title as string
  const publishedAt = data.publishedAt as string
  const viewCount = data.viewCount as number
  const duration = data.duration as string

  const timeAgo = publishedAt ? formatTimeAgo(publishedAt) : ""
  const views = viewCount ? formatViews(viewCount) : ""

  return (
    <a
      href={`https://youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackBlockClick(block.id)}
      className="block rounded-2xl overflow-hidden bg-red-500/[0.03] border border-red-500/[0.15] hover:border-red-500/30 transition-colors"
    >
      <motion.div className="relative h-[100px] overflow-hidden" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
        <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {timeAgo && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
            NEW · {timeAgo}
          </div>
        )}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
            {duration}
          </div>
        )}
      </motion.div>
      <div className="p-3">
        <p className="text-xs font-medium text-white line-clamp-2">{title}</p>
        {views && <p className="text-[10px] text-[#555] font-mono mt-1">{views} views · {timeAgo}</p>}
      </div>
    </a>
  )
}

// ─── ProfileProductCard ──────────────────────────────────────

function ProfileProductCard({ block, creatorStripeReady }: BaseBlockProps) {
  const cfg = (block.config || {}) as Record<string, unknown>
  const [loading, setLoading] = useState(false)
  const price = cfg.price as number | undefined
  const formattedPrice = price ? `$${(price / 100).toFixed(2)}` : null

  const handleBuy = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/blocks/${block.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error || "Checkout failed")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-blue-500/[0.03] border border-blue-500/[0.15] rounded-2xl overflow-hidden">
      {block.thumbnail ? (
        <div className="relative h-[90px] overflow-hidden">
          <img src={block.thumbnail} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 to-transparent" />
          <div className="absolute top-2 left-2">
            <span className="bg-blue-500/20 text-blue-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Shop
            </span>
          </div>
        </div>
      ) : (
        <div className="h-[60px] bg-gradient-to-br from-blue-500/10 to-blue-500/[0.02] flex items-center justify-center">
          <ShoppingBag size={20} className="text-blue-400/40" />
        </div>
      )}
      <div className="p-4">
        <p className="text-sm font-medium text-white mb-1">{block.title}</p>
        {block.description && <p className="text-xs text-[#666] mb-2 line-clamp-2">{block.description}</p>}
        {formattedPrice && (
          <p className="text-base font-mono font-bold mb-3" style={{ color: "var(--accent, #00ff88)" }}>{formattedPrice}</p>
        )}
        {!creatorStripeReady ? (
          <div className="text-[#444] font-mono text-xs">Payments not set up</div>
        ) : (
          <button onClick={handleBuy} disabled={loading}
            className="w-full text-black font-mono font-semibold rounded-xl px-4 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: "var(--accent, #00ff88)" }}>
            {loading ? "Loading..." : "Buy now →"}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Generic blocks (unchanged logic, kept for compatibility) ─

function PodcastBlock({ block, cfg }: { block: Block; cfg: Record<string, unknown> }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!cfg.rssUrl) { setError(true); return }
    fetch(`/api/social/podcast?rssUrl=${encodeURIComponent(cfg.rssUrl as string)}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true))
  }, [cfg.rssUrl])

  if (error || (!data && !cfg.rssUrl)) {
    return (
      <div className="bg-amber-500/[0.03] border border-amber-500/[0.12] rounded-2xl p-5 text-center">
        <p className="text-xs text-[#888] font-mono">Could not load podcast</p>
      </div>
    )
  }

  if (!data) {
    return <div className="bg-amber-500/[0.03] border border-amber-500/[0.12] rounded-2xl h-[120px] animate-pulse" />
  }

  const episode = (data.episode || {}) as Record<string, unknown>
  const duration = episode.duration as string | undefined
  const formattedDuration = duration ? formatPodcastDuration(String(duration)) : null
  const pubDate = episode.pubDate as string | undefined
  const relativeDate = pubDate ? formatRelativeTime(pubDate) : null
  const audioUrl = episode.audioUrl as string | undefined

  return (
    <div className="bg-amber-500/[0.03] border border-amber-500/[0.12] rounded-2xl p-4">
      <div className="flex gap-3 mb-3">
        {(data.showImage as string) && (
          <img src={data.showImage as string} alt="" className="w-[52px] h-[52px] rounded-xl object-cover flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/60 mb-0.5">{(data.showTitle as string) || "Podcast"}</p>
          <p className="text-sm font-medium text-white line-clamp-2">{(episode.title as string) || "Latest episode"}</p>
          {(formattedDuration || relativeDate) && (
            <p className="text-[10px] text-[#555] font-mono mt-1">
              {formattedDuration}{formattedDuration && relativeDate && " · "}{relativeDate}
            </p>
          )}
        </div>
      </div>
      {audioUrl && (
        <audio src={audioUrl} controls className="w-full h-8 mt-2" style={{ colorScheme: "dark" }} />
      )}
    </div>
  )
}

function SpotifyBlock({ block, cfg }: { block: Block; cfg: Record<string, unknown> }) {
  const playlistUrl = cfg.playlistUrl as string | undefined
  if (playlistUrl) {
    const embedUrl = playlistUrl.replace("open.spotify.com/", "open.spotify.com/embed/")
    return (
      <div className="rounded-2xl overflow-hidden border border-[#1DB954]/20">
        <iframe src={embedUrl} width="100%" height="152" allow="encrypted-media" className="border-0" />
      </div>
    )
  }
  return (
    <div className="bg-white/[0.02] border border-[#1DB954]/20 rounded-2xl p-5 text-center">
      <div className="w-10 h-10 rounded-xl bg-[#1DB954]/10 flex items-center justify-center mx-auto mb-2">
        <SpotifyIcon size={20} />
      </div>
      <p className="text-xs text-[#888] font-mono">Connect Spotify coming soon</p>
    </div>
  )
}

function TwitchBlock({ block, cfg }: { block: Block; cfg: Record<string, unknown> }) {
  const twitchUsername = (cfg.username as string) || ""
  const [data, setData] = useState<{ isLive: boolean; title?: string; game?: string; viewers?: number; username: string } | null>(null)
  const [loading, setLoading] = useState(!!twitchUsername)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!twitchUsername) return
    fetch(`/api/social/twitch?username=${encodeURIComponent(twitchUsername)}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [twitchUsername])

  if (loading) {
    return <div className="bg-purple-500/[0.03] border border-purple-500/[0.12] rounded-2xl h-[80px] animate-pulse" />
  }

  if (!twitchUsername || error) {
    return (
      <div className="bg-purple-500/[0.03] border border-purple-500/[0.12] rounded-2xl p-4">
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <TwitchIcon size={20} />
          </div>
          <span className="text-xs font-mono text-purple-400/60">Connect your Twitch</span>
        </div>
      </div>
    )
  }

  if (data?.isLive) {
    return (
      <div className="bg-purple-500/[0.04] border border-purple-500/[0.2] rounded-2xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 bg-purple-500/[0.15] border border-purple-500/[0.3] rounded-full px-3 py-1">
              <motion.div className="w-2 h-2 rounded-full bg-purple-400"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-xs font-mono text-purple-300">LIVE</span>
            </div>
            <span className="text-xs font-mono text-purple-400/80">{data.viewers?.toLocaleString()} viewers</span>
          </div>
          <p className="text-sm font-medium text-white mb-1 line-clamp-2">{data.title}</p>
          {data.game && <p className="text-xs font-mono text-purple-400">{data.game}</p>}
        </div>
        <a href={`https://twitch.tv/${twitchUsername}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 border-t border-purple-500/[0.15] text-sm font-mono text-purple-300 hover:bg-purple-500/[0.05] transition-colors">
          Watch on Twitch →
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <TwitchIcon size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{block.title || twitchUsername}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#555]" />
              <span className="text-[10px] font-mono text-[#555]">Currently offline</span>
            </div>
          </div>
        </div>
      </div>
      <a href={`https://twitch.tv/${twitchUsername}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/[0.05] text-sm font-mono text-[#555] hover:text-[#888] hover:bg-white/[0.02] transition-colors">
        Follow on Twitch →
      </a>
    </div>
  )
}

// ─── Lock Wrapper ────────────────────────────────────────────

function LockedBlock({ block, userId, cfg, accentColor, buttonStyle, username, creatorStripeReady }: {
  block: Block; userId: string; cfg: Record<string, unknown>; accentColor: string; buttonStyle: string; username: string; creatorStripeReady: boolean
}) {
  const [unlocked, setUnlocked] = useState(false)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"locked" | "email" | "code">("locked")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [ageConfirmed, setAgeConfirmed] = useState(false)

  useEffect(() => {
    if (block.lockType === "email") {
      const key = `vault_unlocked_${block.id}`
      if (localStorage.getItem(key)) setUnlocked(true)
    }
  }, [block.lockType, block.id])

  if (unlocked || ageConfirmed) {
    return <BlockContent block={block} userId={userId} cfg={cfg} accentColor={accentColor} buttonStyle={buttonStyle} username={username} creatorStripeReady={creatorStripeReady} />
  }

  if (block.lockType === "email") {
    const handleSendCode = async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)
      try {
        const res = await fetch("/api/vault/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, linkId: block.id, ownerId: userId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed")
        if (data.alreadyVerified) {
          localStorage.setItem(`vault_unlocked_${block.id}`, email)
          setUnlocked(true)
        } else {
          setStep("code")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error")
      } finally {
        setLoading(false)
      }
    }

    const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)
      try {
        const res = await fetch("/api/vault/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, linkId: block.id, ownerId: userId, code }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed")
        localStorage.setItem(`vault_unlocked_${block.id}`, email)
        setUnlocked(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error")
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="bg-amber-500/[0.04] border border-amber-500/[0.15] rounded-2xl overflow-hidden">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/[0.08] border border-amber-500/[0.2] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{block.title}</p>
              <p className="text-xs text-[#888]">Unlock with email</p>
            </div>
          </div>
        </div>
        <div className="border-t border-amber-500/[0.08]" />
        <div className="p-4">
          {step === "locked" || step === "email" ? (
            <form onSubmit={handleSendCode}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#e0e0e0] font-mono focus:border-amber-500/30 outline-none mb-3" />
              <button type="submit" disabled={loading}
                className="w-full text-black font-mono font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent, #00ff88)" }}>
                {loading ? "Sending..." : "Send unlock code →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <p className="text-xs mb-3 font-mono" style={{ color: "var(--accent, #00ff88)" }}>Code sent to {email}</p>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-lg tracking-widest text-center mb-3 outline-none"
                style={{ color: "var(--accent, #00ff88)" }} />
              <button type="submit" disabled={loading}
                className="w-full text-black font-mono font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent, #00ff88)" }}>
                {loading ? "Verifying..." : "Verify code →"}
              </button>
            </form>
          )}
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
        </div>
      </div>
    )
  }

  if (block.lockType === "payment") {
    const price = (cfg.price as number) ? `$${((cfg.price as number) / 100).toFixed(2)}` : null
    return (
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💰</span>
          <span className="text-sm font-semibold text-white">{block.title}</span>
        </div>
        {price && <p className="text-lg font-mono font-bold mb-3" style={{ color: "var(--accent, #00ff88)" }}>{price}</p>}
        <button
          onClick={async () => {
            setLoading(true)
            try {
              const res = await fetch(`/api/blocks/${block.id}/checkout`, { method: "POST" })
              const data = await res.json()
              if (data.url) window.location.href = data.url
              else toast.error(data.error || "Checkout failed")
            } catch { toast.error("Network error") }
            finally { setLoading(false) }
          }}
          disabled={loading}
          className="w-full text-black font-mono font-semibold rounded-xl px-4 py-3 text-sm disabled:opacity-50"
          style={{ background: "var(--accent, #00ff88)" }}
        >
          {loading ? "Loading..." : "Buy to unlock →"}
        </button>
      </div>
    )
  }

  if (block.lockType === "password") {
    return (
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔑</span>
          <span className="text-sm font-semibold text-white">{block.title}</span>
        </div>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <form onSubmit={(e) => {
          e.preventDefault()
          if (password === block.lockValue) setUnlocked(true)
          else setError("Wrong password")
        }} className="flex gap-2">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none" />
          <button type="submit" className="text-black font-mono font-semibold rounded-xl px-4 py-2.5 text-sm" style={{ background: "var(--accent, #00ff88)" }}>Unlock</button>
        </form>
      </div>
    )
  }

  if (block.lockType === "age") {
    return (
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 text-center">
        <div className="text-2xl mb-2">🔞</div>
        <p className="text-sm text-white font-semibold mb-1">{block.title}</p>
        <p className="text-xs text-[#888] mb-4">You must be 18+ to view this content</p>
        <button onClick={() => setAgeConfirmed(true)}
          className="text-black font-mono font-semibold rounded-xl px-6 py-3 text-sm"
          style={{ background: "var(--accent, #00ff88)" }}>
          I am 18 or older
        </button>
      </div>
    )
  }

  return null
}

// ─── Content blocks (FAQ, Contact, Discount) ─────────────────

function FaqBlock({ block, cfg }: { block: Block; cfg: Record<string, unknown> }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const items: { question: string; answer: string }[] =
    Array.isArray(cfg.items) && (cfg.items as { question: string; answer: string }[]).length > 0
      ? (cfg.items as { question: string; answer: string }[])
      : [{ question: block.title, answer: (cfg.answer as string) || "" }]

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
      {items.map((item, idx) => (
        <div key={idx} className={idx > 0 ? "border-t border-white/[0.05]" : ""}>
          <button onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            className="w-full flex items-center justify-between px-5 py-4 text-left">
            <span className="text-sm font-medium text-[#e0e0e0]">{item.question}</span>
            <motion.svg className="w-4 h-4 text-[#444] flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              animate={{ rotate: expandedIdx === idx ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {expandedIdx === idx && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                <div className="px-5 pb-4 text-sm text-[#666] leading-relaxed">{item.answer}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function ContactFormBlock({ block, username }: { block: Block; username: string }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, creatorUsername: username }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error((data as Record<string, string>).error || "Failed to send message")
        return
      }
      setSent(true)
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "var(--accent, #00ff88)1a" }}>
          <svg className="w-5 h-5" style={{ color: "var(--accent, #00ff88)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[#e0e0e0]">Message sent!</p>
        <p className="text-xs text-[#555] mt-1">They&apos;ll get back to you soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-3">
      <p className="text-sm font-medium text-[#e0e0e0] mb-1">{block.title || "Get in touch"}</p>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" required rows={3}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30 resize-none" />
      <button type="submit" disabled={loading}
        className="w-full text-black font-mono font-semibold rounded-xl px-4 py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ background: "var(--accent, #00ff88)" }}>
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  )
}

function DiscountCodeBlock({ block, cfg }: { block: Block; cfg: Record<string, unknown> }) {
  const code = (cfg.code as string) || "CODE"
  const description = cfg.description as string | undefined
  const expiresAt = cfg.expiresAt as string | undefined

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
      {block.title && <p className="text-sm font-medium text-[#e0e0e0] mb-3">{block.title}</p>}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-black/40 border border-white/[0.1] rounded-xl p-4 text-center font-mono text-xl tracking-widest" style={{ color: "var(--accent, #00ff88)" }}>
          {code}
        </div>
        <button onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied!") }}
          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-colors" title="Copy code">
          <svg className="w-5 h-5 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={1.5} />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={1.5} />
          </svg>
        </button>
      </div>
      {description && <p className="text-xs text-[#555] mt-3">{description}</p>}
      {expiresAt && <p className="text-xs text-[#444] mt-2 font-mono">Expires: {new Date(expiresAt).toLocaleDateString()}</p>}
    </div>
  )
}
