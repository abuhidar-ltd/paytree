"use client"

import { useEffect, useState } from "react"

interface YoutubeChannelModuleProps {
  config: { channelId?: string }
  span?: 1 | 2 | 4
}

interface LatestVideo {
  videoId: string
  title: string
  thumbnail: string
  viewCount?: number
  publishedAt: string
  channelTitle: string
  duration?: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${Math.max(1, m)} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`
  const y = Math.floor(d / 365)
  return `${y} year${y === 1 ? "" : "s"} ago`
}

function formatViews(n?: number): string {
  if (!n) return ""
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`
  return `${n} views`
}

export function YoutubeChannelModule({ config, span = 2 }: YoutubeChannelModuleProps) {
  const [video, setVideo] = useState<LatestVideo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const spanClass = span === 4 ? "col-span-2 row-span-2" : span === 2 ? "col-span-2" : ""

  useEffect(() => {
    if (!config.channelId) {
      setTimeout(() => {
        setError("missing channel")
        setLoading(false)
      }, 0)
      return
    }
    let cancelled = false
    setTimeout(() => {
      setLoading(true)
      setError(null)
    }, 0)
    fetch(`/api/social/youtube?channelId=${encodeURIComponent(config.channelId)}`)
      .then(async (res) => {
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(json.error || "Failed to load")
        } else {
          setVideo(json as LatestVideo)
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [config.channelId])

  if (loading) {
    return (
      <div
        className={`${spanClass} rounded-2xl overflow-hidden bg-[rgba(255,60,60,0.05)] border border-[rgba(255,60,60,0.15)]`}
      >
        <div className="h-[130px] bg-white/[0.03] animate-pulse" />
        <div className="p-3 space-y-2">
          <div className="h-3 w-3/4 bg-white/[0.05] rounded animate-pulse" />
          <div className="h-2 w-1/2 bg-white/[0.04] rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div
        className={`${spanClass} rounded-2xl bg-[rgba(255,60,60,0.05)] border border-[rgba(255,60,60,0.15)] p-5 flex items-center justify-center`}
      >
        <div className="text-[#b8b8b8] text-xs font-mono uppercase tracking-widest">
          Could not load latest video
        </div>
      </div>
    )
  }

  const href = `https://youtube.com/watch?v=${video.videoId}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${spanClass} block rounded-2xl overflow-hidden bg-[rgba(255,60,60,0.05)] border border-[rgba(255,60,60,0.15)] hover:border-[rgba(255,60,60,0.3)] transition-colors group`}
    >
      <div className="relative h-[130px] overflow-hidden bg-black">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-[rgba(255,60,60,0.9)] text-white text-[10px] font-mono uppercase tracking-widest">
          NEW · {timeAgo(video.publishedAt)}
        </div>

        {video.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-mono">
            {video.duration}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[rgba(255,60,60,0.9)] flex items-center justify-center shadow-[0_0_20px_rgba(255,60,60,0.4)] group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="text-sm font-semibold text-white line-clamp-2">{video.title}</div>
        <div className="text-xs font-mono text-[#c9c9d1] mt-1.5 flex items-center gap-2">
          {video.viewCount !== undefined && <span>{formatViews(video.viewCount)}</span>}
          {video.viewCount !== undefined && <span className="text-[#b8b8b8]">·</span>}
          <span>{timeAgo(video.publishedAt)}</span>
        </div>
      </div>
    </a>
  )
}
