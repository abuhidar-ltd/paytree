"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface LiveStreamModuleConfig {
  platform: "twitch" | "youtube"
  channelId: string // Twitch username or YouTube channel ID
  channelName?: string
  profileImage?: string
  // For hybrid approach - optional OAuth-based live data
  accessToken?: string
}

interface LiveStreamModuleProps {
  config: LiveStreamModuleConfig
  span?: 1 | 2
  className?: string
}

interface LiveData {
  isLive: boolean
  viewerCount?: number
  title?: string
  thumbnailUrl?: string
  gameName?: string
}

export function LiveStreamModule({ config, span = 1, className = "" }: LiveStreamModuleProps) {
  const [liveData, setLiveData] = useState<LiveData>({ isLive: false })
  const [isLoading, setIsLoading] = useState(true)
  
  const spanClass = span === 2 ? "col-span-2" : ""
  
  // Fetch live status (would need server-side API with OAuth)
  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        // This would call your API endpoint that checks Twitch/YouTube
        // For now, we'll simulate the data
        setLiveData({
          isLive: false, // Would be fetched from API
          viewerCount: 0,
          title: config.channelName || config.channelId,
        })
      } catch (error) {
        console.error("Failed to fetch live status:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkLiveStatus()
    // Poll every 60 seconds
    const interval = setInterval(checkLiveStatus, 60000)
    return () => clearInterval(interval)
  }, [config.channelId, config.platform])
  
  const streamUrl = config.platform === "twitch"
    ? `https://twitch.tv/${config.channelId}`
    : `https://youtube.com/channel/${config.channelId}/live`
  
  return (
    <motion.a
      href={streamUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        glass-brick relative overflow-hidden ${spanClass} ${className}
        cursor-pointer block
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Profile Image / Platform Icon */}
        <div className={`
          w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center
          ${liveData.isLive 
            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
            : "bg-[rgba(255,255,255,0.05)]"
          }
          relative
        `}>
          {config.profileImage ? (
            <img 
              src={config.profileImage} 
              alt={config.channelName || config.channelId}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : config.platform === "twitch" ? (
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
          ) : (
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          )}
          
          {/* Live Indicator */}
          {liveData.isLive && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-[#030303] animate-pulse" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="label">
              {config.platform === "twitch" ? "Twitch" : "YouTube"}
            </span>
            {liveData.isLive && (
              <span className="
                px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                bg-red-500/20 text-red-400 border border-red-500/30
              ">
                LIVE
              </span>
            )}
          </div>
          
          <div className="font-bold text-white truncate">
            {config.channelName || config.channelId}
          </div>
          
          {liveData.isLive && liveData.viewerCount !== undefined && (
            <div className="text-sm text-[#00ff88] mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span>{liveData.viewerCount.toLocaleString()} watching</span>
            </div>
          )}
          
          {!liveData.isLive && (
            <div className="text-sm text-[#888888] mt-1">
              {isLoading ? "Checking..." : "Offline"}
            </div>
          )}
        </div>
        
        {/* Arrow */}
        <div className="
          w-10 h-10 rounded-full flex-shrink-0
          bg-[rgba(255,255,255,0.05)]
          flex items-center justify-center
        ">
          <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
      
      {/* Glow Effect when Live */}
      {liveData.isLive && (
        <div className="absolute inset-0 rounded-[32px] border border-red-500/30 pointer-events-none" />
      )}
    </motion.a>
  )
}
