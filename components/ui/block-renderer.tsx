"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
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
        <h2 className="text-2xl font-bold text-[#f0f0f0] text-center py-4">{block.title}</h2>
      ) : (
        <p className="text-[#666] text-sm leading-relaxed px-1 py-2">{(cfg.content as string) || block.title}</p>
      )

    case "image":
      return (
        <div className="w-full">
          {(block.thumbnail || cfg.imageUrl) ? (
            <img
              src={(block.thumbnail || cfg.imageUrl) as string}
              alt={block.title || ""}
              className="w-full rounded-2xl object-cover"
            />
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
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-0.5">Portal</div>
              <div className="text-base font-semibold text-white">{block.title}</div>
            </div>
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
            {children.map((child, i) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
              >
                <BlockRenderer
                  block={{ ...child, children: [] }}
                  userId={userId}
                  accentColor={accentColor}
                  buttonStyle={buttonStyle}
                  username={username}
                />
              </motion.div>
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
          <motion.div
            className="w-10 h-10 rounded-full bg-[rgba(255,200,0,0.1)] flex items-center justify-center flex-shrink-0"
            whileHover={{ rotate: [-3, 3, 0], transition: { duration: 0.3 } }}
          >
            <svg className="w-6 h-6 text-[rgba(255,200,0,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </motion.div>
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
      <motion.div
        className="relative h-[130px] overflow-hidden"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
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
      </motion.div>
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

type TwitchData = { isLive: boolean; title?: string; game?: string; viewers?: number; username: string }

function TwitchBlock({ block, cfg }: { block: Block; cfg: Record<string, any> }) {
  const twitchUsername = (cfg.username as string) || ""
  const [data, setData] = useState<TwitchData | null>(null)
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

  const TwitchIcon = (
    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  )

  if (loading) {
    return (
      <div className="bg-purple-500/[0.03] border border-purple-500/[0.12] rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-purple-500/10 rounded w-2/3" />
            <div className="h-2 bg-purple-500/[0.06] rounded w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!twitchUsername || error) {
    return (
      <div className="bg-purple-500/[0.03] border border-purple-500/[0.12] rounded-2xl p-4">
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            {TwitchIcon}
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
              <motion.div
                className="w-2 h-2 rounded-full bg-purple-400"
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
        <a
          href={`https://twitch.tv/${twitchUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 border-t border-purple-500/[0.15] text-sm font-mono text-purple-300 hover:bg-purple-500/[0.05] transition-colors"
        >
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
            {TwitchIcon}
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
      <a
        href={`https://twitch.tv/${twitchUsername}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/[0.05] text-sm font-mono text-[#555] hover:text-[#888] hover:bg-white/[0.02] transition-colors"
      >
        Follow on Twitch →
      </a>
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
            <motion.div
              className="w-10 h-10 rounded-full bg-[rgba(255,200,0,0.1)] flex items-center justify-center flex-shrink-0"
              whileHover={{ rotate: [-3, 3, 0], transition: { duration: 0.3 } }}
            >
              <svg className="w-6 h-6 text-[rgba(255,200,0,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </motion.div>
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
          <button
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-sm font-medium text-[#e0e0e0]">{item.question}</span>
            <motion.svg
              className="w-4 h-4 text-[#444] flex-shrink-0 ml-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: expandedIdx === idx ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {expandedIdx === idx && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 text-sm text-[#666] leading-relaxed">
                  {item.answer}
                </div>
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
        toast.error(data.error || "Failed to send message")
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
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#00ff88]/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        required
        rows={3}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30 resize-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  )
}

function DiscountCodeBlock({ block, cfg }: { block: Block; cfg: Record<string, unknown> }) {
  const code = (cfg.code as string) || "CODE"
  const description = cfg.description as string | undefined
  const expiresAt = cfg.expiresAt as string | undefined

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    toast.success("Copied!")
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
      {block.title && <p className="text-sm font-medium text-[#e0e0e0] mb-3">{block.title}</p>}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-black/40 border border-white/[0.1] rounded-xl p-4 text-center font-mono text-[#00ff88] text-xl tracking-widest">
          {code}
        </div>
        <button
          onClick={handleCopy}
          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-colors"
          title="Copy code"
        >
          <svg className="w-5 h-5 text-[#888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={1.5} />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth={1.5} />
          </svg>
        </button>
      </div>
      {description && <p className="text-xs text-[#555] mt-3">{description}</p>}
      {expiresAt && (
        <p className="text-xs text-[#444] mt-2 font-mono">
          Expires: {new Date(expiresAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
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
