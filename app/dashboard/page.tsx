"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter, usePathname } from "next/navigation"
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { glass, glassReflection } from "@/lib/glass"
import { getURLMeta } from "@/components/ui/block-renderer"
import {
  Plus, X, GripVertical, ChevronRight, ArrowUpRight,
  Search, Folder, Link as LinkIcon, Lock, Timer, Youtube, ShoppingBag,
  Music, Mic, Radio, Share2, BarChart2, Image, AlignLeft, HelpCircle,
  Mail, Tag, Trash2, Star, MoreHorizontal,
  Tv, Hash, Copy, Pencil, CopyPlus,
  LayoutGrid, Paintbrush, Settings, Menu, CreditCard,
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
  stripeAccountStatus: string | null
  accentColor: string | null
}

// ─── Spring configs ───────────────────────────────────────────

const spring = { type: "spring" as const, stiffness: 400, damping: 28 }
const gentleSpring = { type: "spring" as const, stiffness: 300, damping: 30 }

// ─── URL detection ────────────────────────────────────────────

function detectBlockFromUrl(url: string): { type: string; title: string; url: string; config?: Record<string, unknown> } | null {
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    if (h.includes("youtube.com") || h.includes("youtu.be")) {
      // Detect specific video first (watch?v=, youtu.be/, /shorts/)
      const videoId =
        u.searchParams.get("v") ||
        (h.includes("youtu.be") ? u.pathname.slice(1).split("/")[0] : null) ||
        url.match(/\/(?:shorts|embed)\/([\w-]{11})/)?.[1] || null
      if (videoId && /^[\w-]{11}$/.test(videoId)) {
        return { type: "youtube", title: "YouTube video", url, config: { mode: "video", videoUrl: url, videoId } }
      }
      const channelMatch = url.match(/\/@?([\w-]+)/) || url.match(/\/channel\/([\w-]+)/)
      return { type: "youtube", title: "YouTube", url, config: { mode: "channel", ...(channelMatch ? { channelId: channelMatch[1] } : {}) } }
    }
    if (h.includes("open.spotify.com") && url.includes("/show"))
      return { type: "podcast", title: "Podcast", url, config: { rssUrl: url } }
    if (h.includes("open.spotify.com") || h.includes("spotify.com"))
      return { type: "spotify", title: "Spotify", url, config: { playlistUrl: url } }
    if (url.endsWith(".rss") || url.includes("/feed"))
      return { type: "podcast", title: "Podcast", url, config: { rssUrl: url } }
    if (h.includes("twitch.tv")) {
      const m = url.match(/twitch\.tv\/([\w]+)/)
      return { type: "twitch", title: "Twitch", url, config: m ? { username: m[1] } : {} }
    }
    if (h.includes("instagram.com"))
      return { type: "social_link", title: "Instagram", url, config: { platform: "instagram" } }
    if (h.includes("tiktok.com"))
      return { type: "social_link", title: "TikTok", url, config: { platform: "tiktok" } }
    if (h.includes("twitter.com") || h.includes("x.com"))
      return { type: "social_link", title: "X", url, config: { platform: "x" } }
    if (h.includes("discord.gg") || h.includes("discord.com"))
      return { type: "link", title: "Join my Discord", url }
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
    label: "Suggested",
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
      { id: "vault", name: "Vault", icon: Lock, desc: "Paid or gated content" },
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
    ],
  },
  {
    label: "Display",
    items: [
      { id: "stats", name: "Stats", icon: BarChart2, desc: "Number counter" },
      { id: "live_status", name: "Live Status", icon: Radio, desc: "Broadcast status" },
      { id: "drop", name: "Countdown", icon: Timer, desc: "Timed reveal" },
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
  const pathname = usePathname()

  const [blocks, setBlocks] = useState<Block[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [collectionViewId, setCollectionViewId] = useState<string | null>(null)
  const [stripeBannerDismissed, setStripeBannerDismissed] = useState(true)
  const [editTab, setEditTab] = useState<"content" | "style" | "settings">("content")
  const [previewKey, setPreviewKey] = useState(0)
  const [previewUrl, setPreviewUrl] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
        if (profileRes.ok) {
          const data = await profileRes.json()
          setProfile(data)
          setPreviewUrl(`/preview/${data.username}`)
        }
        if (blocksRes.ok) setBlocks(await blocksRes.json())
      } catch {
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    if (clerkUser) load()
  }, [clerkUser])

  // Sync accent color CSS var for dashboard (affects BlockRenderer cards in preview)
  useEffect(() => {
    if (profile?.accentColor) {
      document.documentElement.style.setProperty("--accent", profile.accentColor)
    }
  }, [profile?.accentColor])

  // Read the Stripe banner dismissed state (gated to client to avoid SSR flash)
  useEffect(() => {
    setStripeBannerDismissed(
      typeof window !== "undefined" &&
      window.localStorage.getItem("paytree_stripe_banner_dismissed") === "1"
    )
  }, [])

  const dismissStripeBanner = () => {
    try { window.localStorage.setItem("paytree_stripe_banner_dismissed", "1") } catch {}
    setStripeBannerDismissed(true)
  }

  const userPlan = profile ? resolveUserPlan(profile as never) : "free"

  // ─── Derived state ───

  const topBlocks = blocks
    .filter(b => !b.parentId)
    .sort((a, b) => {
      const aStar = a.priority === "starred" ? 1 : 0
      const bStar = b.priority === "starred" ? 1 : 0
      if (aStar !== bStar) return bStar - aStar
      return a.position - b.position
    })
  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null
  const collectionBlock = collectionViewId ? blocks.find(b => b.id === collectionViewId) : null
  const displayBlocks = collectionViewId
    ? (collectionBlock?.children || []).sort((a, b) => a.position - b.position)
    : topBlocks

  const refreshPreview = useCallback(() => setPreviewKey(k => k + 1), [])

  // ─── Block operations ───

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
      if (!res.ok) { toast.error("Failed to create card"); return }
      const block = await res.json()
      setBlocks(prev => [...prev, { ...block, children: [] }])
      setSelectedBlockId(block.id)
      setEditTab("content")
      refreshPreview()
      toast.success("Card added")
    } catch {
      toast.error("Failed to create card")
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
      if (!res.ok) { toast.error("Failed to create card"); return }
      const block = await res.json()
      setBlocks(prev => [...prev, { ...block, children: [] }])
      setSelectedBlockId(block.id)
      setEditTab("content")
      refreshPreview()
      toast.success("Card added")
    } catch {
      toast.error("Failed to create card")
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

  const handleDuplicateBlock = async (id: string) => {
    const source = blocks.find(b => b.id === id)
    if (!source) return
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: source.type,
          title: source.title,
          url: source.url,
          description: source.description,
          thumbnail: source.thumbnail,
          config: source.config,
          layout: source.layout,
          style: source.style,
          size: source.size,
          priority: "none",
          lockType: source.lockType,
          lockValue: source.lockValue,
          parentId: source.parentId || undefined,
        }),
      })
      if (!res.ok) { toast.error("Failed to duplicate"); return }
      const block = await res.json()
      setBlocks(prev => [...prev, { ...block, children: [] }])
      refreshPreview()
      toast.success("Card duplicated")
    } catch {
      toast.error("Failed to duplicate")
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
    <div className="fixed inset-0 bg-[#030303]">
      {/* ─── Left Sidebar (desktop) ─── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[200px] z-40 flex-col bg-[#080808] border-r border-white/[0.06]">
        {/* Logo */}
        <div className="p-5 flex-shrink-0">
          <span className="text-[#00ff88] font-mono font-bold text-lg">Paytree</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1">
          <SidebarItem href="/dashboard" icon={LayoutGrid} label="Cards" active={pathname === "/dashboard"} />
          <SidebarItem href="/dashboard/studio" icon={Paintbrush} label="Design" active={pathname.startsWith("/dashboard/studio")} />
          <SidebarItem href="/dashboard/analytics" icon={BarChart2} label="Analytics" active={pathname.startsWith("/dashboard/analytics")} />
          <SidebarItem href="/dashboard/payments" icon={CreditCard} label="Payments" active={pathname.startsWith("/dashboard/payments")} />
          <SidebarItem href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} />
        </nav>

        {/* User info */}
        {profile?.username && (
          <div className="p-3 flex-shrink-0 border-t border-white/[0.06]">
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-mono text-[#00ff88] font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-[#888] truncate">@{profile.username}</p>
              </div>
              <ArrowUpRight size={12} className="text-[#444] group-hover:text-[#888] transition-colors flex-shrink-0" />
            </Link>
          </div>
        )}
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -200 }} animate={{ x: 0 }} exit={{ x: -200 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[200px] z-50 flex flex-col bg-[#080808] border-r border-white/[0.06]"
            >
              <div className="p-5 flex items-center justify-between flex-shrink-0">
                <span className="text-[#00ff88] font-mono font-bold text-lg">Paytree</span>
                <button onClick={() => setSidebarOpen(false)} className="text-[#555] hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <nav className="flex-1 px-3 space-y-1">
                <SidebarItem href="/dashboard" icon={LayoutGrid} label="Cards" active={pathname === "/dashboard"} onClick={() => setSidebarOpen(false)} />
                <SidebarItem href="/dashboard/studio" icon={Paintbrush} label="Design" active={pathname.startsWith("/dashboard/studio")} onClick={() => setSidebarOpen(false)} />
                <SidebarItem href="/dashboard/analytics" icon={BarChart2} label="Analytics" active={pathname.startsWith("/dashboard/analytics")} onClick={() => setSidebarOpen(false)} />
                <SidebarItem href="/dashboard/payments" icon={CreditCard} label="Payments" active={pathname.startsWith("/dashboard/payments")} onClick={() => setSidebarOpen(false)} />
                <SidebarItem href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} onClick={() => setSidebarOpen(false)} />
              </nav>
              {profile?.username && (
                <div className="p-3 flex-shrink-0 border-t border-white/[0.06]">
                  <Link href={`/${profile.username}`} target="_blank"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                    onClick={() => setSidebarOpen(false)}>
                    <div className="w-7 h-7 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-mono text-[#00ff88] font-bold">{profile.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-[#888] truncate">@{profile.username}</p>
                    </div>
                    <ArrowUpRight size={12} className="text-[#444] group-hover:text-[#888] transition-colors flex-shrink-0" />
                  </Link>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Top Bar ─── */}
      <div
        className="fixed top-0 left-0 lg:left-[200px] right-0 h-12 z-50 flex items-center justify-between px-5 bg-[#080808] border-b border-white/[0.06]"
        style={{ boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.04)" }}
      >
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-[#555] hover:text-white transition-colors mr-3"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <span className="text-[#00ff88] font-mono font-bold text-lg lg:hidden">Paytree</span>
        <span className="hidden lg:block absolute left-1/2 lg:left-[calc(100px+50%)] -translate-x-1/2 text-[#444] font-mono text-sm">
          @{profile?.username}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {profile?.username && (
            <Link href={`/${profile.username}`} target="_blank"
              className="flex items-center gap-1.5 text-[#888] hover:text-white text-xs font-mono transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]">
              Open <ArrowUpRight size={12} />
            </Link>
          )}
          <button
            ref={addButtonRef}
            onClick={() => setShowAddPicker(true)}
            className="flex items-center gap-1.5 bg-[#00ff88] text-black font-mono font-semibold text-xs rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Add card
          </button>
        </div>
      </div>

      {/* ─── Canvas (scrollable) ─── */}
      <div
        className="fixed inset-0 overflow-y-auto lg:ml-[200px] lg:mr-[360px] bg-[#060606]"
        style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 56, paddingBottom: 40 }}
      >
        {/* Upgrade Banner */}
        {userPlan === "free" && profile?.pageStatus !== "published" && (
          <div
            className="mb-4 px-4 py-2 flex items-center justify-between rounded-xl border border-[#00ff88]/[0.1]"
            style={{ background: "linear-gradient(to right, rgba(0,255,136,0.06), transparent)" }}
          >
            <span className="text-xs text-[#00ff88] font-mono">🚀 Publish your page — upgrade to Starter</span>
            <Link href="/pricing" className="text-xs text-black bg-[#00ff88] font-mono font-semibold rounded-full px-3 py-1 hover:opacity-90">
              Upgrade $7/mo →
            </Link>
          </div>
        )}

        {/* Stripe Connect Banner — paid users without an active Stripe account */}
        {userPlan !== "free"
          && profile?.stripeAccountStatus !== "active"
          && !stripeBannerDismissed && (
          <div
            className="mb-4 px-4 py-2.5 flex items-center justify-between gap-3 rounded-xl"
            style={{
              background: "linear-gradient(to right, rgba(99,91,255,0.08), transparent)",
              border: "0.5px solid rgba(99,91,255,0.18)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <span className="text-xs text-[#d0d0ff] font-mono flex-1 truncate">
              💳 Want to sell products? Connect Stripe to start accepting payments.
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/dashboard/payments"
                className="text-[11px] text-white bg-[#635BFF] font-mono font-semibold rounded-full px-3 py-1 hover:opacity-90"
              >
                Set up payments →
              </Link>
              <button
                onClick={dismissStripeBanner}
                className="text-[11px] font-mono text-[#666] hover:text-[#aaa] transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

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
            <div
              className="max-w-[800px] mx-auto"
              style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}
            >
              <AnimatePresence>
                {displayBlocks.map((block) => (
                  <SortableCanvasCard
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => { setSelectedBlockId(block.id); setEditTab("content") }}
                    onToggle={(enabled) => handleToggleBlock(block.id, enabled)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onDuplicate={() => handleDuplicateBlock(block.id)}
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
            <p className="text-sm text-[#666] font-mono mb-3">No cards yet</p>
            <button onClick={() => setShowAddPicker(true)}
              className="bg-[#00ff88] text-black font-mono font-semibold text-xs rounded-xl px-4 py-2 hover:opacity-90 transition-opacity">
              Add your first card
            </button>
          </motion.div>
        )}
      </div>

      {/* ─── Preview Panel (desktop only, fixed right) ─── */}
      {previewUrl && (
        <div className="hidden lg:flex fixed right-0 top-0 bottom-0 w-[360px] z-40 bg-[#080808] border-l border-white/[0.06] flex-col items-center justify-center p-6">
          <p className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-4">Preview</p>
          <div
            style={{
              width: 280,
              height: 560,
              borderRadius: 40,
              border: "1.5px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
              background: "#030303",
              position: "relative",
            }}
          >
            <iframe
              key={previewKey}
              src={previewUrl}
              style={{
                width: 375,
                height: 812,
                transform: "scale(0.747)",
                transformOrigin: "top left",
                border: "none",
                pointerEvents: "none",
              }}
              title="Preview"
            />
          </div>
          <button
            onClick={refreshPreview}
            className="flex items-center gap-1.5 text-[10px] text-[#555] font-mono mt-4 hover:text-[#888] transition-colors"
          >
            ↻ Refresh preview
          </button>
        </div>
      )}

      {/* ─── Edit Panel ─── */}
      <AnimatePresence>
        {selectedBlock && (
          <>
            {/* Desktop: side panel */}
            <motion.div
              initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="hidden lg:flex w-[360px] flex-col flex-shrink-0 fixed right-0 top-0 bottom-0 z-50"
              style={{ background: "#0a0a0a", borderLeft: "1px solid rgba(255,255,255,0.06)", boxShadow: "inset 1px 0 0 rgba(255,255,255,0.04)" }}
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
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-[60] bg-[#0a0a0a] border-t border-white/[0.06] rounded-t-2xl max-h-[85vh] flex flex-col"
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

      {/* ─── Add Card Picker ─── */}
      <AnimatePresence>
        {showAddPicker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" onClick={() => setShowAddPicker(false)} />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: -8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="fixed top-14 right-4 z-[60] w-[90vw] max-w-[420px] overflow-hidden"
              style={{
                background: "#0f0f0f",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                boxShadow: "0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
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

// ─── Toggle Switch ────────────────────────────────────────────

function ToggleSwitch({ on, onClick }: { on: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-full transition-colors flex-shrink-0"
      style={{
        width: 32,
        height: 18,
        background: on ? "#00ff88" : "rgba(255,255,255,0.1)",
      }}
      aria-label="Toggle card"
    >
      <motion.span
        className="absolute top-[2px] rounded-full bg-white"
        style={{ width: 14, height: 14 }}
        animate={{ left: on ? 16 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

// ─── Card Menu Dropdown ───────────────────────────────────────

function CardMenu({ onEdit, onDuplicate, onDelete }: {
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className="text-[#444] hover:text-[#888] transition-colors"
        aria-label="Card menu"
      >
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={spring}
              className="absolute bottom-6 right-0 z-50 w-32 py-1 overflow-hidden"
              style={{
                background: "#0f0f0f",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
              }}
            >
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#888] hover:bg-white/[0.04] hover:text-white transition-colors">
                <Pencil size={12} /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDuplicate() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#888] hover:bg-white/[0.04] hover:text-white transition-colors">
                <CopyPlus size={12} /> Duplicate
              </button>
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); setConfirmDelete(true) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this card?"
        description="The card and any data attached to it will be permanently removed. This cannot be undone."
        confirmLabel="Delete card"
        onConfirm={() => { setConfirmDelete(false); onDelete() }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

// ─── Sortable Canvas Card ─────────────────────────────────────

function SortableCanvasCard({ block, isSelected, onSelect, onToggle, onDelete, onDuplicate, onOpenCollection }: {
  block: Block
  isSelected: boolean
  onSelect: () => void
  onToggle: (enabled: boolean) => void
  onDelete: () => void
  onDuplicate: () => void
  onOpenCollection: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const [hovered, setHovered] = useState(false)

  const isFull = block.type !== "social_link" && (block.type === "collection" || block.type === "text" || block.size !== "half")
  const isStarred = block.priority === "starred"

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    gridColumn: isFull ? "1 / -1" : "span 1",
  }

  const cardStyle = isSelected
    ? glass.cardSelected
    : hovered
      ? glass.cardHover
      : glass.card

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: isDragging ? 1.02 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={gentleSpring}
      className={`${!block.enabled ? "opacity-50" : ""}`}
    >
      <div
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative overflow-hidden cursor-pointer"
        style={{
          ...cardStyle,
          transition: "all 150ms ease",
          ...(isDragging ? { boxShadow: "0 8px 32px rgba(0,0,0,0.4)" } : {}),
        }}
      >
        {/* Top reflection line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "1px",
          background: glassReflection,
          pointerEvents: "none",
        }} />

        {/* Starred animated border */}
        {isStarred && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: "1px solid rgba(0,255,136,0.4)" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <CanvasCardBody block={block} onOpenCollection={onOpenCollection} />

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between px-3"
          style={{ height: "36px", borderTop: "0.5px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" }}
        >
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}
              className="cursor-grab active:cursor-grabbing text-[#333] hover:text-[#666] transition-colors">
              <GripVertical size={12} />
            </button>
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#444]">{block.type.replace("_", " ")}</span>
            {isStarred && <Star size={9} className="text-[#00ff88] fill-[#00ff88]" />}
          </div>
          <div className="flex items-center gap-2.5">
            <ToggleSwitch on={block.enabled} onClick={(e) => { e.stopPropagation(); onToggle(!block.enabled) }} />
            <CardMenu onEdit={onSelect} onDuplicate={onDuplicate} onDelete={onDelete} />
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
          <div>
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
        <div className="px-4 py-3 flex items-center gap-3" style={{ minHeight: 64 }}>
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
        <div className="px-4 py-3 flex items-center gap-3" style={{ minHeight: 72 }}
          onClick={(e) => { e.stopPropagation(); onOpenCollection() }}>
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <Folder size={16} className="text-[#555]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{block.title}</p>
            <p className="text-[10px] text-[#555] font-mono">{block.children?.length || 0} links inside</p>
          </div>
          <ChevronRight size={14} className="text-[#00ff88] flex-shrink-0" />
        </div>
      )

    case "vault": {
      const lockLabel = block.lockType === "password" ? "Password"
        : block.lockType === "payment" ? `Paid${(cfg.price as number) ? ` — $${((cfg.price as number) / 100).toFixed(2)}` : ""}`
        : "Email gated"
      return (
        <div className="px-4 py-3 flex items-center gap-3" style={{ minHeight: 80, backgroundColor: "rgba(255,200,0,0.06)" }}>
          <div className="w-9 h-9 rounded-full bg-amber-500/[0.08] border border-amber-500/[0.2] flex items-center justify-center flex-shrink-0">
            <Lock size={14} className="text-amber-400/80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{block.title}</p>
            <p className="text-[10px] text-amber-400/60 font-mono">{lockLabel}</p>
          </div>
        </div>
      )
    }

    case "drop": {
      const dropAt = (cfg.dropAt as string) || ""
      const diff = dropAt ? new Date(dropAt).getTime() - Date.now() : 0
      const status = diff <= -86400000 ? "ENDED" : diff <= 0 ? "LIVE" : "SCHEDULED"
      const showCountdown = dropAt && diff > 0
      const cd = showCountdown ? {
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      } : null
      return (
        <div className="px-4 py-3" style={{ backgroundColor: "rgba(0,255,136,0.06)", minHeight: 88 }}>
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
          {cd ? (
            <div className="flex items-center gap-1.5 mt-2">
              {([
                { v: cd.h, l: "H" },
                { v: cd.m, l: "M" },
                { v: cd.s, l: "S" },
              ] as const).map((u, i) => (
                <div key={i} className="flex items-baseline gap-0.5">
                  <span className="text-base font-mono font-bold text-[#00ff88] tabular-nums">{String(u.v).padStart(2, "0")}</span>
                  <span className="text-[9px] font-mono text-[#555]">{u.l}</span>
                </div>
              ))}
            </div>
          ) : (
            dropAt && <p className="text-[10px] text-[#555] font-mono mt-1">{new Date(dropAt).toLocaleDateString()}</p>
          )}
        </div>
      )
    }

    case "youtube": {
      const channelName = (cfg.channelId as string) || ""
      const ytMode = (cfg.mode as string) === "video" ? "video" : "channel"
      const ytVideoRaw = (cfg.videoUrl as string) || (cfg.videoId as string) || ""
      const ytVideoId = ytMode === "video" ? (ytVideoRaw.match(/[?&]v=([\w-]{11})/)?.[1]
        || ytVideoRaw.match(/youtu\.be\/([\w-]{11})/)?.[1]
        || (/^[\w-]{11}$/.test(ytVideoRaw.trim()) ? ytVideoRaw.trim() : "")) : ""
      const videoThumb = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/maxresdefault.jpg` : ""
      const displayThumb = block.thumbnail || videoThumb
      return (
        <div style={{ minHeight: 100, backgroundColor: "rgba(255,0,0,0.03)" }}>
          {displayThumb ? (
            <div className="h-[80px] overflow-hidden relative">
              <img src={displayThumb} alt="" className="w-full h-full object-cover" />
              <span className="absolute top-2 left-2 bg-black/70 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">YouTube</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-red-600/90 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="h-[80px] relative flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(255,0,0,0.18), rgba(180,0,0,0.06))" }}
            >
              <span className="absolute top-2 left-2 bg-black/70 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">YouTube</span>
              <div className="w-9 h-9 rounded-full bg-red-600/90 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
              {channelName && (
                <span className="absolute bottom-2 right-2 text-[9px] font-mono text-white/70 truncate max-w-[60%]">{channelName}</span>
              )}
            </div>
          )}
          <div className="px-3 py-2">
            <p className="text-xs text-white truncate">{block.title}</p>
          </div>
        </div>
      )
    }

    case "product":
      return (
        <div style={{ minHeight: 100, backgroundColor: "rgba(55,138,221,0.06)" }}>
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

    case "stats":
      return (
        <div className="px-4 py-4 flex flex-col items-center justify-center text-center" style={{ minHeight: 80 }}>
          <p className="text-2xl font-bold text-[#00ff88] font-mono leading-none">{(cfg.value as string) || "0"}</p>
          <p className="text-[9px] font-mono uppercase tracking-widest text-[#555] mt-1.5">{(cfg.label as string) || block.title}</p>
        </div>
      )

    case "social_link": {
      const platform = (cfg.platform as string) || block.title || "Social"
      return (
        <div className="flex flex-col items-center justify-center" style={{ height: 80 }}>
          <Share2 size={24} style={{ color }} />
          <p className="text-[10px] font-mono text-[#888] mt-1.5 capitalize">{platform}</p>
        </div>
      )
    }

    default:
      return (
        <div className="px-4 py-3 flex items-center gap-3" style={{ minHeight: 56 }}>
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

  // Quick type grid (Link | Collection / Vault | Drop)
  const quickTypes = [
    { id: "link", name: "Link", icon: LinkIcon },
    { id: "collection", name: "Collection", icon: Folder },
    { id: "vault", name: "Vault", icon: Lock },
    { id: "drop", name: "Drop", icon: Timer },
  ]

  return (
    <div className="max-h-[70vh] flex flex-col">
      <div className="p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={glass.input}>
          <Search size={14} className="text-[#555]" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Paste any link to add instantly..."
            className="flex-1 bg-transparent text-sm text-[#e0e0e0] font-mono outline-none placeholder:text-[#444]"
          />
          <button onClick={onClose} className="text-[#555] hover:text-[#888] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto p-2">
        {filtered ? (
          filtered.map((item, idx) => (
            <PickerItem key={`${item.id}-${idx}`} item={item} onSelect={() => onSelect(item.id)} />
          ))
        ) : (
          <>
            {/* Quick type grid */}
            <div className="grid grid-cols-2 gap-2 p-1 mb-2">
              {quickTypes.map((q) => (
                <button key={q.id} onClick={() => onSelect(q.id)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                  style={glass.card}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${TYPE_COLORS[q.id] || "#888"}12`, color: TYPE_COLORS[q.id] || "#888" }}>
                    <q.icon size={14} />
                  </div>
                  <span className="text-sm text-[#e0e0e0] font-mono">{q.name}</span>
                </button>
              ))}
            </div>

            {BLOCK_CATEGORIES.map((cat) => (
              <div key={cat.label} className="mb-2">
                <p className="text-[9px] font-mono uppercase tracking-widest text-[#444] px-2 py-1.5">{cat.label}</p>
                {cat.items.map((item, idx) => (
                  <PickerItem key={`${cat.label}-${item.id}-${idx}`} item={item} onSelect={() => onSelect(item.id)} />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function PickerItem({ item, onSelect }: { item: { id: string; name: string; icon: typeof LinkIcon; desc: string }; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 h-11 rounded-xl hover:bg-white/[0.04] transition-colors text-left group">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${TYPE_COLORS[item.id] || "#888"}12`, color: TYPE_COLORS[item.id] || "#888" }}>
        <item.icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#e0e0e0] leading-tight">{item.name}</p>
        <p className="text-[10px] text-[#555] font-mono truncate">{item.desc}</p>
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
      <div className="px-4 h-12 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
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

      {/* Title */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <input
          key={`${block.id}-title`}
          defaultValue={block.title}
          onBlur={(e) => onUpdate(block.id, { title: e.target.value })}
          placeholder="Card title..."
          className="w-full bg-transparent text-lg text-white outline-none placeholder:text-[#444]"
        />
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
        {editTab === "content" && <ContentTab key={block.id} block={block} onUpdate={onUpdate} />}
        {editTab === "style" && <StyleTab block={block} onUpdate={onUpdate} />}
        {editTab === "settings" && <SettingsTab block={block} onUpdate={onUpdate} onDelete={onDelete} />}
      </div>
    </>
  )
}

// ─── Content Tab ──────────────────────────────────────────────

interface FaqItemLocal {
  _id: string
  question: string
  answer: string
}

function FaqItemsEditor({
  block, onUpdate,
}: { block: Block; onUpdate: (id: string, data: Partial<Block>) => void }) {
  const cfg = (block.config || {}) as Record<string, unknown>

  // Seed from cfg.items, or legacy cfg.question/cfg.answer, or a single empty row
  const seed = (): FaqItemLocal[] => {
    const raw = cfg.items
    if (Array.isArray(raw) && raw.length > 0) {
      return (raw as Array<{ question?: string; answer?: string }>).map((it, i) => ({
        _id: `${block.id}-seed-${i}`,
        question: it.question || "",
        answer: it.answer || "",
      }))
    }
    if (cfg.question || cfg.answer) {
      return [{
        _id: `${block.id}-legacy`,
        question: (cfg.question as string) || "",
        answer: (cfg.answer as string) || "",
      }]
    }
    return [{ _id: `${block.id}-empty`, question: "", answer: "" }]
  }

  const [items, setItems] = useState<FaqItemLocal[]>(seed)

  // Resync when switching to a different block
  useEffect(() => { setItems(seed()) }, [block.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: FaqItemLocal[]) => {
    onUpdate(block.id, {
      config: {
        ...cfg,
        items: next
          .filter((i) => i.question.trim() || i.answer.trim())
          .map((i) => ({ question: i.question, answer: i.answer })),
      },
    })
  }

  const addItem = () => {
    const next = [
      ...items,
      { _id: `${block.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, question: "", answer: "" },
    ]
    setItems(next)
    // Don't commit empty rows — wait until user types
  }

  const removeItem = (id: string) => {
    const next = items.filter((i) => i._id !== id)
    // Always keep at least one editable row
    const safe = next.length > 0 ? next : [{ _id: `${block.id}-empty-${Date.now()}`, question: "", answer: "" }]
    setItems(safe)
    commit(safe)
  }

  const setField = (id: string, field: "question" | "answer", value: string) => {
    setItems((prev) => prev.map((i) => (i._id === id ? { ...i, [field]: value } : i)))
  }

  return (
    <FieldGroup label={`Questions · ${items.length}`}>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={item._id}
            className="rounded-xl p-3 space-y-2"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center justify-center text-[10px] font-mono font-semibold rounded-md w-5 h-5"
                style={{
                  background: "rgba(0,255,136,0.1)",
                  color: "#00ff88",
                  border: "0.5px solid rgba(0,255,136,0.2)",
                }}
              >
                {idx + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item._id)}
                  aria-label="Delete question"
                  className="text-[#555] hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-500/[0.08]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <GlassInput
              value={item.question}
              onChange={(e) => setField(item._id, "question", e.target.value)}
              onBlur={() => commit(items)}
              placeholder="Question"
            />
            <GlassTextarea
              value={item.answer}
              onChange={(e) => setField(item._id, "answer", e.target.value)}
              onBlur={() => commit(items)}
              placeholder="Answer"
              rows={3}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-mono px-3 py-2 rounded-xl transition-colors"
          style={{
            background: "rgba(0,255,136,0.04)",
            border: "0.5px dashed rgba(0,255,136,0.25)",
            color: "#00ff88",
          }}
        >
          <Plus className="w-3 h-3" />
          Add question
        </button>
      </div>
    </FieldGroup>
  )
}

function ContentTab({ block, onUpdate }: { block: Block; onUpdate: (id: string, data: Partial<Block>) => void }) {
  const cfg = block.config || {}

  const updateField = (field: string, value: unknown) => onUpdate(block.id, { [field]: value })
  const updateConfig = (key: string, value: unknown) => onUpdate(block.id, { config: { ...cfg, [key]: value } })

  const delivery = (cfg.delivery as string) || "link"
  const lock = block.lockType || "none"

  return (
    <>
      {/* Type-specific fields */}
      {(block.type === "link" || block.type === "social_link") && (
        <FieldGroup label="URL">
          <GlassInput defaultValue={block.url || ""} onBlur={(e) => updateField("url", e.target.value || null)}
            placeholder="https://" />
          {block.url && (() => {
            const meta = getURLMeta(block.url)
            return (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: `${meta.color}12`, color: meta.color }}>
                <span style={{ width: 12, height: 12 }} className="inline-flex">{meta.icon}</span>
                <span className="text-[10px] font-mono">{meta.label}</span>
              </div>
            )
          })()}
        </FieldGroup>
      )}

      {block.type === "link" && (
        <FieldGroup label="Layout">
          <div className="flex gap-2">
            {(["classic", "featured"] as const).map(layout => (
              <PillButton key={layout} active={block.layout === layout} onClick={() => updateField("layout", layout)}>{layout}</PillButton>
            ))}
          </div>
        </FieldGroup>
      )}

      {block.type === "link" && block.layout === "featured" && (
        <FieldGroup label="Thumbnail URL">
          <GlassInput defaultValue={block.thumbnail || ""} onBlur={(e) => updateField("thumbnail", e.target.value || null)} placeholder="https://..." />
        </FieldGroup>
      )}

      {block.type === "youtube" && (
        <>
          <FieldGroup label="Mode">
            <div className="flex gap-2">
              {([
                { id: "channel", label: "Latest video" },
                { id: "video", label: "Specific video" },
              ] as const).map(m => (
                <PillButton
                  key={m.id}
                  active={((cfg.mode as string) || "channel") === m.id}
                  onClick={() => updateConfig("mode", m.id)}
                >
                  {m.label}
                </PillButton>
              ))}
            </div>
          </FieldGroup>
          {((cfg.mode as string) || "channel") === "channel" ? (
            <FieldGroup label="Channel ID or @handle">
              <GlassInput defaultValue={(cfg.channelId as string) || ""} onBlur={(e) => updateConfig("channelId", e.target.value)} placeholder="UCxxxxx or @channel" />
            </FieldGroup>
          ) : (
            <FieldGroup label="YouTube video URL">
              <GlassInput defaultValue={(cfg.videoUrl as string) || (cfg.videoId as string) || ""} onBlur={(e) => updateConfig("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </FieldGroup>
          )}
        </>
      )}

      {block.type === "podcast" && (
        <FieldGroup label="RSS Feed URL">
          <GlassInput defaultValue={(cfg.rssUrl as string) || ""} onBlur={(e) => updateConfig("rssUrl", e.target.value)} placeholder="https://feeds..." />
        </FieldGroup>
      )}

      {block.type === "spotify" && (
        <FieldGroup label="Playlist URL">
          <GlassInput defaultValue={(cfg.playlistUrl as string) || ""} onBlur={(e) => updateConfig("playlistUrl", e.target.value)} placeholder="https://open.spotify.com/playlist/..." />
        </FieldGroup>
      )}

      {block.type === "twitch" && (
        <FieldGroup label="Twitch Username">
          <GlassInput defaultValue={(cfg.username as string) || ""} onBlur={(e) => updateConfig("username", e.target.value)} placeholder="username" />
        </FieldGroup>
      )}

      {block.type === "drop" && (
        <>
          <FieldGroup label="Drop date & time">
            <GlassInput type="datetime-local" defaultValue={(cfg.dropAt as string)?.slice(0, 16) || ""}
              onBlur={(e) => updateConfig("dropAt", e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </FieldGroup>
          <FieldGroup label="Limited spots">
            <GlassInput type="number" defaultValue={(cfg.limitedSpots as number) || ""}
              onBlur={(e) => updateConfig("limitedSpots", e.target.value ? Number(e.target.value) : null)} placeholder="Unlimited" />
          </FieldGroup>
          <FieldGroup label="After drop, reveal">
            <div className="flex gap-2 mb-2">
              {(["url", "text"] as const).map(r => (
                <PillButton key={r} active={(cfg.revealMode as string || "url") === r} onClick={() => updateConfig("revealMode", r)}>{r === "url" ? "URL" : "Text message"}</PillButton>
              ))}
            </div>
            {(cfg.revealMode as string || "url") === "url" ? (
              <GlassInput defaultValue={(cfg.revealUrl as string) || ""} onBlur={(e) => updateConfig("revealUrl", e.target.value)} placeholder="https://..." />
            ) : (
              <GlassInput defaultValue={(cfg.revealText as string) || ""} onBlur={(e) => updateConfig("revealText", e.target.value)} placeholder="Shown when drop ends" />
            )}
          </FieldGroup>
        </>
      )}

      {block.type === "product" && (
        <>
          <FieldGroup label="Price">
            <GlassInput type="number" defaultValue={(cfg.price as number) || ""} onBlur={(e) => updateConfig("price", e.target.value ? Number(e.target.value) : null)} placeholder="999 = $9.99" />
          </FieldGroup>
          <FieldGroup label="Description">
            <GlassTextarea defaultValue={block.description || ""} onBlur={(e) => updateField("description", e.target.value || null)} rows={2} />
          </FieldGroup>
          <FieldGroup label="Product image URL">
            <GlassInput defaultValue={block.thumbnail || ""} onBlur={(e) => updateField("thumbnail", e.target.value || null)} placeholder="https://..." />
          </FieldGroup>
        </>
      )}

      {block.type === "stats" && (
        <>
          <FieldGroup label="Number">
            <GlassInput defaultValue={(cfg.value as string) || ""} onBlur={(e) => updateConfig("value", e.target.value)} placeholder="87%" />
          </FieldGroup>
          <FieldGroup label="Label">
            <GlassInput defaultValue={(cfg.label as string) || ""} onBlur={(e) => updateConfig("label", e.target.value)} placeholder="WIN RATE" />
          </FieldGroup>
        </>
      )}

      {block.type === "social_link" && (
        <FieldGroup label="Platform">
          <GlassInput defaultValue={(cfg.platform as string) || ""} onBlur={(e) => updateConfig("platform", e.target.value)} placeholder="instagram, tiktok, x..." />
        </FieldGroup>
      )}

      {block.type === "text" && (
        <>
          <FieldGroup label="Style">
            <div className="flex gap-2">
              {(["heading", "paragraph"] as const).map(s => (
                <PillButton key={s} active={(cfg.style as string) === s} onClick={() => updateConfig("style", s)}>{s}</PillButton>
              ))}
            </div>
          </FieldGroup>
          {(cfg.style as string) !== "heading" && (
            <FieldGroup label="Content">
              <GlassTextarea defaultValue={(cfg.content as string) || ""} onBlur={(e) => updateConfig("content", e.target.value)} rows={3} />
            </FieldGroup>
          )}
        </>
      )}

      {block.type === "image" && (
        <FieldGroup label="Image URL">
          <GlassInput defaultValue={block.thumbnail || (cfg.imageUrl as string) || ""} onBlur={(e) => updateField("thumbnail", e.target.value || null)} placeholder="https://..." />
        </FieldGroup>
      )}

      {block.type === "discount_code" && (
        <>
          <FieldGroup label="Code">
            <GlassInput defaultValue={(cfg.code as string) || ""} onBlur={(e) => updateConfig("code", e.target.value)} placeholder="SAVE20" />
          </FieldGroup>
          <FieldGroup label="Description">
            <GlassInput defaultValue={(cfg.description as string) || ""} onBlur={(e) => updateConfig("description", e.target.value)} placeholder="20% off all products" />
          </FieldGroup>
        </>
      )}

      {block.type === "faq" && (
        <FaqItemsEditor block={block} onUpdate={onUpdate} />
      )}

      {/* ─── Lock section (universal) ─── */}
      <div className="border-t border-white/[0.06] pt-4">
        <FieldGroup label="Lock this card">
          <div className="grid grid-cols-4 gap-1.5">
            {([
              { id: "none", label: "None" },
              { id: "email", label: "Email" },
              { id: "password", label: "Password" },
              { id: "payment", label: "Purchase" },
            ] as const).map(opt => (
              <PillButton key={opt.id} active={lock === opt.id} small onClick={() => updateField("lockType", opt.id)}>{opt.label}</PillButton>
            ))}
          </div>
        </FieldGroup>

        {lock === "password" && (
          <FieldGroup label="Set passcode">
            <GlassInput defaultValue={block.lockValue || ""} onBlur={(e) => updateField("lockValue", e.target.value || null)} placeholder="Enter passcode" />
          </FieldGroup>
        )}

        {lock === "payment" && (
          <>
            <FieldGroup label="Price">
              <GlassInput type="number" defaultValue={(cfg.price as number) || ""} onBlur={(e) => updateConfig("price", e.target.value ? Number(e.target.value) : null)} placeholder="999 = $9.99" />
            </FieldGroup>
            <FieldGroup label="What they get">
              <GlassInput defaultValue={block.description || ""} onBlur={(e) => updateField("description", e.target.value || null)} placeholder="Description" />
            </FieldGroup>
          </>
        )}
      </div>

      {/* ─── Delivery section (when locked) ─── */}
      {lock !== "none" && (
        <div className="border-t border-white/[0.06] pt-4">
          <FieldGroup label="After unlock, show">
            <div className="flex gap-1.5">
              {([
                { id: "link", label: "Open link" },
                { id: "text", label: "Show text" },
                { id: "download", label: "Download" },
              ] as const).map(opt => (
                <PillButton key={opt.id} active={delivery === opt.id} small onClick={() => updateConfig("delivery", opt.id)}>{opt.label}</PillButton>
              ))}
            </div>
          </FieldGroup>

          {delivery === "link" && (
            <FieldGroup label="URL">
              <GlassInput defaultValue={block.url || ""} onBlur={(e) => updateField("url", e.target.value || null)} placeholder="https://..." />
            </FieldGroup>
          )}
          {delivery === "text" && (
            <FieldGroup label="Content to reveal">
              <GlassTextarea defaultValue={(cfg.content as string) || ""} onBlur={(e) => updateConfig("content", e.target.value)} rows={3} />
            </FieldGroup>
          )}
          {delivery === "download" && (
            <FieldGroup label="File URL">
              <GlassInput defaultValue={(cfg.downloadUrl as string) || ""} onBlur={(e) => updateConfig("downloadUrl", e.target.value)} placeholder="https://..." />
            </FieldGroup>
          )}
        </div>
      )}
    </>
  )
}

// ─── Style Tab ────────────────────────────────────────────────

function StyleTab({ block, onUpdate }: { block: Block; onUpdate: (id: string, data: Partial<Block>) => void }) {
  const cfg = block.config || {}
  const animation = (cfg.animation as string) || "none"
  const showPromo = !!cfg.promoCode || cfg.showPromo === true

  return (
    <>
      <FieldGroup label="Size">
        <div className="grid grid-cols-2 gap-2">
          <SizeOption active={block.size !== "half"} onClick={() => onUpdate(block.id, { size: "full" })} full />
          <SizeOption active={block.size === "half"} onClick={() => onUpdate(block.id, { size: "half" })} />
        </div>
      </FieldGroup>

      <FieldGroup label="Card style">
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "glass", label: "Glass" },
            { id: "3d", label: "Solid" },
            { id: "gradient", label: "Gradient" },
            { id: "glow", label: "Glow" },
            { id: "neon", label: "Neon" },
            { id: "outline", label: "Minimal" },
          ] as const).map(s => (
            <PillButton key={s.id} active={block.style === s.id} small onClick={() => onUpdate(block.id, { style: s.id })}>{s.label}</PillButton>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Animation">
        <div className="grid grid-cols-4 gap-1.5">
          {(["none", "pulse", "shimmer", "bounce"] as const).map(a => (
            <PillButton key={a} active={animation === a} small onClick={() => onUpdate(block.id, { config: { ...cfg, animation: a } })}>{a === "none" ? "None" : a}</PillButton>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Priority">
        <div className="grid grid-cols-2 gap-2">
          <PillButton active={block.priority !== "starred"} onClick={() => onUpdate(block.id, { priority: "none" })}>Normal</PillButton>
          <PillButton active={block.priority === "starred"} onClick={() => onUpdate(block.id, { priority: "starred" })}>
            <span className="inline-flex items-center gap-1.5"><Star size={11} /> Starred</span>
          </PillButton>
        </div>
      </FieldGroup>

      <FieldGroup label="Promo code">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#888] font-mono">Show promo code</span>
          <ToggleSwitch on={showPromo} onClick={() => onUpdate(block.id, { config: { ...cfg, showPromo: !showPromo, promoCode: !showPromo ? (cfg.promoCode || "") : "" } })} />
        </div>
        {showPromo && (
          <GlassInput defaultValue={(cfg.promoCode as string) || ""} onBlur={(e) => onUpdate(block.id, { config: { ...cfg, promoCode: e.target.value, showPromo: true } })} placeholder="SAVE20" />
        )}
      </FieldGroup>
    </>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────

function SettingsTab({ block, onUpdate, onDelete }: {
  block: Block; onUpdate: (id: string, data: Partial<Block>) => void; onDelete: (id: string) => void
}) {
  const hasSchedule = !!block.scheduleStart || !!block.scheduleEnd
  const [scheduleOn, setScheduleOn] = useState(hasSchedule)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-[#888] font-mono">Clicks</span>
          <span className="text-xs text-[#e0e0e0] font-mono">{block.clickCount} clicks</span>
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

      <div className="border-t border-white/[0.06] pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#888] font-mono">Schedule visibility</span>
          <ToggleSwitch on={scheduleOn} onClick={() => {
            const next = !scheduleOn
            setScheduleOn(next)
            if (!next) onUpdate(block.id, { scheduleStart: null, scheduleEnd: null })
          }} />
        </div>
        {scheduleOn && (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-mono text-[#555] mb-1 block">Start</label>
              <GlassInput type="datetime-local" defaultValue={block.scheduleStart?.slice(0, 16) || ""}
                onBlur={(e) => onUpdate(block.id, { scheduleStart: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#555] mb-1 block">End</label>
              <GlassInput type="datetime-local" defaultValue={block.scheduleEnd?.slice(0, 16) || ""}
                onBlur={(e) => onUpdate(block.id, { scheduleEnd: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] pt-4 mt-2">
        <button onClick={() => setConfirmDelete(true)}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs rounded-xl py-3 hover:bg-red-500/20 transition-colors">
          Delete card
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this card?"
        description="The card and any data attached to it will be permanently removed. This cannot be undone."
        confirmLabel="Delete card"
        onConfirm={() => { setConfirmDelete(false); onDelete(block.id) }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

// ─── Reusable form helpers ────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

function GlassInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={glass.input}
      className="w-full px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30"
    />
  )
}

function GlassTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={glass.input}
      className="w-full px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-[#00ff88]/30 resize-none"
    />
  )
}

function PillButton({ active, small, onClick, children }: {
  active: boolean; small?: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button onClick={onClick}
      className={`${small ? "py-2 text-[10px]" : "py-2.5 text-xs"} flex-1 rounded-xl font-mono transition-colors ${
        active
          ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]"
          : "bg-white/[0.03] border border-white/[0.07] text-[#888] hover:border-white/20"
      }`}>
      {children}
    </button>
  )
}

function SizeOption({ active, full, onClick }: { active: boolean; full?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-xl py-3 px-3 flex flex-col items-center gap-2 transition-colors ${
        active ? "bg-[#00ff88]/10 border border-[#00ff88]/30" : "bg-white/[0.03] border border-white/[0.07] hover:border-white/20"
      }`}>
      <div className="w-full flex justify-center">
        <div className={`h-2 rounded ${active ? "bg-[#00ff88]" : "bg-white/20"}`} style={{ width: full ? "80%" : "40%" }} />
      </div>
      <span className={`text-[10px] font-mono ${active ? "text-[#00ff88]" : "text-[#888]"}`}>{full ? "Full width" : "Half width"}</span>
    </button>
  )
}

// ─── Sidebar Item ─────────────────────────────────────────────

function SidebarItem({ href, icon: Icon, label, active, onClick }: {
  href: string; icon: typeof LayoutGrid; label: string; active: boolean; onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-mono transition-all ${
        active
          ? "bg-[#00ff88]/[0.08] text-[#00ff88] border border-[#00ff88]/[0.15]"
          : "text-[#444] hover:text-[#888] hover:bg-white/[0.03] border border-transparent"
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  )
}
