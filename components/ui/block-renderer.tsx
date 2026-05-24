"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LinkCard3D } from "./link-card-3d"
import { GlassBrick } from "./obsidian-card"
import { CryptoVaultPortal } from "./crypto-vault"
import { LiveStatusPill } from "./live-status-pill"
import { SocialIcon } from "@/components/social-icon"
import { DropCard, type Drop } from "./drop-card"

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
  lockType?: string
  lockValue?: string | null
  config?: Record<string, unknown>
  children?: BlockChild[]
}

interface BlockRendererProps {
  block: Block
  userId: string
  accentColor: string
  buttonStyle: string
  username: string
}

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

export function BlockRenderer({ block, userId, accentColor, buttonStyle, username }: BlockRendererProps) {
  const cfg = (block.config || {}) as Record<string, any>

  if (block.lockType && block.lockType !== "none") {
    return <LockedBlock block={block} userId={userId} cfg={cfg} accentColor={accentColor} buttonStyle={buttonStyle} username={username} />
  }

  return <BlockContent block={block} userId={userId} cfg={cfg} accentColor={accentColor} buttonStyle={buttonStyle} username={username} />
}

function BlockContent({ block, userId, cfg, accentColor, buttonStyle, username }: {
  block: Block
  userId: string
  cfg: Record<string, any>
  accentColor: string
  buttonStyle: string
  username: string
}) {
  switch (block.type) {
    case "link":
      return (
        <div className={block.size === "half" ? "w-[calc(50%-6px)]" : "w-full"}>
          <LinkCard3D
            title={block.title}
            url={block.url || cfg.url || "#"}
            icon={cfg.icon || "🔗"}
            variant={(block.style || buttonStyle || "glass") as any}
            onTrackClick={() => trackBlockClick(block.id)}
          />
        </div>
      )

    case "collection":
      return <CollectionBlock block={block} userId={userId} accentColor={accentColor} buttonStyle={buttonStyle} username={username} />

    case "vault":
      return <VaultBlock block={block} userId={userId} cfg={cfg} />

    case "drop":
      return <DropBlock block={block} cfg={cfg} />

    case "product":
      return <ProductBlock block={block} cfg={cfg} />

    case "youtube":
      return <YouTubeBlock block={block} cfg={cfg} />

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
          <div className="text-3xl font-bold text-[#00ff88] font-mono">{cfg.value || "0"}</div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#444] mt-2">{cfg.label || block.title}</div>
        </div>
      )

    case "live_status":
      return cfg.isLive ? (
        <div className="bg-red-500/[0.05] border border-red-500/[0.15] rounded-2xl p-4 flex items-center justify-center">
          <LiveStatusPill message={cfg.message || block.title} />
        </div>
      ) : null

    case "text":
      return cfg.style === "heading" ? (
        <h2 className="text-2xl font-bold text-white px-1">{block.title}</h2>
      ) : (
        <p className="text-[#888] text-sm leading-relaxed px-1">{block.description || block.title}</p>
      )

    case "image":
      return (
        <div className="w-full">
          <img
            src={block.thumbnail || cfg.imageUrl || ""}
            alt={block.title || ""}
            className="w-full rounded-2xl object-cover"
          />
          {block.title && block.title !== "Untitled" && (
            <p className="text-xs text-[#555] font-mono mt-2 text-center">{block.title}</p>
          )}
        </div>
      )

    case "social_link":
      return null

    default:
      return null
  }
}

