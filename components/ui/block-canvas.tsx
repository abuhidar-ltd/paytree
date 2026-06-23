"use client"

import { useState, useCallback, useRef } from "react"
import {
  DndContext, closestCenter,
  PointerSensor, KeyboardSensor,
  useSensor, useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext, rectSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  LayoutGrid, Link as LucideLink, Lock, Timer,
  Youtube, ShoppingBag, Music, Mic, Share2,
  Image as ImageIcon, HelpCircle, Mail, Tag,
} from "lucide-react"

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

interface BlockCanvasProps {
  blocks: Block[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onReorder: (reordered: Block[]) => void
  onUpdate: (id: string, data: Partial<Block>) => void
  onDelete: (id: string) => void
  onAddBlock: () => void
}

const SIZE_SPANS: Record<string, number> = {
  full: 12,
  "": 12,
  large: 12,
  default: 12,
  half: 6,
  square: 6,
}

const SIZE_CYCLE = ["square", "half", "full"]

export function BlockCanvas({
  blocks,
  selectedId,
  onSelect,
  onReorder,
  onUpdate,
  onAddBlock,
}: BlockCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex(b => b.id === active.id)
    const newIndex = blocks.findIndex(b => b.id === over.id)
    const reordered = arrayMove(blocks, oldIndex, newIndex)
    onReorder(reordered)
  }

  if (blocks.length === 0) {
    return (
      <div
        className="bg-[#060606] rounded-xl border border-white/[0.06] p-4 min-h-[600px]"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 10,
          gridAutoRows: "minmax(60px, auto)",
        }}
      >
        <div
          style={{ gridColumn: "span 12" }}
          className="border-2 border-dashed border-white/[0.05] rounded-xl min-h-[400px] flex flex-col items-center justify-center gap-3"
        >
          <LayoutGrid className="w-8 h-8 text-[#333]" />
          <p className="text-[#444] font-mono text-sm">Drag blocks here or</p>
          <button
            onClick={onAddBlock}
            className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
          >
            + Add block
          </button>
        </div>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={rectSortingStrategy}>
        <div
          className="bg-[#060606] rounded-xl border border-white/[0.06] p-4 min-h-[600px]"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 10,
            gridAutoRows: "minmax(60px, auto)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelect(null)
          }}
        >
          {blocks.map(block => (
            <CanvasBlockCard
              key={block.id}
              block={block}
              isSelected={selectedId === block.id}
              onSelect={onSelect}
              onResize={(newSize) => onUpdate(block.id, { size: newSize })}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

interface CanvasBlockCardProps {
  block: Block
  isSelected: boolean
  onSelect: (id: string) => void
  onResize: (newSize: string) => void
}

function CanvasBlockCard({ block, isSelected, onSelect, onResize }: CanvasBlockCardProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: block.id })

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const colSpan = SIZE_SPANS[block.size] ?? 12
  const resizeStartX = useRef(0)
  const currentSize = useRef(block.size)

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    resizeStartX.current = e.clientX
    currentSize.current = block.size

    const handleMove = (ev: PointerEvent) => {
      const delta = ev.clientX - resizeStartX.current
      const idx = SIZE_CYCLE.indexOf(currentSize.current)
      if (delta > 60 && idx < SIZE_CYCLE.length - 1) {
        currentSize.current = SIZE_CYCLE[idx + 1]
        resizeStartX.current = ev.clientX
        onResize(currentSize.current)
      } else if (delta < -60 && idx > 0) {
        currentSize.current = SIZE_CYCLE[idx - 1]
        resizeStartX.current = ev.clientX
        onResize(currentSize.current)
      }
    }

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
  }, [block.size, onResize])

  return (
    <div
      ref={setNodeRef}
      style={{ ...dndStyle, gridColumn: `span ${colSpan}` }}
      className={`relative rounded-xl border p-2 min-h-[60px] transition-all cursor-pointer ${
        isSelected
          ? "border-[#00ff88]/50 bg-[#00ff88]/[0.04]"
          : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"
      }`}
      onClick={() => onSelect(block.id)}
    >
      <div
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-[#333] text-sm select-none z-10 hover:text-[#555] transition-colors"
      >
        ⠿
      </div>

      <div className="h-full flex items-center">
        <BlockPreview block={block} />
      </div>

      <div
        className="absolute bottom-2 right-2 text-[#333] cursor-se-resize select-none text-xs z-10 hover:text-[#555] transition-colors"
        onPointerDown={handleResizeStart}
      >
        ⊞
      </div>
    </div>
  )
}

