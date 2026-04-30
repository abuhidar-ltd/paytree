"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface YouTubeModuleConfig {
  videoUrl: string
  videoId?: string
  thumbnailUrl?: string
  title?: string
  autoplay?: boolean
}

interface YouTubeModuleProps {
  config: YouTubeModuleConfig
  span?: 1 | 2 | 4
  className?: string
}

// Extract video ID from YouTube URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Extract TikTok video ID
function extractTikTokId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  return match ? match[1] : null
}

export function YouTubeModule({ config, span = 2, className = "" }: YouTubeModuleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const videoId = config.videoId || extractYouTubeId(config.videoUrl)
  const tiktokId = extractTikTokId(config.videoUrl)
  const isTikTok = !!tiktokId
  
  const thumbnailUrl = config.thumbnailUrl || 
    (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null)
  
  const spanClass = span === 4 ? "col-span-2 row-span-2" : span === 2 ? "col-span-2" : ""
  const aspectClass = span === 4 ? "aspect-video" : "aspect-[2/1]"
  
  const handlePlay = () => {
    setIsPlaying(true)
  }
  
  return (
    <motion.div
      className={`
        glass-brick relative overflow-hidden ${spanClass} ${aspectClass} ${className}
        group cursor-pointer
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={!isPlaying ? handlePlay : undefined}
    >
      {/* Thumbnail or Embed */}
      {!isPlaying ? (
        <>
          {/* Thumbnail Background */}
          {thumbnailUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
          )}
          
          {/* Frosted Glass Overlay */}
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-sm" />
          
          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="
                w-16 h-16 rounded-full 
                bg-[rgba(255,255,255,0.1)] backdrop-blur-xl
                border border-[rgba(255,255,255,0.3)]
                flex items-center justify-center
                shadow-[0_0_30px_rgba(0,255,136,0.3)]
              "
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>
          </div>
          
          {/* Title Overlay */}
          {config.title && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="label">{isTikTok ? "TikTok" : "YouTube"}</div>
              <div className="font-bold text-white truncate">{config.title}</div>
            </div>
          )}
          
          {/* Platform Badge */}
          <div className="absolute top-3 left-3">
            <div className="
              px-2 py-1 rounded-full text-xs font-bold
              bg-[rgba(255,255,255,0.1)] backdrop-blur-sm
              border border-[rgba(255,255,255,0.2)]
              text-white
            ">
              {isTikTok ? "TikTok" : "▶ YouTube"}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Loading State */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#030303]">
              <div className="w-10 h-10 border-4 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin" />
            </div>
          )}
          
          {/* YouTube Embed */}
          {videoId && !isTikTok && (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoaded(true)}
            />
          )}
          
          {/* TikTok Embed */}
          {isTikTok && tiktokId && (
            <iframe
              src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              onLoad={() => setIsLoaded(true)}
            />
          )}
        </>
      )}
    </motion.div>
  )
}
