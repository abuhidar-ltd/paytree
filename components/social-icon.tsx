"use client"

import { useState } from "react"
import { 
  Instagram, 
  Twitter, 
  Facebook, 
  Youtube, 
  Linkedin, 
  Github, 
  Twitch,
  Music,
  MessageCircle,
  Globe,
  type LucideIcon
} from "lucide-react"

interface SocialIconProps {
  platform: string
  url: string
  size?: number
}

const platformIcons: Record<string, LucideIcon> = {
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  github: Github,
  twitch: Twitch,
  tiktok: Music,
  discord: MessageCircle,
  spotify: Music,
  soundcloud: Music,
  patreon: Globe,
  custom: Globe,
}

const platformNames: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter",
  x: "X (Twitter)",
  facebook: "Facebook",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  github: "GitHub",
  twitch: "Twitch",
  tiktok: "TikTok",
  discord: "Discord",
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  patreon: "Patreon",
  custom: "Website",
}

export function SocialIcon({ platform, url, size = 44 }: SocialIconProps) {
  const [isPressed, setIsPressed] = useState(false)
  const Icon = platformIcons[platform.toLowerCase()] || Globe
  const platformName = platformNames[platform.toLowerCase()] || platform
  
  // Ensure URL has protocol
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  
  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-block cursor-pointer btn-touch touch-action-manipulation"
      aria-label={platformName}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
    >
      <div 
        className={`
          rounded-full flex items-center justify-center 
          bg-[rgba(255,255,255,0.01)] backdrop-blur-xl
          border border-[rgba(255,255,255,0.12)]
          hover:bg-[rgba(255,255,255,0.08)] active:bg-[rgba(255,255,255,0.08)]
          hover:border-[rgba(0,255,136,0.3)] active:border-[rgba(0,255,136,0.3)]
          transition-all duration-200 cursor-pointer
          shadow-[0_4px_15px_rgba(0,0,0,0.2)]
          hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]
          ${isPressed ? 'scale-95' : 'hover:scale-105 active:scale-95'}
        `}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <Icon className="w-5 h-5 text-[#888888] group-hover:text-[#00ff88] group-active:text-[#00ff88] transition-colors" />
      </div>
      
      {/* Tooltip - Desktop only */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 hidden sm:block">
        {platformName}
      </div>
    </a>
  )
}
