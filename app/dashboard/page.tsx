"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { resolveUserPlan } from "@/lib/plans"
import { getURLMeta } from "@/components/ui/block-renderer"
import {
  Plus, X, GripVertical, ChevronRight, ArrowUpRight, ExternalLink,
  Search, Folder, Link as LinkIcon, Lock, Timer, Youtube, ShoppingBag,
  Music, Mic, Radio, Share2, BarChart2, Image, AlignLeft, HelpCircle,
  Mail, Tag, Trash2, ToggleLeft, ToggleRight, Calendar, Star,
  MessageCircle, Tv, Hash, Eye, Copy,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────

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
  createdAt?: string
}

interface Profile {
  id: string
  username: string
  name: string | null
  image: string | null
  pageStatus: string | null
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  stripeAccountId: string | null
  accentColor: string | null
}

// ─── Spring configs ───────────────────────────────────────────

const spring = { type: "spring" as const, stiffness: 400, damping: 30 }
const gentleSpring = { type: "spring" as const, stiffness: 300, damping: 24 }

// ─── URL detection ────────────────────────────────────────────

function detectBlockFromUrl(url: string): { type: string; title: string; url: string; config?: Record<string, unknown> } | null {
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    if (h.includes("youtube.com") || h.includes("youtu.be")) {
      const channelMatch = url.match(/\/@?([\w-]+)/) || url.match(/\/channel\/([\w-]+)/)
      return { type: "youtube", title: "YouTube", url, config: channelMatch ? { channelId: channelMatch[1] } : {} }
    }
    if (h.includes("open.spotify.com"))
      return { type: "spotify", title: "Spotify", url, config: { playlistUrl: url } }
    if (h.includes("twitch.tv")) {
      const m = url.match(/twitch\.tv\/([\w]+)/)
      return { type: "twitch", title: "Twitch", url, config: m ? { username: m[1] } : {} }
    }
    if (h.includes("instagram.com") || h.includes("tiktok.com") || h.includes("twitter.com") || h.includes("x.com"))
      return { type: "social_link", title: h.split(".")[0], url, config: { platform: h.split(".")[0] } }
    if (h.includes("discord.gg") || h.includes("discord.com"))
      return { type: "link", title: "Discord", url }
    return { type: "link", title: "Untitled", url }
  } catch {
    return null
  }
}

// ─── Block type registry ──────────────────────────────────────

const BLOCK_CATEGORIES = [
  {
    label: "Quick",
    items: [
      { id: "link", name: "Link", icon: LinkIcon, desc: "Any URL" },
      { id: "collection", name: "Collection", icon: Folder, desc: "Group links together" },
      { id: "vault", name: "Vault", icon: Lock, desc: "Email-gated content" },
      { id: "drop", name: "Drop", icon: Timer, desc: "Countdown event" },
    ],
  },
  {
    label: "Media",
    items: [
      { id: "youtube", name: "YouTube", icon: Youtube, desc: "Latest video" },
      { id: "spotify", name: "Spotify", icon: Music, desc: "Playlist embed" },
      { id: "podcast", name: "Podcast", icon: Mic, desc: "RSS feed" },
      { id: "twitch", name: "Twitch", icon: Tv, desc: "Live status" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { id: "product", name: "Product", icon: ShoppingBag, desc: "Digital product" },
      { id: "discount_code", name: "Discount Code", icon: Tag, desc: "Promo code" },
    ],
  },
  {
    label: "Social",
    items: [
      { id: "social_link", name: "Social Link", icon: Share2, desc: "Platform profile" },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "text", name: "Text", icon: AlignLeft, desc: "Heading or paragraph" },
      { id: "image", name: "Image", icon: Image, desc: "Photo or graphic" },
      { id: "faq", name: "FAQ", icon: HelpCircle, desc: "Questions & answers" },
      { id: "contact_form", name: "Contact Form", icon: Mail, desc: "Message form" },
      { id: "stats", name: "Stats", icon: BarChart2, desc: "Number counter" },
    ],
  },
]

const TYPE_ICONS: Record<string, typeof LinkIcon> = {
  link: LinkIcon, collection: Folder, vault: Lock, drop: Timer,
  youtube: Youtube, spotify: Music, podcast: Mic, twitch: Tv,
  product: ShoppingBag, discount_code: Tag, social_link: Share2,
  text: AlignLeft, image: Image, faq: HelpCircle, contact_form: Mail,
  stats: BarChart2, crypto: Hash, live_status: Radio,
}

