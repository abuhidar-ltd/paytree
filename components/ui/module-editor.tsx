"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassBrick } from "./obsidian-card"
import { toast } from "sonner"
import type { ModuleType } from "./bento-modules"

interface Module {
  id: string
  type: ModuleType
  title?: string
  enabled: boolean
  order: number
  span: number
  config: Record<string, unknown>
}

interface ModuleEditorProps {
  modules: Module[]
  onModulesChange: (modules: Module[]) => void
  isPro: boolean
}

const MODULE_TYPES: { type: ModuleType; label: string; icon: string; span: number; proOnly?: boolean }[] = [
  { type: "youtube", label: "YouTube Video", icon: "📹", span: 2 },
  { type: "tiktok", label: "TikTok Video", icon: "🎵", span: 2 },
  { type: "spotify", label: "Spotify Track", icon: "🎧", span: 2 },
  { type: "apple_music", label: "Apple Music", icon: "🎶", span: 2 },
  { type: "image", label: "Image Showcase", icon: "🖼️", span: 1 },
  { type: "twitch", label: "Twitch Live", icon: "🎮", span: 1 },
  { type: "youtube_live", label: "YouTube Live", icon: "🔴", span: 1 },
  { type: "social_hub", label: "Social Hub", icon: "🌐", span: 2 },
  { type: "rss", label: "RSS Feed", icon: "📰", span: 2, proOnly: true },
  { type: "vault_teaser", label: "Vault Teaser", icon: "🔒", span: 2, proOnly: true },
  { type: "quick_tip", label: "Quick Tip", icon: "💸", span: 1, proOnly: true },
  { type: "payment", label: "Product Card", icon: "🛒", span: 2, proOnly: true },
]