function BlockPreview({ block }: { block: Block }) {
  const cfg = (block.config || {}) as Record<string, unknown>

  switch (block.type) {
    case "link":
      return (
        <div className="flex items-center gap-3 pl-6">
          <span className="text-lg">{(cfg.icon as string | undefined) || "🔗"}</span>
          <span className="text-sm text-[#e0e0e0] font-mono truncate flex-1">{block.title}</span>
          <span className="text-[#444]">→</span>
        </div>
      )

    case "vault":
      return (
        <div className="flex items-center gap-3 pl-6">
          <Lock className="w-4 h-4 text-amber-400/80" />
          <div>
            <p className="text-sm text-[#e0e0e0] font-mono truncate">{block.title}</p>
            <p className="text-[10px] text-amber-400/60 font-mono">Email gated</p>
          </div>
        </div>
      )

    case "drop":
      return (
        <div className="flex items-center gap-3 pl-6">
          <Timer className="w-4 h-4 text-[#00ff88]/80" />
          <div>
            <p className="text-sm text-[#e0e0e0] font-mono truncate">{block.title}</p>
            <p className="text-[10px] text-[#00ff88]/60 font-mono">Countdown</p>
          </div>
        </div>
      )

    case "youtube":
      return (
        <div className="flex items-center gap-3 pl-6">
          <div className="w-8 h-6 rounded bg-red-500/20 flex items-center justify-center">
            <Youtube className="w-3.5 h-3.5 text-red-400" />
          </div>
          <span className="text-sm text-[#e0e0e0] font-mono truncate">{block.title || "YouTube"}</span>
        </div>
      )

    case "twitch":
      return (
        <div className="flex items-center gap-3 pl-6">
          <div className="w-8 h-6 rounded bg-purple-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
          </div>
          <span className="text-sm text-[#e0e0e0] font-mono truncate">{block.title || "Twitch"}</span>
        </div>
      )

    case "product":
      return (
        <div className="flex items-center gap-3 pl-6">
          <ShoppingBag className="w-4 h-4 text-blue-400/80" />
          <div>
            <p className="text-sm text-[#e0e0e0] font-mono truncate">{block.title}</p>
            {!!cfg.price && (
              <p className="text-[10px] text-[#00ff88] font-mono">${(Number(cfg.price) / 100).toFixed(2)}</p>
            )}
          </div>
        </div>
      )

    case "podcast":
      return (
        <div className="flex items-center gap-3 pl-6">
          <Mic className="w-4 h-4 text-amber-400/80" />
          <span className="text-sm text-[#e0e0e0] font-mono truncate">{block.title || "Podcast"}</span>
        </div>
      )

    case "spotify":
      return (
        <div className="flex items-center gap-3 pl-6">
          <Music className="w-4 h-4 text-green-400/80" />
          <div>
            <p className="text-sm text-[#e0e0e0] font-mono truncate">{block.title || "Spotify"}</p>
            <p className="text-[10px] text-green-400/60 font-mono">Now playing</p>
          </div>
        </div>
      )

    case "social_link":
      return (
        <div className="flex items-center justify-center pl-6">
          <Share2 className="w-5 h-5 text-[#888]" />
        </div>
      )

    case "stats":
      return (
        <div className="flex flex-col items-center justify-center pl-6">
          <span className="text-2xl font-bold text-white font-mono">{(cfg.value as string | undefined) || "—"}</span>
          <span className="text-[10px] text-[#444] font-mono uppercase tracking-wider">{block.title}</span>
        </div>
      )

    case "text":
      return (
        <div className="flex items-center pl-6">
          <span className="text-sm text-[#888] font-mono truncate">{block.title}</span>
        </div>
      )

    case "image":
      return (
        <div className="flex items-center justify-center pl-6">
          <ImageIcon className="w-5 h-5 text-[#555]" />
        </div>
      )

    case "faq": {
      const items = Array.isArray(cfg.items) ? cfg.items.length : (cfg.question ? 1 : 1)
      return (
        <div className="flex items-center gap-2 pl-6">
          <HelpCircle className="w-4 h-4 text-[#888]" />
          <span className="text-sm text-[#888] font-mono">
            FAQ · {items} {items === 1 ? "question" : "questions"}
          </span>
        </div>
      )
    }

    case "contact_form":
      return (
        <div className="flex items-center gap-2 pl-6">
          <Mail className="w-4 h-4 text-[#888]" />
          <span className="text-sm text-[#888] font-mono">Contact form</span>
        </div>
      )

    case "discount_code":
      return (
        <div className="flex items-center gap-2 pl-6">
          <Tag className="w-4 h-4 text-[#00ff88]/80" />
          <span className="text-sm text-[#00ff88] font-mono truncate">{(cfg.code as string | undefined) || "CODE"}</span>
        </div>
      )

    default:
      return (
        <div className="flex items-center gap-3 pl-6">
          <LucideLink className="w-4 h-4 text-[#555]" />
          <span className="text-sm text-[#e0e0e0] font-mono truncate">{block.title}</span>
        </div>
      )
  }
}
