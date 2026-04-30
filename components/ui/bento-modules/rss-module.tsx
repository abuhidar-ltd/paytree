"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface RSSModuleConfig {
  feedUrl: string
  title?: string
  showImage?: boolean
  maxItems?: number
}

interface RSSItem {
  title: string
  link: string
  description?: string
  imageUrl?: string
  pubDate?: string
}

interface RSSModuleProps {
  config: RSSModuleConfig
  span?: 1 | 2
  className?: string
}

export function RSSModule({ config, span = 2, className = "" }: RSSModuleProps) {
  const [items, setItems] = useState<RSSItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const spanClass = span === 2 ? "col-span-2" : ""
  
  useEffect(() => {
    const fetchRSS = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch via proxy to avoid CORS
        const res = await fetch(`/api/proxy/rss?url=${encodeURIComponent(config.feedUrl)}`)
        if (!res.ok) throw new Error("Failed to fetch feed")
        
        const data = await res.json()
        setItems(data.items?.slice(0, config.maxItems || 1) || [])
      } catch (err) {
        setError("Could not load feed")
        console.error("RSS fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (config.feedUrl) {
      fetchRSS()
    }
  }, [config.feedUrl, config.maxItems])
  
  const latestItem = items[0]
  
  return (
    <motion.div
      className={`glass-brick overflow-hidden ${spanClass} ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      {isLoading ? (
        <div className="p-6 flex items-center justify-center min-h-[120px]">
          <div className="w-8 h-8 border-2 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin" />
        </div>
      ) : error || !latestItem ? (
        <div className="p-6 text-center min-h-[120px] flex flex-col items-center justify-center">
          <svg className="w-8 h-8 text-[#888888] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          <span className="text-sm text-[#888888]">{error || "No articles"}</span>
        </div>
      ) : (
        <a 
          href={latestItem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="flex gap-4 p-4">
            {/* Image */}
            {config.showImage !== false && latestItem.imageUrl && (
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[rgba(255,255,255,0.05)]">
                <img 
                  src={latestItem.imageUrl} 
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="label mb-1">
                {config.title || "Latest Article"}
              </div>
              
              <div className="font-bold text-white line-clamp-2 mb-1">
                {latestItem.title}
              </div>
              
              {latestItem.description && (
                <div className="text-sm text-[#888888] line-clamp-2">
                  {latestItem.description.replace(/<[^>]*>/g, '')}
                </div>
              )}
              
              {latestItem.pubDate && (
                <div className="text-xs text-[#00ff88] mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(latestItem.pubDate).toLocaleDateString()}
                </div>
              )}
            </div>
            
            {/* Arrow */}
            <div className="
              w-10 h-10 rounded-full flex-shrink-0 self-center
              bg-[rgba(255,255,255,0.05)]
              flex items-center justify-center
            ">
              <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </a>
      )}
    </motion.div>
  )
}
