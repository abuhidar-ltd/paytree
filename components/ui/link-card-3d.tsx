"use client"

import { ReactNode, CSSProperties } from "react"
import { MediaPreview, detectMediaType, getMediaThumbnail } from "./media-preview"

interface LinkCard3DProps {
  title: string
  url?: string
  icon?: ReactNode
  thumbnail?: string
  onTrackClick?: () => void
  variant?: "default" | "gradient" | "glass" | "3d" | "glow" | "outline" | "neon" | "elegant"
  className?: string
  clickCount?: number
  showAnalytics?: boolean
}

const VARIANT_CLASS: Record<string, string> = {
  default:  "glass-card-hover",
  glass:    "glass-card-hover",
  elegant:  "glass-card-hover",
  "3d":     "bg-[#111] border border-white/[0.12] rounded-[32px] transition-all duration-150 hover:-translate-y-0.5",
  gradient: "bg-gradient-to-r from-[#00ff88]/15 to-[#00ff88]/5 border border-[#00ff88]/20 rounded-[32px] transition-all duration-300 hover:from-[#00ff88]/25 hover:border-[#00ff88]/35",
  glow:     "bg-white/[0.02] border border-white/10 rounded-[32px] transition-all duration-300 hover:-translate-y-0.5",
  neon:     "bg-transparent border-2 border-[#00ff88] rounded-[32px] transition-all duration-300 hover:border-[#00ff88]/70",
  outline:  "bg-transparent border border-white/20 rounded-[32px] transition-all duration-300 hover:border-white/40",
}

const VARIANT_STYLE: Record<string, CSSProperties | undefined> = {
  "3d":  { boxShadow: "4px 6px 0 rgba(255,255,255,0.06)" },
  glow:  { boxShadow: "0 0 18px rgba(0,255,136,0.12), 0 0 36px rgba(0,255,136,0.05)" },
  neon:  { boxShadow: "0 0 10px rgba(0,255,136,0.3), inset 0 0 10px rgba(0,255,136,0.04)" },
}

export function LinkCard3D({ 
  title, 
  url, 
  icon, 
  thumbnail,
  onTrackClick, 
  variant = "default",
  className = "",
  clickCount,
  showAnalytics = false
}: LinkCard3DProps) {
  
  // Non-blocking tracking - fires before navigation
  const handleTrack = () => {
    if (onTrackClick) {
      onTrackClick()
    }
  }

  // Detect media type from URL
  const mediaType = url ? detectMediaType(url) : null
  const mediaThumbnail = url ? getMediaThumbnail(url) : null

  // Determine what to show in the icon area
  const showMediaPreview = mediaType && !thumbnail && !icon
  const displayThumbnail = thumbnail || mediaThumbnail

  const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.default
  const variantStyle = VARIANT_STYLE[variant]

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onMouseDown={handleTrack}
      onTouchStart={handleTrack}
      style={variantStyle}
      className={`
        group relative flex items-center gap-4 w-full p-4 sm:p-5
        ${variantClass}
        active:scale-[0.98]
        cursor-pointer
        ${className}
      `}
    >
      {/* Thumbnail/Icon/Media Preview Area */}
      <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gradient-to-br from-[rgba(0,255,136,0.2)] to-[rgba(0,255,136,0.05)] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
        {displayThumbnail ? (
          <>
            <img 
              src={displayThumbnail} 
              alt="" 
              className="w-full h-full object-cover"
            />
            {/* Play icon overlay for video content */}
            {mediaType === 'youtube' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            )}
          </>
        ) : showMediaPreview ? (
          <MediaPreview type={mediaType} />
        ) : icon ? (
          <span className="text-xl sm:text-2xl">{icon}</span>
        ) : (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-base sm:text-lg truncate group-hover:text-[#00ff88] transition-colors">
          {title}
        </h3>
        
        {/* Media type badge */}
        {mediaType && (
          <span className="inline-flex items-center gap-1 mt-1 text-xs text-zinc-400">
            {mediaType === 'youtube' && '▶ YouTube'}
            {mediaType === 'twitter' && '𝕏 Post'}
            {mediaType === 'instagram' && '📷 Instagram'}
          </span>
        )}
      </div>

      {/* Analytics badge (dashboard only) */}
      {showAnalytics && typeof clickCount === 'number' && (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <svg className="w-3.5 h-3.5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span className="text-sm font-medium text-white">{clickCount}</span>
        </div>
      )}

      {/* Arrow */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[rgba(0,255,136,0.15)] transition-all duration-200">
        <svg className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-[20px] bg-gradient-to-r from-[rgba(0,255,136,0.05)] via-transparent to-[rgba(0,255,136,0.05)]" />
      </div>
    </a>
  )
}
