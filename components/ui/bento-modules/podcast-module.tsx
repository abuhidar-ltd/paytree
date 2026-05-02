"use client"

import { useEffect, useRef, useState } from "react"

interface PodcastModuleProps {
  config: { rssUrl?: string }
  span?: 1 | 2 | 4
}

interface PodcastData {
  showTitle: string
  showImage?: string
  episode: {
    title: string
    audioUrl: string
    duration?: string
    pubDate?: string
  }
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

function formatDate(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function PodcastModule({ config, span = 2 }: PodcastModuleProps) {
  const [data, setData] = useState<PodcastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const spanClass = span === 4 ? "col-span-2 row-span-2" : span === 2 ? "col-span-2" : ""

  useEffect(() => {
    if (!config.rssUrl) {
      setError("missing rss")
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/social/podcast?rssUrl=${encodeURIComponent(config.rssUrl)}`)
      .then(async (res) => {
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) setError(json.error || "Failed to load")
        else setData(json as PodcastData)
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
  }, [config.rssUrl])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => setError("Audio playback failed"))
    }
  }

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const pct = parseFloat(e.target.value)
    audio.currentTime = (pct / 100) * duration
    setCurrentTime(audio.currentTime)
  }

  if (loading) {
    return (
      <div
        className={`${spanClass} rounded-2xl bg-[rgba(255,180,0,0.04)] border border-[rgba(255,180,0,0.12)] p-4`}
      >
        <div className="flex items-center gap-3">
          <div className="w-[52px] h-[52px] rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-2 w-1/3 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-white/[0.05] rounded animate-pulse" />
            <div className="h-2 w-1/4 bg-white/[0.04] rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        className={`${spanClass} rounded-2xl bg-[rgba(255,180,0,0.04)] border border-[rgba(255,180,0,0.12)] p-5 flex items-center justify-center`}
      >
        <div className="text-[#444] text-xs font-mono uppercase tracking-widest">
          Could not load podcast
        </div>
      </div>
    )
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0
  const displayDuration = duration > 0 ? formatTime(duration) : data.episode.duration || ""
  const dateLabel = formatDate(data.episode.pubDate)

  return (
    <div
      className={`${spanClass} rounded-2xl bg-[rgba(255,180,0,0.04)] border border-[rgba(255,180,0,0.12)] p-4`}
    >
      <div className="flex items-center gap-3">
        {data.showImage ? (
          <img
            src={data.showImage}
            alt={data.showTitle}
            className="w-[52px] h-[52px] rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-[52px] h-[52px] rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl flex-shrink-0">
            🎙️
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="text-amber-400/80 text-[10px] font-mono uppercase tracking-widest truncate">
            {data.showTitle}
          </div>
          <div className="text-sm font-semibold text-white truncate mt-0.5">
            {data.episode.title}
          </div>
          <div className="text-xs font-mono text-[#888] mt-0.5 flex items-center gap-2">
            {displayDuration && <span>{displayDuration}</span>}
            {displayDuration && dateLabel && <span className="text-[#444]">·</span>}
            {dateLabel && <span>{dateLabel}</span>}
          </div>
        </div>

        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/25 transition-colors flex-shrink-0"
        >
          {isPlaying ? (
            <svg className="w-4 h-4 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-amber-300 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] font-mono text-[#666] tabular-nums w-9">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progressPct}
          onChange={onSeek}
          className="flex-1 h-1 rounded-full appearance-none bg-white/[0.06] cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-amber-400
            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-0"
          style={{
            background: `linear-gradient(to right, rgba(251,191,36,0.6) 0%, rgba(251,191,36,0.6) ${progressPct}%, rgba(255,255,255,0.06) ${progressPct}%, rgba(255,255,255,0.06) 100%)`,
          }}
        />
        <span className="text-[10px] font-mono text-[#666] tabular-nums w-9 text-right">
          {duration > 0 ? formatTime(duration) : "--:--"}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={data.episode.audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
        className="hidden"
      />
    </div>
  )
}