export function ModuleEditor({ modules, onModulesChange, isPro }: ModuleEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedType, setSelectedType] = useState<ModuleType | null>(null)
  const [moduleConfig, setModuleConfig] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleAddModule = async () => {
    if (!selectedType) return
    
    setIsSubmitting(true)
    try {
      const typeConfig = MODULE_TYPES.find(t => t.type === selectedType)
      
      // Transform config for social_hub to create proper links array
      let finalConfig: Record<string, unknown> = { ...moduleConfig }
      if (selectedType === "social_hub") {
        const links: { platform: string; url: string }[] = []
        const platforms = ["instagram", "twitter", "youtube", "tiktok", "discord", "linkedin", "github", "threads"]
        platforms.forEach(platform => {
          const url = moduleConfig[`${platform}Url`]
          if (url) {
            links.push({ platform, url })
          }
        })
        finalConfig = { links }
      }
      
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          title: moduleConfig.title,
          span: typeConfig?.span || 1,
          config: finalConfig,
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to add module")
      }
      
      const newModule = await res.json()
      onModulesChange([...modules, newModule])
      
      setIsAdding(false)
      setSelectedType(null)
      setModuleConfig({})
      toast.success("Module added!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add module")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const toggleModule = async (id: string, enabled: boolean) => {
    // Optimistic update
    onModulesChange(modules.map(m => m.id === id ? { ...m, enabled } : m))
    
    try {
      await fetch(`/api/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
    } catch (error) {
      // Revert on error
      onModulesChange(modules.map(m => m.id === id ? { ...m, enabled: !enabled } : m))
    }
  }
  
  const deleteModule = async (id: string) => {
    if (!confirm("Delete this module?")) return
    
    const previous = [...modules]
    onModulesChange(modules.filter(m => m.id !== id))
    
    try {
      await fetch(`/api/modules/${id}`, { method: "DELETE" })
      toast.success("Module deleted")
    } catch (error) {
      onModulesChange(previous)
      toast.error("Failed to delete module")
    }
  }
  
  const updateSpan = async (id: string, span: number) => {
    onModulesChange(modules.map(m => m.id === id ? { ...m, span } : m))
    
    try {
      await fetch(`/api/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ span }),
      })
    } catch (error) {
      toast.error("Failed to update size")
    }
  }
  
  const renderConfigFields = () => {
    if (!selectedType) return null
    
    switch (selectedType) {
      case "youtube":
      case "tiktok":
        return (
          <>
            <input
              value={moduleConfig.videoUrl || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, videoUrl: e.target.value })}
              placeholder="Video URL (YouTube or TikTok)"
              className="input-obsidian w-full"
              autoFocus
            />
            <input
              value={moduleConfig.title || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, title: e.target.value })}
              placeholder="Title (optional)"
              className="input-obsidian w-full"
            />
          </>
        )
      
      case "spotify":
        return (
          <input
            value={moduleConfig.spotifyUrl || ""}
            onChange={(e) => setModuleConfig({ ...moduleConfig, spotifyUrl: e.target.value })}
            placeholder="Spotify track/album/playlist URL"
            className="input-obsidian w-full"
            autoFocus
          />
        )
      
      case "apple_music":
        return (
          <input
            value={moduleConfig.appleMusicUrl || ""}
            onChange={(e) => setModuleConfig({ ...moduleConfig, appleMusicUrl: e.target.value })}
            placeholder="Apple Music URL"
            className="input-obsidian w-full"
            autoFocus
          />
        )
      
      case "image":
        return (
          <>
            <input
              value={moduleConfig.imageUrl || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, imageUrl: e.target.value })}
              placeholder="Image URL"
              className="input-obsidian w-full"
              autoFocus
            />
            <input
              value={moduleConfig.title || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, title: e.target.value })}
              placeholder="Title (optional)"
              className="input-obsidian w-full"
            />
            <input
              value={moduleConfig.caption || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, caption: e.target.value })}
              placeholder="Caption (optional)"
              className="input-obsidian w-full"
            />
          </>
        )
      
      case "twitch":
      case "youtube_live":
        return (
          <>
            <input
              value={moduleConfig.channelId || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, channelId: e.target.value })}
              placeholder={selectedType === "twitch" ? "Twitch username" : "YouTube channel ID"}
              className="input-obsidian w-full"
              autoFocus
            />
            <input
              value={moduleConfig.channelName || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, channelName: e.target.value })}
              placeholder="Display name (optional)"
              className="input-obsidian w-full"
            />
          </>
        )
      
      case "social_hub":
        return (
          <div className="space-y-3">
            <p className="text-sm text-[#888888]">Add up to 4 social links. Configure them below:</p>
            {["instagram", "twitter", "youtube", "tiktok"].map((platform) => (
              <input
                key={platform}
                value={moduleConfig[`${platform}Url`] || ""}
                onChange={(e) => setModuleConfig({ ...moduleConfig, [`${platform}Url`]: e.target.value })}
                placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                className="input-obsidian w-full"
              />
            ))}
          </div>
        )
      
      case "rss":
        return (
          <>
            <input
              value={moduleConfig.feedUrl || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, feedUrl: e.target.value })}
              placeholder="RSS feed URL"
              className="input-obsidian w-full"
              autoFocus
            />
            <input
              value={moduleConfig.title || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, title: e.target.value })}
              placeholder="Label (e.g., 'Latest Blog Post')"
              className="input-obsidian w-full"
            />
          </>
        )
      
      case "quick_tip":
        return (
          <>
            <input
              type="number"
              value={moduleConfig.defaultAmount || "5"}
              onChange={(e) => setModuleConfig({ ...moduleConfig, defaultAmount: e.target.value })}
              placeholder="Default tip amount ($)"
              className="input-obsidian w-full"
            />
            <input
              value={moduleConfig.recipientName || ""}
              onChange={(e) => setModuleConfig({ ...moduleConfig, recipientName: e.target.value })}
              placeholder="Your name (optional)"
              className="input-obsidian w-full"
            />
          </>
        )
      
      default:
        return (
          <input
            value={moduleConfig.title || ""}
            onChange={(e) => setModuleConfig({ ...moduleConfig, title: e.target.value })}
            placeholder="Title"
            className="input-obsidian w-full"
            autoFocus
          />
        )
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Add Module Button/Form */}
      <AnimatePresence mode="wait">
        {!isAdding ? (
          <motion.button
            key="add-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAdding(true)}
            className="w-full glass-brick text-center group py-8"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🧩</div>
            <div className="font-bold text-white">Add Bento Module</div>
            <div className="text-sm text-[#888888] mt-1">
              {!isPro && modules.length >= 3 ? "Upgrade for more modules" : "YouTube, Spotify, Tips & more"}
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="obsidian-card-static p-6 space-y-4"
          >
            {!selectedType ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Choose Module Type</h3>
                  <button onClick={() => setIsAdding(false)} className="text-[#888888] hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {MODULE_TYPES.map((type) => {
                    const disabled = type.proOnly && !isPro
                    return (
                      <button
                        key={type.type}
                        onClick={() => !disabled && setSelectedType(type.type)}
                        disabled={disabled}
                        className={`
                          p-4 rounded-xl text-left transition-all
                          ${disabled 
                            ? "opacity-50 cursor-not-allowed bg-[rgba(255,255,255,0.02)]" 
                            : "bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(0,255,136,0.1)] hover:border-[rgba(0,255,136,0.3)]"
                          }
                          border border-[rgba(255,255,255,0.05)]
                        `}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="font-medium text-white text-sm">{type.label}</div>
                        {disabled && (
                          <div className="text-xs text-[#00ff88] mt-1">Pro</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setSelectedType(null); setModuleConfig({}) }}
                      className="text-[#888888] hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="font-bold text-white">
                      {MODULE_TYPES.find(t => t.type === selectedType)?.label}
                    </h3>
                  </div>
                  <button onClick={() => { setIsAdding(false); setSelectedType(null); setModuleConfig({}) }} className="text-[#888888] hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {renderConfigFields()}
                </div>
                
                <button
                  onClick={handleAddModule}
                  disabled={isSubmitting}
                  className="
                    w-full py-3 rounded-xl
                    bg-gradient-to-r from-[#00ff88] to-[#00cc6a]
                    text-black font-bold
                    disabled:opacity-50
                  "
                >
                  {isSubmitting ? "Adding..." : "Add Module"}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Module List */}
      {modules.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-white">Your Modules</h3>
          {modules.map((module) => {
            const typeConfig = MODULE_TYPES.find(t => t.type === module.type)
            return (
              <GlassBrick key={module.id} className="flex items-center gap-4 !p-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-xl">
                  {typeConfig?.icon || "🧩"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">
                    {module.title || typeConfig?.label || module.type}
                  </div>
                  <div className="text-sm text-[#888888]">
                    {module.span === 1 ? "1x1" : module.span === 2 ? "2x1" : "2x2"}
                  </div>
                </div>
                
                {/* Size Toggle */}
                <div className="flex gap-1">
                  {[1, 2, 4].map((span) => (
                    <button
                      key={span}
                      onClick={() => updateSpan(module.id, span)}
                      className={`
                        px-2 py-1 rounded text-xs font-bold transition-colors
                        ${module.span === span 
                          ? "bg-[rgba(0,255,136,0.2)] text-[#00ff88]" 
                          : "bg-[rgba(255,255,255,0.05)] text-[#888888] hover:text-white"
                        }
                      `}
                    >
                      {span === 1 ? "1x1" : span === 2 ? "2x1" : "2x2"}
                    </button>
                  ))}
                </div>
                
                {/* Toggle */}
                <button
                  onClick={() => toggleModule(module.id, !module.enabled)}
                  className={`
                    w-12 h-7 rounded-full transition-all border relative
                    ${module.enabled 
                      ? "bg-[rgba(0,255,136,0.2)] border-[rgba(0,255,136,0.5)]" 
                      : "bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.1)]"
                    }
                  `}
                >
                  <motion.div
                    className={`absolute top-0.5 w-6 h-6 rounded-full ${module.enabled ? "bg-[#00ff88]" : "bg-white"}`}
                    animate={{ left: module.enabled ? "calc(100% - 26px)" : "2px" }}
                  />
                </button>
                
                {/* Delete */}
                <button
                  onClick={() => deleteModule(module.id)}
                  className="p-2 text-[#888888] hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </GlassBrick>
            )
          })}
        </div>
      )}
      
      {modules.length === 0 && !isAdding && (
        <GlassBrick className="text-center py-12">
          <div className="text-5xl mb-4 opacity-40">🧩</div>
          <p className="font-bold text-white">No modules yet</p>
          <p className="text-sm text-[#888888] mt-2">Add videos, music, tips & more</p>
        </GlassBrick>
      )}
    </div>
  )
}
