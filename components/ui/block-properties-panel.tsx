"use client"

import { useState, useEffect } from "react"
import { X, Trash2, Lock, Timer, Youtube, ShoppingBag, Music, Mic, Share2, Link as LucideLink, LayoutGrid } from "lucide-react"

interface Block {
  id: string
  type: string
  title: string
  enabled: boolean
  position: number
  url: string | null
  description: string | null
  thumbnail: string | null
  config: Record<string, unknown>
  style: string
  size: string
  layout: string
  priority: string
  scheduleStart: string | null
  scheduleEnd: string | null
  lockType: string
  lockValue: string | null
  parentId: string | null
  children: Block[]
  clickCount: number
}

interface BlockPropertiesPanelProps {
  block: Block
  onUpdate: (id: string, data: Partial<Block>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const SIZES = [
  { value: "full", label: "Full", visual: "████" },
  { value: "half", label: "Half", visual: "██" },
  { value: "square", label: "Square", visual: "█" },
]

const STYLES = ["glass", "3d", "gradient", "glow", "neon"]

const LOCK_TYPES = ["email", "payment", "password"]

function BlockTypeIcon({ type }: { type: string }) {
  const cls = "w-4 h-4 text-[#c9c9d1]"
  switch (type) {
    case "link": return <LucideLink className={cls} />
    case "vault": return <Lock className={cls} />
    case "drop": return <Timer className={cls} />
    case "youtube": return <Youtube className={cls} />
    case "product": return <ShoppingBag className={cls} />
    case "podcast": return <Mic className={cls} />
    case "spotify": return <Music className={cls} />
    case "social_link": return <Share2 className={cls} />
    default: return <LayoutGrid className={cls} />
  }
}

export function BlockPropertiesPanel({ block, onUpdate, onDelete, onClose }: BlockPropertiesPanelProps) {
  const [localTitle, setLocalTitle] = useState(block.title)
  const [lockEnabled, setLockEnabled] = useState(!!block.lockType && block.lockType !== "none")
  const [scheduleEnabled, setScheduleEnabled] = useState(!!block.scheduleStart)

  useEffect(() => {
    setTimeout(() => {
      setLocalTitle(block.title)
      setLockEnabled(!!block.lockType && block.lockType !== "none")
      setScheduleEnabled(!!block.scheduleStart)
    }, 0)
  }, [block.id, block.title, block.lockType, block.scheduleStart])

  function handleTitleBlur() {
    if (localTitle !== block.title) {
      onUpdate(block.id, { title: localTitle })
    }
  }

  function handleSizeChange(size: string) {
    onUpdate(block.id, { size })
  }

  function handleStyleChange(style: string) {
    onUpdate(block.id, { style })
  }

  function handleLockToggle() {
    if (lockEnabled) {
      onUpdate(block.id, { lockType: "none", lockValue: null })
      setLockEnabled(false)
    } else {
      onUpdate(block.id, { lockType: "email" })
      setLockEnabled(true)
    }
  }

  function handleLockTypeChange(lockType: string) {
    onUpdate(block.id, { lockType })
  }

  function handleScheduleToggle() {
    if (scheduleEnabled) {
      onUpdate(block.id, { scheduleStart: null, scheduleEnd: null })
      setScheduleEnabled(false)
    } else {
      setScheduleEnabled(true)
    }
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="text-[#b8b8b8] hover:text-[#c9c9d1] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <BlockTypeIcon type={block.type} />
        <input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur() }}
          className="flex-1 bg-transparent text-sm font-mono text-[#e0e0e0] outline-none border-b border-transparent focus:border-white/20 transition-colors"
        />
      </div>

      {/* Size */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/70 mb-2">Size</p>
        <div className="flex gap-2">
          {SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSizeChange(s.value)}
              className={`flex-1 px-2 py-2 rounded-xl text-xs font-mono border transition-all ${
                block.size === s.value
                  ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                  : "bg-white/[0.03] border-white/[0.07] text-[#b8b8b8] hover:border-white/20 hover:text-[#c9c9d1]"
              }`}
            >
              <span className="block text-[10px] opacity-60 mb-0.5">{s.visual}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/70 mb-2">Style</p>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() => handleStyleChange(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono capitalize border transition-all ${
                block.style === s
                  ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                  : "bg-white/[0.03] border-white/[0.07] text-[#b8b8b8] hover:border-white/20 hover:text-[#c9c9d1]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Lock */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/70">Lock</p>
          <button
            onClick={handleLockToggle}
            className={`w-8 h-4 rounded-full transition-all ${
              lockEnabled ? "bg-[#00ff88]/30" : "bg-white/[0.06]"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                lockEnabled ? "bg-[#00ff88] translate-x-4" : "bg-[#444] translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {lockEnabled && (
          <div className="flex gap-1.5">
            {LOCK_TYPES.map((lt) => (
              <button
                key={lt}
                onClick={() => handleLockTypeChange(lt)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono capitalize border transition-all ${
                  block.lockType === lt
                    ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                    : "bg-white/[0.03] border-white/[0.07] text-[#b8b8b8] hover:border-white/20 hover:text-[#c9c9d1]"
                }`}
              >
                {lt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/70">Schedule</p>
          <button
            onClick={handleScheduleToggle}
            className={`w-8 h-4 rounded-full transition-all ${
              scheduleEnabled ? "bg-[#00ff88]/30" : "bg-white/[0.06]"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                scheduleEnabled ? "bg-[#00ff88] translate-x-4" : "bg-[#444] translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {scheduleEnabled && (
          <div className="space-y-2">
            <input
              type="datetime-local"
              value={block.scheduleStart?.slice(0, 16) || ""}
              onChange={(e) => onUpdate(block.id, { scheduleStart: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-[#e0e0e0] outline-none focus:border-[#00ff88]/30"
            />
            <input
              type="datetime-local"
              value={block.scheduleEnd?.slice(0, 16) || ""}
              onChange={(e) => onUpdate(block.id, { scheduleEnd: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-[#e0e0e0] outline-none focus:border-[#00ff88]/30"
            />
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(block.id)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.05] text-red-400 text-xs font-mono hover:bg-red-500/[0.1] hover:border-red-500/30 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete block
      </button>
    </div>
  )
}
