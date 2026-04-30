"use client"

export type MediaType = 'youtube' | 'twitter' | 'instagram' | null

/**
 * Detect media type from URL
 */
export function detectMediaType(url: string): MediaType {
  if (!url) return null
  
  const lowerUrl = url.toLowerCase()
  
  // YouTube detection
  if (
    lowerUrl.includes('youtube.com') || 
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('youtube-nocookie.com')
  ) {
    return 'youtube'
  }
  
  // Twitter/X detection
  if (
    lowerUrl.includes('twitter.com') || 
    lowerUrl.includes('x.com')
  ) {
    return 'twitter'
  }
  
  // Instagram detection
  if (lowerUrl.includes('instagram.com')) {
    return 'instagram'
  }
  
  return null
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  
  // Handle youtu.be short URLs
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]
  
  // Handle youtube.com URLs
  const longMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  if (longMatch) return longMatch[1]
  
  // Handle youtube-nocookie.com
  const noCookieMatch = url.match(/youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (noCookieMatch) return noCookieMatch[1]
  
  return null
}

/**
 * Get thumbnail URL for media
 */
export function getMediaThumbnail(url: string): string | null {
  const mediaType = detectMediaType(url)
  
  if (mediaType === 'youtube') {
    const videoId = extractYouTubeId(url)
    if (videoId) {
      // Use medium quality thumbnail (320x180)
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
  }
  
  // For Twitter and Instagram, we don't have easy access to thumbnails
  // without API calls, so return null
  return null
}

interface MediaPreviewProps {
  type: MediaType
  className?: string
}

/**
 * Media type icon preview component
 */
export function MediaPreview({ type, className = "" }: MediaPreviewProps) {
  if (type === 'youtube') {
    return (
      <div className={`flex items-center justify-center w-full h-full bg-red-600/20 ${className}`}>
        <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>
    )
  }
  
  if (type === 'twitter') {
    return (
      <div className={`flex items-center justify-center w-full h-full bg-zinc-800 ${className}`}>
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>
    )
  }
  
  if (type === 'instagram') {
    return (
      <div className={`flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 ${className}`}>
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </div>
    )
  }
  
  return null
}

interface MediaEmbedProps {
  url: string
  className?: string
}

/**
 * Full media embed component (for inline playback if needed in future)
 */
export function MediaEmbed({ url, className = "" }: MediaEmbedProps) {
  const mediaType = detectMediaType(url)
  const thumbnail = getMediaThumbnail(url)
  
  if (mediaType === 'youtube' && thumbnail) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block aspect-video rounded-xl overflow-hidden group ${className}`}
      >
        <img 
          src={thumbnail} 
          alt="Video thumbnail" 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-heavy group-hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </a>
    )
  }
  
  // For Twitter and Instagram, show a styled link card
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block glass-card p-4 rounded-xl group ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <MediaPreview type={mediaType} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">
            {mediaType === 'twitter' ? 'View on X' : 'View on Instagram'}
          </p>
          <p className="text-sm text-zinc-400 truncate">{url}</p>
        </div>
        <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  )
}

