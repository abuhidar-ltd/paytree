"use client"

import { YouTubeModule } from "./youtube-module"
import { YoutubeChannelModule } from "./youtube-channel-module"
import { PodcastModule } from "./podcast-module"
import { SpotifyModule, AppleMusicModule } from "./spotify-module"
import { ImageModule } from "./image-module"
import { LiveStreamModule } from "./live-stream-module"
import { SocialHubModule } from "./social-hub-module"
import { RSSModule } from "./rss-module"
import { VaultTeaserModule } from "./vault-teaser-module"
import { QuickTipModule } from "./quick-tip-module"
import { PaymentModule } from "./payment-module"

// Module type definitions
export type ModuleType = 
  | "youtube" 
  | "tiktok" 
  | "spotify" 
  | "apple_music" 
  | "image" 
  | "twitch" 
  | "youtube_live"
  | "social_hub" 
  | "rss" 
  | "vault_teaser" 
  | "quick_tip" 
  | "payment"
  | "podcast"

export interface BentoModule {
  id: string
  type: ModuleType
  title?: string
  enabled: boolean
  order: number
  span: 1 | 2 | 4 // 1=1x1, 2=2x1, 4=2x2
  config: Record<string, unknown>
}

interface ModuleRendererProps {
  module: BentoModule
  userId: string
  onVaultUnlock?: (vaultItemId: string, email: string) => Promise<void>
}

export function ModuleRenderer({ module, userId, onVaultUnlock }: ModuleRendererProps) {
  if (!module.enabled) return null
  
  const spanClass = module.span === 4 
    ? "col-span-2 row-span-2" 
    : module.span === 2 
      ? "col-span-2" 
      : ""
  
  switch (module.type) {
    case "youtube": {
      // New: channel-based latest-video card when channelId is set.
      // Backward compat: existing video-URL configs still render the old YouTubeModule.
      const cfg = module.config as { channelId?: string; videoUrl?: string; title?: string }
      if (cfg.channelId) {
        return (
          <YoutubeChannelModule
            config={{ channelId: cfg.channelId }}
            span={module.span === 4 ? 4 : 2}
          />
        )
      }
      return (
        <YouTubeModule
          config={module.config as { videoUrl: string; title?: string }}
          span={module.span === 4 ? 4 : 2}
        />
      )
    }
    case "tiktok":
      return (
        <YouTubeModule
          config={module.config as { videoUrl: string; title?: string }}
          span={module.span === 4 ? 4 : 2}
        />
      )

    case "podcast":
      return (
        <PodcastModule
          config={module.config as { rssUrl?: string }}
          span={module.span === 4 ? 4 : 2}
        />
      )
    
    case "spotify":
      return (
        <SpotifyModule
          config={module.config as { spotifyUrl: string }}
          span={module.span === 2 ? 2 : 1}
          variant="spotify"
        />
      )
    
    case "apple_music":
      return (
        <AppleMusicModule
          config={module.config as { appleMusicUrl: string }}
          span={module.span === 2 ? 2 : 1}
        />
      )
    
    case "image":
      return (
        <ImageModule
          config={module.config as { imageUrl: string; title?: string; caption?: string }}
          span={module.span as 1 | 2 | 4}
        />
      )
    
    case "twitch":
    case "youtube_live":
      return (
        <LiveStreamModule
          config={{
            platform: module.type === "twitch" ? "twitch" : "youtube",
            ...(module.config as { channelId: string; channelName?: string })
          }}
          span={module.span === 2 ? 2 : 1}
        />
      )
    
    case "social_hub":
      return (
        <SocialHubModule
          config={module.config as { links: { platform: string; url: string }[] }}
          span={2}
        />
      )
    
    case "rss":
      return (
        <RSSModule
          config={module.config as { feedUrl: string; title?: string }}
          span={2}
        />
      )
    
    case "vault_teaser":
      return (
        <VaultTeaserModule
          config={module.config as { 
            vaultItemId: string; 
            title: string; 
            description?: string;
            teaserImage?: string;
          }}
          span={2}
          onUnlock={onVaultUnlock ? 
            (email) => onVaultUnlock((module.config as { vaultItemId: string }).vaultItemId, email) 
            : undefined
          }
        />
      )
    
    case "quick_tip":
      return (
        <QuickTipModule
          config={module.config as { amounts?: number[]; defaultAmount?: number }}
          span={module.span === 2 ? 2 : 1}
          userId={userId}
        />
      )
    
    case "payment":
      return (
        <PaymentModule
          config={module.config as { 
            productId: string; 
            title: string; 
            price: number;
            imageUrl?: string;
          }}
          span={module.span as 1 | 2 | 4}
        />
      )
    
    default:
      return null
  }
}

// Bento Grid Component
interface BentoGridProps {
  modules: BentoModule[]
  userId: string
  onVaultUnlock?: (vaultItemId: string, email: string) => Promise<void>
  className?: string
}

export function BentoGrid({ modules, userId, onVaultUnlock, className = "" }: BentoGridProps) {
  const sortedModules = [...modules]
    .filter(m => m.enabled)
    .sort((a, b) => a.order - b.order)
  
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {sortedModules.map((module) => (
        <ModuleRenderer
          key={module.id}
          module={module}
          userId={userId}
          onVaultUnlock={onVaultUnlock}
        />
      ))}
    </div>
  )
}