const TYPE_COLORS: Record<string, string> = {
  link: "#e0e0e0", collection: "#e0e0e0", vault: "#f59e0b",
  drop: "#00ff88", youtube: "#ff0000", spotify: "#1DB954",
  podcast: "#f59e0b", twitch: "#9146FF", product: "#3b82f6",
  discount_code: "#f59e0b", social_link: "#e0e0e0", text: "#888",
  image: "#888", faq: "#888", contact_form: "#888", stats: "#00ff88",
  crypto: "#f7931a", live_status: "#ef4444",
}

// ─── Dashboard Page ───────────────────────────────────────────

export default function DashboardPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const router = useRouter()

  const [blocks, setBlocks] = useState<Block[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [collectionViewId, setCollectionViewId] = useState<string | null>(null)
  const [editTab, setEditTab] = useState<"content" | "style" | "settings">("content")
  const [previewKey, setPreviewKey] = useState(0)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  // ─── Auth redirect ───
  useEffect(() => {
    if (isLoaded && !clerkUser) router.push("/login")
  }, [isLoaded, clerkUser, router])

  // ─── Load data ───
  useEffect(() => {
    async function load() {
      try {
        const [profileRes, blocksRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/blocks"),
        ])
        if (profileRes.ok) setProfile(await profileRes.json())
        if (blocksRes.ok) setBlocks(await blocksRes.json())
      } catch {
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    if (clerkUser) load()
  }, [clerkUser])

  const userPlan = profile ? resolveUserPlan(profile as never) : "free"

  // ─── Block operations ───

  const topBlocks = blocks.filter(b => !b.parentId).sort((a, b) => a.position - b.position)
  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null
  const collectionBlock = collectionViewId ? blocks.find(b => b.id === collectionViewId) : null
  const displayBlocks = collectionViewId
    ? (collectionBlock?.children || []).sort((a, b) => a.position - b.position)
    : topBlocks

  const refreshPreview = useCallback(() => setPreviewKey(k => k + 1), [])

  const handleAddBlock = async (type: string) => {
    setShowAddPicker(false)
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: "Untitled",
          parentId: collectionViewId || undefined,
        }),
      })
      if (!res.ok) { toast.error("Failed to create block"); return }
      const block = await res.json()
      setBlocks(prev => [...prev, { ...block, children: [] }])
      setSelectedBlockId(block.id)
      setEditTab("content")
      refreshPreview()
    } catch {
      toast.error("Failed to create block")
    }
  }

  const handlePasteAdd = async (url: string) => {
    const detected = detectBlockFromUrl(url)
    if (!detected) { handleAddBlock("link"); return }
    setShowAddPicker(false)
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...detected,
          parentId: collectionViewId || undefined,
        }),
      })
      if (!res.ok) { toast.error("Failed to create block"); return }
      const block = await res.json()
      setBlocks(prev => [...prev, { ...block, children: [] }])
      setSelectedBlockId(block.id)
      refreshPreview()
    } catch {
      toast.error("Failed to create block")
    }
  }

  const handleToggleBlock = async (id: string, enabled: boolean) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, enabled } : b))
    try {
      const res = await fetch(`/api/blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) toast.error("Failed to update")
      refreshPreview()
    } catch {
      toast.error("Failed to update")
    }
  }

  const handleDeleteBlock = async (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedBlockId === id) setSelectedBlockId(null)
    try {
      await fetch(`/api/blocks/${id}`, { method: "DELETE" })
      refreshPreview()
    } catch {
      toast.error("Failed to delete")
    }
  }

  const handleUpdateBlock = async (id: string, data: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...data } : b))
    try {
      const res = await fetch(`/api/blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) toast.error("Failed to save")
      refreshPreview()
    } catch {
      toast.error("Failed to save")
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayBlocks.findIndex(b => b.id === active.id)
    const newIndex = displayBlocks.findIndex(b => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(displayBlocks, oldIndex, newIndex)

    if (collectionViewId) {
      setBlocks(prev => {
        const others = prev.filter(b => b.parentId !== collectionViewId)
        const parent = prev.find(b => b.id === collectionViewId)
        if (parent) {
          return [...others, { ...parent, children: reordered.map((b, i) => ({ ...b, position: i })) }]
        }
        return prev
      })
    } else {
      setBlocks(prev => {
        const children = prev.filter(b => b.parentId)
        return [...reordered.map((b, i) => ({ ...b, position: i })), ...children]
      })
    }

    fetch("/api/blocks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: reordered.map((b, i) => ({ id: b.id, position: i })) }),
    }).catch(() => toast.error("Failed to save order"))
  }

  // ─── Render ───

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#030303] flex items-center justify-center">
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[#00ff88] font-mono text-sm">Loading...</motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#030303] flex flex-col">
      {/* ─── Top Bar ─── */}
      <div className="h-12 bg-[#080808] border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0 z-20">
        <span className="text-[#00ff88] font-mono font-bold text-sm">Paytree</span>
        <span className="text-[#555] font-mono text-xs hidden sm:block">@{profile?.username}</span>
        <div className="flex items-center gap-2">
          {profile?.username && (
            <Link href={`/${profile.username}`} target="_blank"
              className="flex items-center gap-1.5 text-[#888] hover:text-white text-xs font-mono transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]">
              Open <ExternalLink size={12} />
            </Link>
          )}
          <button
            ref={addButtonRef}
            onClick={() => setShowAddPicker(true)}
            className="flex items-center gap-1.5 bg-[#00ff88] text-black font-mono font-semibold text-xs rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Add block
          </button>
        </div>
      </div>

      {/* ─── Upgrade Banner ─── */}
      {userPlan === "free" && profile?.pageStatus !== "published" && (
        <div className="bg-[#00ff88]/[0.05] border-b border-[#00ff88]/[0.1] px-4 py-2 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-[#00ff88] font-mono">Upgrade to publish your page</span>
          <Link href="/pricing" className="text-xs text-black bg-[#00ff88] font-mono font-semibold rounded-lg px-3 py-1 hover:opacity-90">
            Upgrade →
          </Link>
        </div>
      )}

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 transition-transform duration-300 ${selectedBlockId ? "lg:mr-[380px]" : ""}`}>
          {/* Collection breadcrumb */}
          <AnimatePresence>
            {collectionViewId && collectionBlock && (
              <motion.button
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={spring}
                onClick={() => setCollectionViewId(null)}
                className="flex items-center gap-2 text-[#00ff88] font-mono text-sm mb-4 hover:opacity-80 transition-opacity"
              >
                ← {collectionBlock.title}
              </motion.button>
            )}
          </AnimatePresence>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayBlocks.map(b => b.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[800px]">
                <AnimatePresence>
                  {displayBlocks.map((block) => (
                    <SortableCanvasCard
                      key={block.id}
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => { setSelectedBlockId(block.id); setEditTab("content") }}
                      onToggle={(enabled) => handleToggleBlock(block.id, enabled)}
                      onDelete={() => handleDeleteBlock(block.id)}
                      onOpenCollection={() => setCollectionViewId(block.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>

          {displayBlocks.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-4">
                <Plus size={24} className="text-[#444]" />
              </div>
              <p className="text-sm text-[#666] font-mono mb-3">No blocks yet</p>
              <button onClick={() => setShowAddPicker(true)}
                className="bg-[#00ff88] text-black font-mono font-semibold text-xs rounded-xl px-4 py-2 hover:opacity-90 transition-opacity">
                Add your first block
              </button>
            </motion.div>
          )}
        </div>

        {/* Preview Panel (desktop only) */}
        {profile?.username && !selectedBlockId && (
          <div className="hidden lg:block w-[380px] bg-[#080808] border-l border-white/[0.06] flex-shrink-0">
            <div className="sticky top-0 h-[calc(100vh-48px)] flex flex-col items-center justify-center p-6">
              <div className="w-[280px] h-[560px] rounded-[36px] border-2 border-white/[0.1] overflow-hidden bg-[#030303] shadow-2xl">
                <iframe
                  key={previewKey}
                  src={`/preview/${profile.username}?r=${previewKey}`}
                  className="w-[375px] h-[748px] origin-top-left border-0"
                  style={{ transform: "scale(0.747)" }}
                  title="Preview"
                />
              </div>
              <p className="text-[10px] text-[#444] font-mono mt-3">Live preview</p>
            </div>
          </div>
        )}

        {/* Edit Panel */}
        <AnimatePresence>
          {selectedBlock && (
            <>
              {/* Desktop: side panel */}
              <motion.div
                initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
                transition={spring}
                className="hidden lg:flex w-[380px] bg-[#0a0a0a] border-l border-white/[0.06] flex-col flex-shrink-0 fixed right-0 top-12 bottom-0 z-30"
              >
                <EditPanelContent
                  block={selectedBlock}
                  editTab={editTab}
                  setEditTab={setEditTab}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                  onClose={() => setSelectedBlockId(null)}
                />
              </motion.div>

              {/* Mobile: bottom sheet */}
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={spring}
                className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-[#0a0a0a] border-t border-white/[0.06] rounded-t-2xl max-h-[85vh] flex flex-col"
              >
                <div className="w-10 h-1 bg-white/[0.1] rounded-full mx-auto mt-2 mb-1" />
                <EditPanelContent
                  block={selectedBlock}
                  editTab={editTab}
                  setEditTab={setEditTab}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                  onClose={() => setSelectedBlockId(null)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Add Block Picker ─── */}
      <AnimatePresence>
        {showAddPicker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" onClick={() => setShowAddPicker(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              transition={spring}
              className="fixed top-14 right-4 z-50 w-[90vw] max-w-[420px] bg-[#0f0f0f] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
            >
              <AddBlockPicker
                onSelect={handleAddBlock}
                onPasteUrl={handlePasteAdd}
                onClose={() => setShowAddPicker(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sortable Canvas Card ─────────────────────────────────────

function SortableCanvasCard({ block, isSelected, onSelect, onToggle, onDelete, onOpenCollection }: {
  block: Block
  isSelected: boolean
  onSelect: () => void
  onToggle: (enabled: boolean) => void
  onDelete: () => void
  onOpenCollection: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  const isFull = block.size === "full" || block.type === "collection" || block.type === "text"

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: isDragging ? 1.02 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={gentleSpring}
      className={`${isFull ? "md:col-span-2" : ""} ${!block.enabled ? "opacity-50" : ""}`}
    >
      <div
        onClick={onSelect}
        className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 ${
          isSelected
            ? "border border-[#00ff88]/40 shadow-[0_0_0_2px_rgba(0,255,136,0.15)]"
            : "border border-white/[0.07] hover:border-white/[0.12]"
        } ${isDragging ? "shadow-xl shadow-black/40" : ""}`}
      >
        <CanvasCardBody block={block} onOpenCollection={onOpenCollection} />

        {/* Bottom bar */}
        <div className="h-8 bg-[#060606] border-t border-white/[0.04] flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-[#333] hover:text-[#666] transition-colors">
              <GripVertical size={12} />
            </button>
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#444]">{block.type.replace("_", " ")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); onToggle(!block.enabled) }}
              className="text-[#444] hover:text-[#888] transition-colors">
              {block.enabled ? <ToggleRight size={14} className="text-[#00ff88]" /> : <ToggleLeft size={14} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this block?")) onDelete() }}
              className="text-[#333] hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Canvas Card Body (type-specific) ─────────────────────────

function CanvasCardBody({ block, onOpenCollection }: { block: Block; onOpenCollection: () => void }) {
  const cfg = block.config || {}
  const Icon = TYPE_ICONS[block.type] || LinkIcon
  const color = TYPE_COLORS[block.type] || "#e0e0e0"

  switch (block.type) {
    case "link": {
      const meta = block.url ? getURLMeta(block.url) : null
      if (block.layout === "featured" && block.thumbnail) {
        return (
          <div className="bg-white/[0.02]">
            <div className="h-[90px] overflow-hidden relative">
              <img src={block.thumbnail} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute top-2 left-2 bg-[#00ff88]/20 text-[#00ff88] text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase">Featured</span>
              <p className="absolute bottom-2 left-3 text-xs font-medium text-white truncate right-3">{block.title}</p>
            </div>
          </div>
        )
      }
      return (
        <div className="bg-white/[0.03] px-4 py-3 flex items-center gap-3" style={{ minHeight: 64 }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${meta?.color || color}15`, color: meta?.color || color }}>
            {meta?.icon || <Icon size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{block.title}</p>
            {block.url && <p className="text-[10px] text-[#444] font-mono truncate">{block.url}</p>}
          </div>
          <ArrowUpRight size={12} className="text-[#333] flex-shrink-0" />
        </div>
      )
    }

    case "collection":
      return (
        <div className="bg-white/[0.03] px-4 py-3 flex items-center gap-3" style={{ minHeight: 72 }}
          onClick={(e) => { e.stopPropagation(); onOpenCollection() }}>
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <Folder size={16} className="text-[#555]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{block.title}</p>
            <p className="text-[10px] text-[#555] font-mono">{block.children?.length || 0} links</p>
          </div>
          <ChevronRight size={14} className="text-[#00ff88] flex-shrink-0" />
        </div>
      )

    case "vault":
      return (
        <div className="bg-amber-500/[0.03] px-4 py-3 flex items-center gap-3" style={{ minHeight: 80 }}>
          <div className="w-9 h-9 rounded-full bg-amber-500/[0.08] border border-amber-500/[0.2] flex items-center justify-center flex-shrink-0">
            <Lock size={14} className="text-amber-400/80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{block.title}</p>
            <p className="text-[10px] text-amber-400/60 font-mono">Email gated</p>
          </div>
        </div>
      )

    case "drop": {
      const dropAt = (cfg.dropAt as string) || ""
      const diff = dropAt ? new Date(dropAt).getTime() - Date.now() : 0
      const status = diff <= -86400000 ? "ENDED" : diff <= 0 ? "LIVE" : "SCHEDULED"
      return (
        <div className="px-4 py-3" style={{ backgroundColor: "rgba(0,255,136,0.03)", minHeight: 88 }}>
          <div className="flex items-center gap-2 mb-1">
            {status === "LIVE" && (
              <motion.div className="w-2 h-2 rounded-full bg-[#00ff88]"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            )}
            <span className="text-[9px] font-mono font-bold tracking-wider" style={{ color: status === "ENDED" ? "#555" : "#00ff88" }}>
              DROP · {status}
            </span>
          </div>
          <p className="text-sm font-semibold text-white truncate">{block.title}</p>
          {dropAt && <p className="text-[10px] text-[#555] font-mono mt-1">{new Date(dropAt).toLocaleDateString()}</p>}
        </div>
      )
    }

    case "youtube":
      return (
        <div className="bg-red-500/[0.03]" style={{ minHeight: 100 }}>
          {block.thumbnail ? (
            <div className="h-[80px] overflow-hidden relative">
              <img src={block.thumbnail} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-red-600/90 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[60px] flex items-center justify-center">
              <Youtube size={24} className="text-red-500/30" />
            </div>
          )}
          <div className="px-3 py-2">
            <p className="text-xs text-white truncate">{block.title}</p>
          </div>
        </div>
      )

    case "product":
      return (
        <div className="bg-blue-500/[0.03]" style={{ minHeight: 100 }}>
          {block.thumbnail ? (
            <div className="h-[70px] overflow-hidden relative">
              <img src={block.thumbnail} alt="" className="w-full h-full object-cover" />
              <span className="absolute top-2 left-2 bg-blue-500/20 text-blue-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase">Shop</span>
            </div>
          ) : (
            <div className="h-[50px] bg-gradient-to-br from-blue-500/10 to-blue-500/[0.02] flex items-center justify-center">
              <ShoppingBag size={18} className="text-blue-400/30" />
            </div>
          )}
          <div className="px-3 py-2">
            <p className="text-xs text-white truncate">{block.title}</p>
            {(cfg.price as number) && (
              <p className="text-xs font-mono text-[#00ff88]">${((cfg.price as number) / 100).toFixed(2)}</p>
            )}
          </div>
        </div>
      )

    default:
      return (
        <div className="bg-white/[0.03] px-4 py-3 flex items-center gap-3" style={{ minHeight: 56 }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}12`, color }}>
            <Icon size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{block.title}</p>
            <p className="text-[10px] text-[#444] font-mono">{block.type.replace("_", " ")}</p>
          </div>
        </div>
      )
  }
}

// ─── Add Block Picker ─────────────────────────────────────────

function AddBlockPicker({ onSelect, onPasteUrl, onClose }: {
  onSelect: (type: string) => void
  onPasteUrl: (url: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose()
    if (e.key === "Enter" && search.startsWith("http")) {
      onPasteUrl(search)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").trim()
    if (text.startsWith("http")) {
      e.preventDefault()
      onPasteUrl(text)
    }
  }

  const allItems = BLOCK_CATEGORIES.flatMap(c => c.items)
  const filtered = search
    ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <div className="max-h-[70vh] flex flex-col">
      <div className="p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl px-3 py-2.5">
          <Search size={14} className="text-[#555]" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Paste any link or search..."
            className="flex-1 bg-transparent text-sm text-[#e0e0e0] font-mono outline-none placeholder:text-[#444]"
          />
          <button onClick={onClose} className="text-[#555] hover:text-[#888] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto p-2">
        {filtered ? (
          filtered.map((item) => (
            <PickerItem key={item.id} item={item} onSelect={() => onSelect(item.id)} />
          ))
        ) : (
          BLOCK_CATEGORIES.map((cat) => (
            <div key={cat.label} className="mb-2">
              <p className="text-[9px] font-mono uppercase tracking-widest text-[#444] px-2 py-1.5">{cat.label}</p>
              {cat.items.map((item) => (
                <PickerItem key={item.id} item={item} onSelect={() => onSelect(item.id)} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function PickerItem({ item, onSelect }: { item: { id: string; name: string; icon: typeof LinkIcon; desc: string }; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-left group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${TYPE_COLORS[item.id] || "#888"}12`, color: TYPE_COLORS[item.id] || "#888" }}>
        <item.icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#e0e0e0]">{item.name}</p>
        <p className="text-[10px] text-[#555] font-mono">{item.desc}</p>
      </div>
      <ArrowUpRight size={12} className="text-[#333] group-hover:text-[#666] transition-colors flex-shrink-0" />
    </button>
  )
}

// ─── Edit Panel Content ───────────────────────────────────────

function EditPanelContent({ block, editTab, setEditTab, onUpdate, onDelete, onClose }: {
  block: Block
  editTab: "content" | "style" | "settings"
  setEditTab: (tab: "content" | "style" | "settings") => void
  onUpdate: (id: string, data: Partial<Block>) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const Icon = TYPE_ICONS[block.type] || LinkIcon
  const color = TYPE_COLORS[block.type] || "#e0e0e0"

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}12`, color }}>
            <Icon size={12} />
          </div>
          <span className="text-xs font-mono text-[#888] uppercase tracking-wider">{block.type.replace("_", " ")}</span>
        </div>
        <button onClick={onClose} className="text-[#555] hover:text-white transition-colors p-1">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] flex-shrink-0">
        {(["content", "style", "settings"] as const).map((tab) => (
          <button key={tab} onClick={() => setEditTab(tab)}
            className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors relative ${
              editTab === tab ? "text-[#00ff88]" : "text-[#555] hover:text-[#888]"
            }`}>
            {tab}
            {editTab === tab && (
              <motion.div layoutId="edit-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00ff88]" transition={spring} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {editTab === "content" && <ContentTab block={block} onUpdate={onUpdate} />}
        {editTab === "style" && <StyleTab block={block} onUpdate={onUpdate} />}
        {editTab === "settings" && <SettingsTab block={block} onUpdate={onUpdate} onDelete={onDelete} />}
      </div>
    </>
  )
}

// ─── Content Tab ──────────────────────────────────────────────

function ContentTab({ block, onUpdate }: { block: Block; onUpdate: (id: string, data: Partial<Block>) => void }) {
  const cfg = block.config || {}

  const updateField = (field: string, value: unknown) => onUpdate(block.id, { [field]: value })
  const updateConfig = (key: string, value: unknown) => onUpdate(block.id, { config: { ...cfg, [key]: value } })

  return (
    <>
      <FieldGroup label="Title">
        <input defaultValue={block.title} onBlur={(e) => updateField("title", e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
      </FieldGroup>

      {(block.type === "link" || block.type === "social_link") && (
        <FieldGroup label="URL">
          <input defaultValue={block.url || ""} onBlur={(e) => updateField("url", e.target.value || null)}
            placeholder="https://"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}

      {block.type === "link" && (
        <FieldGroup label="Layout">
          <div className="flex gap-2">
            {(["classic", "featured"] as const).map(layout => (
              <button key={layout} onClick={() => updateField("layout", layout)}
                className={`flex-1 py-2 rounded-xl text-xs font-mono transition-colors ${
                  block.layout === layout ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]" : "bg-white/[0.03] border border-white/[0.07] text-[#888]"
                }`}>{layout}</button>
            ))}
          </div>
        </FieldGroup>
      )}

      {block.type === "link" && block.layout === "featured" && (
        <FieldGroup label="Thumbnail URL">
          <input defaultValue={block.thumbnail || ""} onBlur={(e) => updateField("thumbnail", e.target.value || null)}
            placeholder="https://..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}

      {block.type === "vault" && (
        <>
          <FieldGroup label="Content (revealed after unlock)">
            <textarea defaultValue={(cfg.content as string) || ""} onBlur={(e) => updateConfig("content", e.target.value)} rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30 resize-none" />
          </FieldGroup>
          <FieldGroup label="Download URL">
            <input defaultValue={(cfg.downloadUrl as string) || ""} onBlur={(e) => updateConfig("downloadUrl", e.target.value)}
              placeholder="https://..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
          <FieldGroup label="Access URL">
            <input defaultValue={block.url || ""} onBlur={(e) => updateField("url", e.target.value || null)}
              placeholder="https://..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
        </>
      )}

      {block.type === "drop" && (
        <>
          <FieldGroup label="Drop Date & Time">
            <input type="datetime-local" defaultValue={(cfg.dropAt as string)?.slice(0, 16) || ""}
              onBlur={(e) => updateConfig("dropAt", e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
          <FieldGroup label="Spots Limit">
            <input type="number" defaultValue={(cfg.limitedSpots as number) || ""} onBlur={(e) => updateConfig("limitedSpots", e.target.value ? Number(e.target.value) : null)}
              placeholder="Unlimited"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
          <FieldGroup label="Reveal URL">
            <input defaultValue={(cfg.revealUrl as string) || ""} onBlur={(e) => updateConfig("revealUrl", e.target.value)}
              placeholder="https://..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
          <FieldGroup label="Reveal Text">
            <input defaultValue={(cfg.revealText as string) || ""} onBlur={(e) => updateConfig("revealText", e.target.value)}
              placeholder="Shown when drop ends"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
        </>
      )}

      {block.type === "youtube" && (
        <FieldGroup label="Channel ID or @handle">
          <input defaultValue={(cfg.channelId as string) || ""} onBlur={(e) => updateConfig("channelId", e.target.value)}
            placeholder="@channelname or UCxxxxxx"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}

      {block.type === "product" && (
        <>
          <FieldGroup label="Price (cents)">
            <input type="number" defaultValue={(cfg.price as number) || ""} onBlur={(e) => updateConfig("price", e.target.value ? Number(e.target.value) : null)}
              placeholder="999 = $9.99"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
          <FieldGroup label="Description">
            <textarea defaultValue={block.description || ""} onBlur={(e) => updateField("description", e.target.value || null)} rows={2}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30 resize-none" />
          </FieldGroup>
          <FieldGroup label="Image URL">
            <input defaultValue={block.thumbnail || ""} onBlur={(e) => updateField("thumbnail", e.target.value || null)}
              placeholder="https://..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
        </>
      )}

      {block.type === "spotify" && (
        <FieldGroup label="Playlist URL">
          <input defaultValue={(cfg.playlistUrl as string) || ""} onBlur={(e) => updateConfig("playlistUrl", e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}

      {block.type === "podcast" && (
        <FieldGroup label="RSS Feed URL">
          <input defaultValue={(cfg.rssUrl as string) || ""} onBlur={(e) => updateConfig("rssUrl", e.target.value)}
            placeholder="https://..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}

      {block.type === "twitch" && (
        <FieldGroup label="Twitch Username">
          <input defaultValue={(cfg.username as string) || ""} onBlur={(e) => updateConfig("username", e.target.value)}
            placeholder="username"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}

      {block.type === "text" && (
        <>
          <FieldGroup label="Style">
            <div className="flex gap-2">
              {(["heading", "paragraph"] as const).map(s => (
                <button key={s} onClick={() => updateConfig("style", s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono transition-colors ${
                    (cfg.style as string) === s ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]" : "bg-white/[0.03] border border-white/[0.07] text-[#888]"
                  }`}>{s}</button>
              ))}
            </div>
          </FieldGroup>
          {(cfg.style as string) !== "heading" && (
            <FieldGroup label="Content">
              <textarea defaultValue={(cfg.content as string) || ""} onBlur={(e) => updateConfig("content", e.target.value)} rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30 resize-none" />
            </FieldGroup>
          )}
        </>
      )}

      {block.type === "image" && (
        <FieldGroup label="Image URL">
          <input defaultValue={block.thumbnail || (cfg.imageUrl as string) || ""} onBlur={(e) => updateField("thumbnail", e.target.value || null)}
            placeholder="https://..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}

      {block.type === "stats" && (
        <>
          <FieldGroup label="Value">
            <input defaultValue={(cfg.value as string) || ""} onBlur={(e) => updateConfig("value", e.target.value)}
              placeholder="10,000"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
          <FieldGroup label="Label">
            <input defaultValue={(cfg.label as string) || ""} onBlur={(e) => updateConfig("label", e.target.value)}
              placeholder="Students"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
        </>
      )}

      {block.type === "discount_code" && (
        <>
          <FieldGroup label="Code">
            <input defaultValue={(cfg.code as string) || ""} onBlur={(e) => updateConfig("code", e.target.value)}
              placeholder="SAVE20"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
          <FieldGroup label="Description">
            <input defaultValue={(cfg.description as string) || ""} onBlur={(e) => updateConfig("description", e.target.value)}
              placeholder="20% off all products"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
        </>
      )}

      {block.type === "crypto" && (
        <>
          <FieldGroup label="Currency">
            <div className="flex gap-2">
              {(["BTC", "ETH", "SOL"] as const).map(c => (
                <button key={c} onClick={() => updateConfig("currency", c)}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono transition-colors ${
                    (cfg.currency as string) === c ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]" : "bg-white/[0.03] border border-white/[0.07] text-[#888]"
                  }`}>{c}</button>
              ))}
            </div>
          </FieldGroup>
          <FieldGroup label="Address">
            <input defaultValue={(cfg.address as string) || ""} onBlur={(e) => updateConfig("address", e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </FieldGroup>
        </>
      )}

      {block.type === "social_link" && (
        <FieldGroup label="Platform">
          <input defaultValue={(cfg.platform as string) || ""} onBlur={(e) => updateConfig("platform", e.target.value)}
            placeholder="instagram, twitter, youtube..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}
    </>
  )
}

// ─── Style Tab ────────────────────────────────────────────────

function StyleTab({ block, onUpdate }: { block: Block; onUpdate: (id: string, data: Partial<Block>) => void }) {
  return (
    <>
      <FieldGroup label="Size">
        <div className="flex gap-2">
          {(["full", "half"] as const).map(size => (
            <button key={size} onClick={() => onUpdate(block.id, { size })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-mono transition-colors ${
                block.size === size ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]" : "bg-white/[0.03] border border-white/[0.07] text-[#888]"
              }`}>{size === "full" ? "Full width" : "Half width"}</button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Button Style">
        <div className="grid grid-cols-3 gap-2">
          {["glass", "3d", "gradient", "glow", "neon", "outline"].map(s => (
            <button key={s} onClick={() => onUpdate(block.id, { style: s })}
              className={`py-2 rounded-xl text-[10px] font-mono transition-colors ${
                block.style === s ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]" : "bg-white/[0.03] border border-white/[0.07] text-[#888]"
              }`}>{s}</button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Lock">
        <div className="grid grid-cols-3 gap-2">
          {["none", "email", "payment", "password", "age"].map(l => (
            <button key={l} onClick={() => onUpdate(block.id, { lockType: l })}
              className={`py-2 rounded-xl text-[10px] font-mono transition-colors ${
                block.lockType === l ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]" : "bg-white/[0.03] border border-white/[0.07] text-[#888]"
              }`}>{l === "none" ? "None" : l}</button>
          ))}
        </div>
      </FieldGroup>

      {block.lockType === "password" && (
        <FieldGroup label="Password">
          <input defaultValue={block.lockValue || ""} onBlur={(e) => onUpdate(block.id, { lockValue: e.target.value || null })}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}

      {block.lockType === "payment" && (
        <FieldGroup label="Price (cents)">
          <input type="number" defaultValue={(block.config?.price as number) || ""} onBlur={(e) => onUpdate(block.id, { config: { ...block.config, price: e.target.value ? Number(e.target.value) : null } })}
            placeholder="999 = $9.99"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
        </FieldGroup>
      )}

      <FieldGroup label="Schedule">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-mono text-[#555] mb-1 block">Start</label>
            <input type="datetime-local" defaultValue={block.scheduleStart?.slice(0, 16) || ""}
              onBlur={(e) => onUpdate(block.id, { scheduleStart: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#555] mb-1 block">End</label>
            <input type="datetime-local" defaultValue={block.scheduleEnd?.slice(0, 16) || ""}
              onBlur={(e) => onUpdate(block.id, { scheduleEnd: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30" />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Priority">
        <div className="grid grid-cols-2 gap-2">
          {["none", "animate", "auto_expand", "redirect"].map(p => (
            <button key={p} onClick={() => onUpdate(block.id, { priority: p })}
              className={`py-2 rounded-xl text-[10px] font-mono transition-colors ${
                block.priority === p ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]" : "bg-white/[0.03] border border-white/[0.07] text-[#888]"
              }`}>{p === "none" ? "None" : p.replace("_", " ")}</button>
          ))}
        </div>
      </FieldGroup>
    </>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────

function SettingsTab({ block, onUpdate, onDelete }: {
  block: Block; onUpdate: (id: string, data: Partial<Block>) => void; onDelete: (id: string) => void
}) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-[#888] font-mono">Clicks</span>
          <span className="text-xs text-[#e0e0e0] font-mono">{block.clickCount}</span>
        </div>
        {block.createdAt && (
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-[#888] font-mono">Created</span>
            <span className="text-xs text-[#e0e0e0] font-mono">{new Date(block.createdAt).toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-[#888] font-mono">Block ID</span>
          <button onClick={() => { navigator.clipboard.writeText(block.id); toast.success("Copied!") }}
            className="flex items-center gap-1.5 text-xs text-[#555] font-mono hover:text-[#888] transition-colors">
            {block.id.slice(0, 12)}... <Copy size={10} />
          </button>
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-4 mt-6">
        <button onClick={() => { if (confirm("Delete this block? This cannot be undone.")) onDelete(block.id) }}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs rounded-xl py-3 hover:bg-red-500/20 transition-colors">
          Delete block
        </button>
      </div>
    </>
  )
}

// ─── Field Group Helper ───────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-[#555] mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}