function CollectionBlock({ block, userId, accentColor, buttonStyle, username }: {
  block: Block
  userId: string
  accentColor: string
  buttonStyle: string
  username: string
}) {
  const [expanded, setExpanded] = useState(false)
  const children = block.children || []

  return (
    <div className="w-full">
      <GlassBrick
        onClick={() => setExpanded(!expanded)}
        className="w-full"
      >
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Portal</div>
            <div className="text-base font-semibold text-white">{block.title}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#555] font-mono">{children.length} items</span>
            <motion.svg
              className="w-4 h-4 text-[#00ff88]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </motion.svg>
          </div>
        </div>
      </GlassBrick>

      <AnimatePresence>
        {expanded && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pl-4 border-l border-white/[0.07] ml-4 mt-2 space-y-2"
          >
            {children.map((child) => (
              <BlockRenderer
                key={child.id}
                block={{ ...child, children: [] }}
                userId={userId}
                accentColor={accentColor}
                buttonStyle={buttonStyle}
                username={username}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function VaultBlock({ block, userId, cfg }: { block: Block; userId: string; cfg: Record<string, any> }) {
  const [step, setStep] = useState<"locked" | "email" | "code" | "unlocked">("locked")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    const key = `vault-${userId}-${block.id}`
    if (localStorage.getItem(key)) {
      setStep("unlocked")
    }
  }, [userId, block.id])

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
        localStorage.setItem(`vault-${userId}-${block.id}`, email)
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
      localStorage.setItem(`vault-${userId}-${block.id}`, email)
      setContent(data.content || null)
      setStep("unlocked")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (step === "unlocked") {
    return (
      <div className="bg-[rgba(255,200,0,0.03)] border border-[rgba(255,200,0,0.15)] rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[rgba(0,255,136,0.1)] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{block.title}</p>
              <p className="text-xs text-[#00ff88]">Unlocked</p>
            </div>
          </div>
          {(content?.vaultContent || cfg.content) && (
            <p className="text-sm text-[#e0e0e0] font-mono whitespace-pre-wrap mb-3">{content?.vaultContent || cfg.content}</p>
          )}
          {(content?.downloadUrl || cfg.downloadUrl) && (
            <a
              href={content?.downloadUrl || cfg.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              ↓ {content?.downloadName || cfg.downloadName || "Download"}
            </a>
          )}
          {(content?.url || block.url) && (
            <a
              href={content?.url || block.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              Access now →
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[rgba(255,200,0,0.03)] border border-[rgba(255,200,0,0.15)] rounded-2xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(255,200,0,0.1)] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-[rgba(255,200,0,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{block.title}</p>
            <p className="text-xs text-[#888]">Unlock with email</p>
          </div>
        </div>
        {cfg.content && (
          <p className="text-sm text-[#888] font-mono select-none" style={{ filter: "blur(4px)" }}>
            {String(cfg.content).slice(0, 50)}
          </p>
        )}
      </div>

      <div className="border-t border-[rgba(255,200,0,0.08)]" />

      <div className="p-4">
        {step === "locked" || step === "email" ? (
          <form onSubmit={handleSendCode}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#e0e0e0] font-mono focus:border-[rgba(255,200,0,0.3)] outline-none mb-3"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send unlock code →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p className="text-xs text-[#00ff88] mb-3">Code sent to {email}</p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-[#00ff88] text-lg tracking-widest text-center mb-3 outline-none focus:border-[#00ff88]/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify code →"}
            </button>
          </form>
        )}
        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      </div>
    </div>
  )
}

function DropBlock({ block, cfg }: { block: Block; cfg: Record<string, any> }) {
  const drop: Drop = {
    id: block.id,
    title: block.title,
    description: block.description || cfg.description || undefined,
    dropAt: cfg.dropAt || new Date().toISOString(),
    revealUrl: cfg.revealUrl || block.url || undefined,
    revealText: cfg.revealText || undefined,
    status: cfg.status || "scheduled",
    limitedSpots: cfg.limitedSpots ?? undefined,
    spotsLeft: cfg.spotsLeft ?? undefined,
  }
  return <DropCard drop={drop} />
}

function ProductBlock({ block, cfg }: { block: Block; cfg: Record<string, any> }) {
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
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Checkout failed")
      }
    } catch {
      alert("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
      {block.thumbnail && (
        <div className="relative h-[130px] overflow-hidden">
          <img src={block.thumbnail} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>
      )}
      <div className="p-5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Shop</div>
        <div className="text-base font-semibold text-white mb-1">{block.title}</div>
        {block.description && (
          <p className="text-xs text-[#888] mb-3">{block.description}</p>
        )}
        {formattedPrice && (
          <div className="text-lg font-mono font-bold text-[#00ff88] mb-3">{formattedPrice}</div>
        )}
        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Loading..." : "Buy now →"}
        </button>
      </div>
    </div>
  )
}

function YouTubeBlock({ block, cfg }: { block: Block; cfg: Record<string, any> }) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!cfg.channelId) { setError(true); return }
    fetch(`/api/social/youtube?channelId=${cfg.channelId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true))
  }, [cfg.channelId])

  if (error) {
    return (
      <div className="bg-white/[0.02] border border-red-500/20 rounded-2xl p-5 text-center">
        <p className="text-xs text-[#888] font-mono">Could not load latest video</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl h-[200px] animate-pulse" />
    )
  }

  const timeAgo = data.publishedAt ? formatTimeAgo(data.publishedAt) : ""
  const views = data.viewCount ? formatViews(data.viewCount) : ""

  return (
    <a
      href={`https://youtube.com/watch?v=${data.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackBlockClick(block.id)}
      className="block bg-white/[0.02] border border-red-500/20 rounded-2xl overflow-hidden hover:border-red-500/40 transition-colors"
    >
      <div className="relative h-[130px]">
        <img src={data.thumbnail} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {timeAgo && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
            NEW · {timeAgo}
          </div>
        )}
        {data.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
            {data.duration}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-white line-clamp-2">{data.title}</p>
        {views && <p className="text-xs text-[#555] font-mono mt-1">{views} views · {timeAgo}</p>}
      </div>
    </a>
  )
}

function PodcastBlock({ block, cfg }: { block: Block; cfg: Record<string, any> }) {
  const [data, setData] = useState<any>(null)
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

  const duration = data.episode?.duration
  const formattedDuration = duration
    ? `${Math.floor(Number(duration) / 60)}:${(Number(duration) % 60).toString().padStart(2, "0")}`
    : null

  const relativeDate = data.episode?.pubDate ? formatRelativeTime(data.episode.pubDate) : null

  return (
    <div className="bg-amber-500/[0.03] border border-amber-500/[0.12] rounded-2xl p-4">
      <div className="flex gap-3 mb-3">
        {data.showImage && (
          <img src={data.showImage} alt="" className="w-[52px] h-[52px] rounded-xl object-cover flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/60 mb-0.5">{data.showTitle || "Podcast"}</p>
          <p className="text-sm font-medium text-white line-clamp-2">{data.episode?.title || "Latest episode"}</p>
          {(formattedDuration || relativeDate) && (
            <p className="text-[10px] text-[#555] font-mono mt-1">
              {formattedDuration}{formattedDuration && relativeDate && " · "}{relativeDate}
            </p>
          )}
        </div>
      </div>
      {data.episode?.audioUrl && (
        <audio src={data.episode.audioUrl} controls className="w-full h-8 mt-2" style={{ colorScheme: "dark" }} />
      )}
    </div>
  )
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

function SpotifyBlock({ block, cfg }: { block: Block; cfg: Record<string, any> }) {
  const playlistUrl = cfg.playlistUrl as string | undefined

  if (playlistUrl) {
    const embedUrl = playlistUrl.replace("open.spotify.com/", "open.spotify.com/embed/")
    return (
      <div className="rounded-2xl overflow-hidden border border-[#1DB954]/20">
        <iframe
          src={embedUrl}
          width="100%"
          height="152"
          allow="encrypted-media"
          className="border-0"
        />
      </div>
    )
  }

  return (
    <div className="bg-white/[0.02] border border-[#1DB954]/20 rounded-2xl p-5 text-center">
      <div className="text-3xl mb-2">🎵</div>
      <p className="text-xs text-[#888] font-mono">Connect Spotify coming soon</p>
    </div>
  )
}

function TwitchBlock({ block, cfg }: { block: Block; cfg: Record<string, any> }) {
  const twitchUsername = cfg.username as string | undefined

  return (
    <div className="bg-white/[0.02] border border-purple-500/20 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-white">{block.title || twitchUsername}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-[#555]" />
            <span className="text-[10px] font-mono text-[#555]">Offline</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LockedBlock({ block, userId, cfg, accentColor, buttonStyle, username }: {
  block: Block
  userId: string
  cfg: Record<string, any>
  accentColor: string
  buttonStyle: string
  username: string
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
      const key = `vault-${userId}-${block.id}`
      if (localStorage.getItem(key)) setUnlocked(true)
    }
  }, [block.lockType, userId, block.id])

  if (unlocked || ageConfirmed) {
    return <BlockContent block={block} userId={userId} cfg={cfg} accentColor={accentColor} buttonStyle={buttonStyle} username={username} />
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
          localStorage.setItem(`vault-${userId}-${block.id}`, email)
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
        localStorage.setItem(`vault-${userId}-${block.id}`, email)
        setUnlocked(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error")
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="bg-[rgba(255,200,0,0.03)] border border-[rgba(255,200,0,0.15)] rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[rgba(255,200,0,0.1)] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[rgba(255,200,0,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{block.title}</p>
              <p className="text-xs text-[#888]">Unlock with email</p>
            </div>
          </div>
          {cfg.content && (
            <p className="text-sm text-[#888] font-mono select-none" style={{ filter: "blur(4px)" }}>
              {String(cfg.content).slice(0, 50)}
            </p>
          )}
        </div>
        <div className="border-t border-[rgba(255,200,0,0.08)]" />
        <div className="p-4">
          {step === "locked" || step === "email" ? (
            <form onSubmit={handleSendCode}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#e0e0e0] font-mono focus:border-[rgba(255,200,0,0.3)] outline-none mb-3" />
              <button type="submit" disabled={loading} className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? "Sending..." : "Send unlock code →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <p className="text-xs text-[#00ff88] mb-3">Code sent to {email}</p>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" maxLength={6} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-[#00ff88] text-lg tracking-widest text-center mb-3 outline-none focus:border-[#00ff88]/30" />
              <button type="submit" disabled={loading} className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
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
    const price = cfg.price ? `$${(cfg.price / 100).toFixed(2)}` : null
    return (
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span>💰</span>
          <span className="text-sm font-semibold text-white">{block.title}</span>
        </div>
        {price && <p className="text-lg font-mono font-bold text-[#00ff88] mb-3">{price}</p>}
        <button
          onClick={async () => {
            setLoading(true)
            try {
              const res = await fetch(`/api/blocks/${block.id}/checkout`, { method: "POST" })
              const data = await res.json()
              if (data.url) window.location.href = data.url
              else alert(data.error || "Checkout failed")
            } catch { alert("Network error") }
            finally { setLoading(false) }
          }}
          disabled={loading}
          className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-3 text-sm disabled:opacity-50"
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
          <span>🔑</span>
          <span className="text-sm font-semibold text-white">{block.title}</span>
        </div>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <form onSubmit={(e) => {
          e.preventDefault()
          if (password === block.lockValue) setUnlocked(true)
          else setError("Wrong password")
        }} className="flex gap-2">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none" />
          <button type="submit" className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-2.5 text-sm">Unlock</button>
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
        <button
          onClick={() => setAgeConfirmed(true)}
          className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-6 py-3 text-sm"
        >
          I am 18 or older
        </button>
      </div>
    )
  }

  return null
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
