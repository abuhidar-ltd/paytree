"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface SpotifyModuleConfig {
  spotifyUrl: string // track, album, or playlist URL
  type?: "track" | "album" | "playlist" | "artist"
  showCompact?: boolean
}

interface AppleMusicModuleConfig {
  appleMusicUrl: string
  albumArt?: string
  trackName?: string
  artistName?: string
}

interface SpotifyModuleProps {
  config: SpotifyModuleConfig | AppleMusicModuleConfig
  span?: 1 | 2
  className?: string
  variant?: "spotify" | "apple"
}

// Extract Spotify URI components
function extractSpotifyEmbed(url: string): { type: string; id: string } | null {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/)
  if (match) return { type: match[1], id: match[2] }
  return null
}

// Extract Apple Music embed components
function extractAppleMusicEmbed(url: string): { type: string; id: string } | null {
  // Example: https://music.apple.com/us/album/album-name/1234567890
  const match = url.match(/music\.apple\.com\/[a-z]{2}\/(album|playlist|song)\/[^/]+\/(\d+)/)
  if (match) return { type: match[1], id: match[2] }
  return null
}

export function SpotifyModule({ config, span = 2, className = "", variant = "spotify" }: SpotifyModuleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [embedHtml, setEmbedHtml] = useState<string | null>(null)
  
  const isSpotify = variant === "spotify" && "spotifyUrl" in config
  const isApple = variant === "apple" && "appleMusicUrl" in config
  
  const spotifyEmbed = isSpotify ? extractSpotifyEmbed((config as SpotifyModuleConfig).spotifyUrl) : null
  const appleMusicEmbed = isApple ? extractAppleMusicEmbed((config as AppleMusicModuleConfig).appleMusicUrl) : null
  
  const spanClass = span === 2 ? "col-span-2" : ""
  
  // Get Spotify embed height based on type
  const getSpotifyHeight = () => {
    if (!spotifyEmbed) return 80
    if ((config as SpotifyModuleConfig).showCompact) return 80
    switch (spotifyEmbed.type) {
      case "track": return 152
      case "album": 
      case "playlist": return 352
      default: return 152
    }
  }
  
  const embedHeight = getSpotifyHeight()
  
  return (
    <motion.div
      className={`
        glass-brick relative overflow-hidden ${spanClass} ${className}
        cursor-pointer
      `}
      style={{ minHeight: isPlaying ? embedHeight + 32 : 100 }}
      whileHover={!isPlaying ? { scale: 1.02 } : undefined}
      whileTap={!isPlaying ? { scale: 0.98 } : undefined}
      onClick={() => !isPlaying && setIsPlaying(true)}
    >
      {!isPlaying ? (
        <div className="flex items-center gap-4 p-4">
          {/* Album Art Placeholder */}
          <div className="
            w-16 h-16 rounded-xl flex-shrink-0
            bg-gradient-to-br from-[#1DB954] to-[#191414]
            flex items-center justify-center
            shadow-[0_0_20px_rgba(29,185,84,0.3)]
          ">
            {isSpotify ? (
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="label">{isSpotify ? "Spotify" : "Apple Music"}</div>
            <div className="font-bold text-white truncate">
              {isSpotify ? "Now Playing" : (config as AppleMusicModuleConfig).trackName || "Listen Now"}
            </div>
            <div className="text-sm text-[#888888] mt-1">Tap to play</div>
          </div>
          
          {/* Play Button */}
          <div className="
            w-12 h-12 rounded-full flex-shrink-0
            bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)]
            flex items-center justify-center
          ">
            <svg className="w-5 h-5 text-[#00ff88] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      ) : (
        <div className="p-4">
          {/* Spotify Embed */}
          {isSpotify && spotifyEmbed && (
            <iframe
              src={`https://open.spotify.com/embed/${spotifyEmbed.type}/${spotifyEmbed.id}?theme=0`}
              width="100%"
              height={embedHeight}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
          )}
          
          {/* Apple Music Embed */}
          {isApple && appleMusicEmbed && (
            <iframe
              src={`https://embed.music.apple.com/us/${appleMusicEmbed.type}/${appleMusicEmbed.id}`}
              width="100%"
              height={embedHeight}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
              loading="lazy"
              className="rounded-xl"
            />
          )}
        </div>
      )}
    </motion.div>
  )
}

export function AppleMusicModule(props: Omit<SpotifyModuleProps, "variant">) {
  return <SpotifyModule {...props} variant="apple" />
}
