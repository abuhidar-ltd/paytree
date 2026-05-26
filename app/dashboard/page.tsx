"use client"

import { useEffect, useState } from "react"
import { useUser, SignOutButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { ObsidianCard, GlassBrick } from "@/components/ui/obsidian-card"
import { LiveStatusToggle } from "@/components/ui/live-status-pill"
import { StatsEditor } from "@/components/ui/bento-stat-card"
import { CryptoManager } from "@/components/ui/crypto-vault"
import { VaultManager } from "@/components/ui/vault-portal"
import { PortalBuilder } from "@/components/ui/deep-portal"
import { UpgradePrompt } from "@/components/ui/upgrade-prompt"
import { ModuleEditor } from "@/components/ui/module-editor"
import { ProductManager } from "@/components/ui/product-manager"
import { ColorSwatchSelector } from "@/components/ui/color-swatch-selector"
import { AccentColorProvider } from "@/contexts/accent-color-context"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  DndContext, closestCenter,
  KeyboardSensor, PointerSensor,
  useSensor, useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Search,
  Folder,
  Link as LucideLink,
  Lock,
  Timer,
  Youtube,
  ShoppingBag,
  Music,
  Mic,
  Radio,
  Share2,
  Bitcoin,
  BarChart2,
  ChevronRight,
  LayoutGrid,
  Image as ImageIcon,
  Star,
  Calendar,
  Trash2,
  X,
} from "lucide-react"

// Suppress "imported but never read" for components preserved for handler compatibility
void SignOutButton
void ObsidianCard
void GlassBrick
void CryptoManager
void VaultManager
void PortalBuilder
void UpgradePrompt
void ModuleEditor
void ProductManager

// ─── Types ─────────────────────────────────────────────────────────────────

interface DbLink {
  id: string
  title: string
  url: string
  enabled: boolean
  order: number
  icon?: string
  style?: string
  cardSize?: string
  isFolder: boolean
  isVaultItem?: boolean
  parentId: string | null
  _count?: { clicks: number }
}

interface SocialLink {
  id: string
  platform: string
  url: string
  enabled: boolean
  order: number
}

interface CryptoAddress {
  id: string
  currency: string
  address: string
  label?: string
  enabled: boolean
}

interface VaultItem {
  id: string
  title: string
  icon?: string
  url?: string
  downloadUrl?: string
  downloadName?: string
  vaultContent?: string
  isEmailLocked: boolean
  enabled: boolean
  _count?: { vaultUnlocks: number }
}

interface Profile {
  name: string | null
  username: string
  bio: string | null
  image: string | null
  subscriptionStatus?: string
  liveStatus: boolean
  liveMessage: string | null
  statsStudents: number
  statsWinRate: number
  statsFollowers: number
  statsLabel1: string | null
  statsLabel2: string | null
  statsLabel3: string | null
  accentColor: string | null
  aiAgentEnabled: boolean
  stripeAccountId?: string | null
}

interface BentoModule {
  id: string
  type: string
  title?: string
  enabled: boolean
  order: number
  span: number
  config: Record<string, unknown>
}

interface Product {
  id: string
  title: string
  description?: string
  price: number
  currency: string
  downloadUrl?: string
  downloadName?: string
  imageUrl?: string
  enabled: boolean
  totalRevenue?: number
  salesCount?: number
}

interface DbDrop {
  id: string
  title: string
  description?: string
  dropAt: string
  revealUrl?: string
  revealText?: string
  status: string
  limitedSpots?: number
  spotsLeft?: number
  enabled: boolean
}

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

// ─── DashboardPage ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // ── existing state ──
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<DbLink[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoAddress[]>([])
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([])
  const [modules, setModules] = useState<BentoModule[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [drops, setDrops] = useState<DbDrop[]>([])
  const [loading, setLoading] = useState(true)
  const [referralStats, setReferralStats] = useState<{
    referralCode: string | null
    referralLink: string | null
    totalReferrals: number
    convertedReferrals: number
    totalEarnings: string
  } | null>(null)
  const [saving, setSaving] = useState(false)

  // ── new blocks state ──
  const [blocks, setBlocks] = useState<Block[]>([])
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [showAddBlockPicker, setShowAddBlockPicker] = useState(false)
  const [editFields, setEditFields] = useState<Record<string, Record<string, string>>>({})
  const [previewPulse, setPreviewPulse] = useState(false)
  const [pasteBarValue, setPasteBarValue] = useState("")
  const [pasteDetecting, setPasteDetecting] = useState(false)

  // ── DnD sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex(b => b.id === active.id)
    const newIndex = blocks.findIndex(b => b.id === over.id)
    const reordered = arrayMove(blocks, oldIndex, newIndex)
    const updated = reordered.map((b, i) => ({ ...b, position: i }))
    setBlocks(updated)
    try {
      await fetch("/api/blocks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: updated.map(b => ({ id: b.id, position: b.position })) }),
      })
    } catch {
      toast.error("Failed to save order")
    }
  }

  // Legacy form state (kept so existing handlers compile)
  const [newLink, setNewLink] = useState({ title: "", url: "", icon: "💳" })
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [newSocialLink, setNewSocialLink] = useState({ platform: "instagram", url: "" })
  const [isAddingSocial, setIsAddingSocial] = useState(false)
  const [newDrop, setNewDrop] = useState({
    title: "",
    description: "",
    dropAt: "",
    revealUrl: "",
    revealText: "",
    limitedSpots: "",
  })
  const [isAddingDrop, setIsAddingDrop] = useState(false)
  void newLink; void setNewLink; void isAddingLink; void setIsAddingLink
  void newSocialLink; void setNewSocialLink; void isAddingSocial; void setIsAddingSocial
  void newDrop; void setNewDrop; void isAddingDrop; void setIsAddingDrop
  void saving

  const isPro =
    profile?.subscriptionStatus === "active" ||
    profile?.subscriptionStatus === "trial" ||
    profile?.subscriptionStatus === "canceling"

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((data) => { if (!data.error) setReferralStats(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (blocks.length === 0) return
    setPreviewPulse(true)
    const t = setTimeout(() => setPreviewPulse(false), 500)
    return () => clearTimeout(t)
  }, [blocks])

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login")
    } else if (isLoaded && user) {
      loadData()
    }
  }, [isLoaded, user, router])

  const loadData = async () => {
    try {
      const [profileRes, linksRes, socialRes, cryptoRes, vaultRes, modulesRes, productsRes, dropsRes, blocksRes] =
        await Promise.all([
          fetch("/api/profile"),
          fetch("/api/links"),
          fetch("/api/social-links"),
          fetch("/api/crypto-addresses"),
          fetch("/api/vault/items"),
          fetch("/api/modules"),
          fetch("/api/products"),
          fetch("/api/drops"),
          fetch("/api/blocks"),
        ])

      if (profileRes.ok) setProfile(await profileRes.json())
      if (linksRes.ok) setLinks(await linksRes.json())
      if (socialRes.ok) setSocialLinks(await socialRes.json())
      if (cryptoRes.ok) setCryptoAddresses(await cryptoRes.json())
      if (vaultRes.ok) setVaultItems(await vaultRes.json())
      if (modulesRes.ok) setModules(await modulesRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (dropsRes.ok) setDrops(await dropsRes.json())
      if (blocksRes.ok) setBlocks(await blocksRes.json())
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load dashboard data. Please refresh.")
    } finally {
      setLoading(false)
    }
  }

  // ── existing link handlers ──────────────────────────────────────────────

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLink),
      })
      if (res.ok) {
        const link = await res.json()
        setLinks([...links, link])
        setNewLink({ title: "", url: "", icon: "💳" })
        setIsAddingLink(false)
        toast.success("Link added!")
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to add link")
      }
    } catch {
      toast.error("Failed to add link")
    } finally {
      setSaving(false)
    }
  }
  void addLink

  const toggleLink = async (id: string, enabled: boolean) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, enabled } : l)))
    try {
      await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
    } catch {
      setLinks(links.map((l) => (l.id === id ? { ...l, enabled: !enabled } : l)))
      toast.error("Failed to update link. Please try again.")
    }
  }

  const deleteLink = async (id: string) => {
    if (!confirm("Delete this link?")) return
    const previousLinks = [...links]
    setLinks(links.filter((l) => l.id !== id))
    try {
      await fetch(`/api/links/${id}`, { method: "DELETE" })
    } catch {
      setLinks(previousLinks)
      toast.error("Failed to delete link. Please try again.")
    }
  }

  // ── drop handlers ────────────────────────────────────────────────────────

  const addDrop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDrop.title || !newDrop.dropAt) return
    setSaving(true)
    try {
      const limitedSpotsNum = newDrop.limitedSpots ? parseInt(newDrop.limitedSpots, 10) : undefined
      const payload = {
        title: newDrop.title,
        description: newDrop.description || undefined,
        dropAt: new Date(newDrop.dropAt).toISOString(),
        revealUrl: newDrop.revealUrl || undefined,
        revealText: newDrop.revealText || undefined,
        limitedSpots: Number.isFinite(limitedSpotsNum as number) ? limitedSpotsNum : undefined,
        spotsLeft: Number.isFinite(limitedSpotsNum as number) ? limitedSpotsNum : undefined,
      }
      const res = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const drop = await res.json()
        setDrops((prev) => [...prev, drop])
        setNewDrop({ title: "", description: "", dropAt: "", revealUrl: "", revealText: "", limitedSpots: "" })
        setIsAddingDrop(false)
        toast.success("Drop scheduled!")
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to add drop")
      }
    } catch {
      toast.error("Failed to add drop")
    } finally {
      setSaving(false)
    }
  }
  void addDrop

  const toggleDrop = async (id: string, enabled: boolean) => {
    const previous = drops
    setDrops((prev) => prev.map((d) => (d.id === id ? { ...d, enabled } : d)))
    try {
      const res = await fetch(`/api/drops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error("toggle failed")
    } catch {
      setDrops(previous)
      toast.error("Failed to update drop. Please try again.")
    }
  }
  void toggleDrop

  const deleteDrop = async (id: string) => {
    if (!confirm("Delete this drop?")) return
    const previous = drops
    setDrops((prev) => prev.filter((d) => d.id !== id))
    try {
      const res = await fetch(`/api/drops/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("delete failed")
    } catch {
      setDrops(previous)
      toast.error("Failed to delete drop. Please try again.")
    }
  }
  void deleteDrop

  // ── portal handlers ──────────────────────────────────────────────────────

  const createFolder = async (title: string, icon?: string) => {
    try {
      const res = await fetch("/api/links/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, icon }),
      })
      if (res.ok) {
        const folder = await res.json()
        setLinks([...links, folder])
        toast.success("Portal created!")
      }
    } catch {
      toast.error("Failed to create portal")
    }
  }
  void createFolder

  const createNestedLink = async (title: string, url: string, icon?: string, parentId?: string) => {
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url, icon, parentId }),
      })
      if (res.ok) {
        const link = await res.json()
        setLinks([...links, link])
        toast.success("Link added!")
      }
    } catch {
      toast.error("Failed to add link")
    }
  }
  void createNestedLink

  // ── live status handlers ──────────────────────────────────────────────────

  const toggleLiveStatus = async (isLive: boolean) => {
    try {
      await fetch("/api/live-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveStatus: isLive }),
      })
      setProfile((prev) => (prev ? { ...prev, liveStatus: isLive } : null))
    } catch {
      toast.error("Failed to update live status")
    }
  }

  const updateLiveMessage = async (message: string) => {
    try {
      await fetch("/api/live-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveMessage: message }),
      })
      setProfile((prev) => (prev ? { ...prev, liveMessage: message } : null))
    } catch {
      toast.error("Failed to update message")
    }
  }

  // ── AI agent handler ──────────────────────────────────────────────────────

  const toggleAiAgent = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiAgentEnabled: enabled }),
      })
      if (!res.ok) { toast.error("Failed to update AI Agent"); return }
      setProfile((prev) => (prev ? { ...prev, aiAgentEnabled: enabled } : null))
      toast.success(enabled ? "AI Agent enabled" : "AI Agent disabled")
    } catch {
      toast.error("Failed to update AI Agent")
    }
  }

  // ── stats handlers ────────────────────────────────────────────────────────

  const updateStats = async (stats: Partial<Profile>) => {
    try {
      await fetch("/api/stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats),
      })
      setProfile((prev) => (prev ? { ...prev, ...stats } : null))
    } catch {
      toast.error("Failed to update stats")
    }
  }

  // ── crypto handlers ───────────────────────────────────────────────────────

  const addCryptoAddress = async (currency: string, address: string, label?: string) => {
    try {
      const res = await fetch("/api/crypto-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, address, label }),
      })
      if (res.ok) {
        const addr = await res.json()
        setCryptoAddresses([...cryptoAddresses, addr])
        toast.success("Address added!")
      }
    } catch {
      toast.error("Failed to add address")
    }
  }
  void addCryptoAddress

  const removeCryptoAddress = async (id: string) => {
    try {
      await fetch(`/api/crypto-addresses/${id}`, { method: "DELETE" })
      setCryptoAddresses(cryptoAddresses.filter((a) => a.id !== id))
    } catch {
      toast.error("Failed to remove address")
    }
  }
  void removeCryptoAddress

  const toggleCryptoAddress = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/crypto-addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      setCryptoAddresses(cryptoAddresses.map((a) => (a.id === id ? { ...a, enabled } : a)))
    } catch {
      toast.error("Failed to toggle address")
    }
  }
  void toggleCryptoAddress

  // ── vault handlers ────────────────────────────────────────────────────────

  const createVaultItem = async (item: Partial<VaultItem>) => {
    try {
      const res = await fetch("/api/vault/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          icon: item.icon,
          url: item.url,
          downloadUrl: item.downloadUrl,
          downloadName: item.downloadName,
          vaultContent: item.vaultContent,
          isEmailLocked: true,
        }),
      })
      if (res.ok) {
        const newItem = await res.json()
        setVaultItems([...vaultItems, newItem])
        toast.success("Vault item created!")
      }
    } catch {
      toast.error("Failed to create vault item")
    }
  }
  void createVaultItem

  const deleteVaultItem = async (id: string) => {
    try {
      await fetch(`/api/vault/items/${id}`, { method: "DELETE" })
      setVaultItems(vaultItems.filter((v) => v.id !== id))
      toast.success("Vault item deleted")
    } catch {
      toast.error("Failed to delete vault item")
    }
  }
  void deleteVaultItem

  const toggleVaultLock = async (id: string, locked: boolean) => {
    try {
      await fetch(`/api/vault/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEmailLocked: locked }),
      })
      setVaultItems(vaultItems.map((v) => (v.id === id ? { ...v, isEmailLocked: locked } : v)))
    } catch {
      toast.error("Failed to update vault item")
    }
  }
  void toggleVaultLock

  // ── social handlers ───────────────────────────────────────────────────────

  const addSocialLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/social-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSocialLink),
      })
      if (res.ok) {
        const link = await res.json()
        setSocialLinks([...socialLinks, link])
        setNewSocialLink({ platform: "instagram", url: "" })
        setIsAddingSocial(false)
        toast.success("Social link added!")
      }
    } catch {
      toast.error("Failed to add social link")
    } finally {
      setSaving(false)
    }
  }
  void addSocialLink

  const deleteSocialLink = async (id: string) => {
    if (!confirm("Delete this social link?")) return
    const previous = [...socialLinks]
    setSocialLinks(socialLinks.filter((l) => l.id !== id))
    try {
      await fetch(`/api/social-links/${id}`, { method: "DELETE" })
    } catch {
      setSocialLinks(previous)
    }
  }
  void deleteSocialLink

  // ── module handlers ───────────────────────────────────────────────────────

  const toggleModule = async (id: string, enabled: boolean) => {
    const previous = modules
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, enabled } : m)))
    try {
      const res = await fetch(`/api/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setModules(previous)
      toast.error("Failed to toggle module")
    }
  }
  void toggleModule

  const deleteModule = async (id: string) => {
    if (!confirm("Delete this module?")) return
    const previous = modules
    setModules((prev) => prev.filter((m) => m.id !== id))
    try {
      await fetch(`/api/modules/${id}`, { method: "DELETE" })
    } catch {
      setModules(previous)
      toast.error("Failed to delete module")
    }
  }
  void deleteModule

  const setModuleSpan = async (id: string, span: number) => {
    const previous = modules
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, span } : m)))
    try {
      const res = await fetch(`/api/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ span }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setModules(previous)
      toast.error("Failed to update size")
    }
  }
  void setModuleSpan

  // ── product handlers ──────────────────────────────────────────────────────

  const toggleProduct = async (id: string, enabled: boolean) => {
    const previous = products
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setProducts(previous)
      toast.error("Failed to toggle product")
    }
  }
  void toggleProduct

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return
    const previous = products
    setProducts((prev) => prev.filter((p) => p.id !== id))
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" })
    } catch {
      setProducts(previous)
      toast.error("Failed to delete product")
    }
  }
  void deleteProduct

  // ── legacy save helpers (kept for compat) ─────────────────────────────────

  const getField = (blockId: string, key: string, fallback: string): string =>
    editFields[blockId]?.[key] ?? fallback
  const setField = (blockId: string, key: string, val: string) =>
    setEditFields((prev) => ({ ...prev, [blockId]: { ...(prev[blockId] || {}), [key]: val } }))
  const clearFields = (blockId: string) =>
    setEditFields((prev) => {
      const { [blockId]: _gone, ...rest } = prev
      void _gone
      return rest
    })
  void getField; void setField; void clearFields

  const handleCopyReferralLink = async () => {
    if (!referralStats?.referralLink) return
    try {
      await navigator.clipboard.writeText(referralStats.referralLink)
      toast.success("Link copied!")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  // ── blocks handlers ────────────────────────────────────────────────────────

  const toggleExpand = (id: string) =>
    setExpandedBlockId((curr) => (curr === id ? null : id))

  const handleBlockToggle = async (id: string, enabled: boolean) => {
    const previous = blocks
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, enabled } : b)))
    try {
      const res = await fetch(`/api/blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setBlocks(previous)
      toast.error("Failed to toggle block")
    }
  }

  const handleBlockUpdate = (id: string, data: Partial<Block>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)))
  }

  const handleBlockDelete = async (id: string) => {
    const previous = blocks
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    if (expandedBlockId === id) setExpandedBlockId(null)
    try {
      const res = await fetch(`/api/blocks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Deleted")
    } catch {
      setBlocks(previous)
      toast.error("Failed to delete block")
    }
  }

  const handleAddBlock = async (type: string) => {
    setShowAddBlockPicker(false)
    if (type === "live_status") { setExpandedBlockId("__live__"); return }
    if (type === "stats") { setExpandedBlockId("__stats__"); return }
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title: "Untitled" }),
      })
      if (!res.ok) throw new Error()
      const block = await res.json()
      setBlocks((prev) => [...prev, block])
      setExpandedBlockId(block.id)
      toast.success("Block added")
    } catch {
      toast.error("Failed to add block")
    }
  }

  const detectBlockFromUrl = (raw: string): { type: string; title: string; url: string; config?: Record<string, unknown> } => {
    const url = raw.trim()
    let hostname = ""
    try { hostname = new URL(url).hostname.replace(/^www\./, "") } catch { /* invalid URL */ }

    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      const u = new URL(url)
      let channelId = url
      const channelMatch = u.pathname.match(/\/channel\/(UC[\w-]+)/)
      const handleMatch = u.pathname.match(/\/@([\w.-]+)/)
      if (channelMatch) channelId = channelMatch[1]
      else if (handleMatch) channelId = `@${handleMatch[1]}`
      return { type: "youtube", title: "YouTube", url, config: { channelId } }
    }

    if (hostname.includes("spotify.com") && (url.includes("/show") || url.includes("/episode"))) {
      return { type: "podcast", title: "Podcast", url, config: { rssUrl: url } }
    }
    if (/\.(rss|xml)$/i.test(url) || /\/(feed|rss)/i.test(url) || hostname.includes("simplecast") || hostname.includes("anchor.fm")) {
      return { type: "podcast", title: "Podcast", url, config: { rssUrl: url } }
    }

    if (hostname.includes("spotify.com")) {
      return { type: "spotify", title: "Spotify", url, config: { playlistUrl: url } }
    }

    if (hostname.includes("twitch.tv")) {
      const parts = new URL(url).pathname.split("/").filter(Boolean)
      const username = parts[0] || ""
      return { type: "twitch", title: "Twitch", url, config: { username } }
    }

    if (hostname.includes("instagram.com")) {
      return { type: "social_link", title: "Instagram", url, config: { platform: "instagram" } }
    }
    if (hostname.includes("tiktok.com")) {
      return { type: "social_link", title: "TikTok", url, config: { platform: "tiktok" } }
    }
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      return { type: "social_link", title: "X", url, config: { platform: "x" } }
    }

    if (hostname.includes("discord.gg") || url.includes("discord.com/invite")) {
      return { type: "link", title: "Join my Discord", url }
    }

    const domainTitle = hostname.replace(/\.\w+$/, "").replace(/^www\./, "")
    const capitalized = domainTitle.charAt(0).toUpperCase() + domainTitle.slice(1)
    return { type: "link", title: capitalized || "Untitled", url }
  }

  const handlePasteUrl = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim()
    if (!pasted) return

    try { new URL(pasted) } catch {
      return
    }

    e.preventDefault()
    setPasteDetecting(true)
    setPasteBarValue(pasted)

    try {
      const detected = detectBlockFromUrl(pasted)
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detected),
      })
      if (!res.ok) throw new Error()
      const block = await res.json()
      setBlocks((prev) => [...prev, block])
      setExpandedBlockId(block.id)
      toast.success("Block added — edit the title")
    } catch {
      toast.error("Failed to add block")
    } finally {
      setPasteBarValue("")
      setPasteDetecting(false)
    }
  }

  // ── loading screen ─────────────────────────────────────────────────────────

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303]">
        <PremiumBackground />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#888888]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <AccentColorProvider initialColor={profile?.accentColor || "#00ff88"}>
      <div className="min-h-screen bg-[#030303] text-white relative">
        <PremiumBackground />

        <div className="relative z-10 flex min-h-screen">

          {/* ── LEFT: blocks panel ─────────────────────────────── */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6">

            {/* Free plan upgrade banner */}
            {(!profile?.subscriptionStatus || profile?.subscriptionStatus === "free") && (
              <div className="bg-gradient-to-r from-[#00ff88]/[0.08] to-transparent border border-[#00ff88]/[0.15] rounded-xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-[#e0e0e0]">🚀 Your page is ready to share</p>
                  <p className="text-xs text-[#888] mt-0.5">Upgrade to Starter to publish it — $7/mo</p>
                </div>
                <Link href="/pricing" className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-2 text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
                  Publish my page →
                </Link>
              </div>
            )}

            {/* Stripe connect prompt */}
            {!profile?.stripeAccountId &&
              (!profile?.subscriptionStatus || profile?.subscriptionStatus === "free" || profile?.subscriptionStatus === "starter") && (
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-[#e0e0e0]">💳 Start selling on your page</p>
                  <p className="text-xs text-[#888] mt-0.5">Connect Stripe to accept payments from visitors</p>
                </div>
                <Link href="/settings" className="bg-white/[0.05] border border-white/[0.1] text-[#e0e0e0] font-mono rounded-xl px-4 py-2 text-sm hover:border-white/20 transition-colors whitespace-nowrap">
                  Connect Stripe →
                </Link>
              </div>
            )}

            {/* Search / paste bar */}
            <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3.5 flex items-center gap-2 mb-4 hover:border-white/[0.14] focus-within:border-[#00ff88]/[0.3] focus-within:ring-1 focus-within:ring-[#00ff88]/[0.1] transition-colors">
              <Search size={16} className="text-[#333] flex-shrink-0" />
              <input
                value={pasteBarValue}
                onChange={(e) => setPasteBarValue(e.target.value)}
                onPaste={handlePasteUrl}
                onFocus={() => setShowAddBlockPicker(true)}
                placeholder={pasteDetecting ? "Detecting..." : "Paste any link to add it instantly..."}
                className="flex-1 bg-transparent text-[13px] font-mono text-[#888] placeholder:text-[#333] outline-none"
              />
            </div>

            {/* Style panel toggle */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-white/30">Your Page</span>
              <button
                onClick={() => setShowStylePanel((s) => !s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                  showStylePanel
                    ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                    : "bg-white/[0.03] border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"
                }`}
              >
                Style
              </button>
            </div>

            <AnimatePresence>
              {showStylePanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 mb-2">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-4">Accent Color</h3>
                    <ColorSwatchSelector showLabels />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Singletons ─────────────────────────────────── */}
            <div className="space-y-1.5 mb-4">

              {profile && (
                <BlockRow
                  id="__live__"
                  icon="📡"
                  label="Live Status"
                  badge="Live"
                  enabled={profile.liveStatus}
                  expanded={expandedBlockId === "__live__"}
                  onToggle={() => toggleExpand("__live__")}
                  onEnableToggle={(v) => toggleLiveStatus(v)}
                >
                  <LiveStatusToggle
                    isLive={profile.liveStatus}
                    message={profile.liveMessage || ""}
                    onToggle={toggleLiveStatus}
                    onMessageChange={updateLiveMessage}
                  />
                </BlockRow>
              )}

              {profile && (
                <BlockRow
                  id="__stats__"
                  icon="📊"
                  label="Stats"
                  badge="Stats"
                  expanded={expandedBlockId === "__stats__"}
                  onToggle={() => toggleExpand("__stats__")}
                >
                  <StatsEditor
                    students={profile.statsStudents}
                    winRate={profile.statsWinRate}
                    followers={profile.statsFollowers}
                    labels={{
                      students: profile.statsLabel1 || "Students",
                      winRate: profile.statsLabel2 || "Win Rate",
                      followers: profile.statsLabel3 || "Followers",
                    }}
                    onUpdate={(stats) => {
                      if (stats.labels) {
                        updateStats({
                          ...stats,
                          statsLabel1: stats.labels.students,
                          statsLabel2: stats.labels.winRate,
                          statsLabel3: stats.labels.followers,
                        })
                      } else {
                        updateStats(stats as Partial<Profile>)
                      }
                    }}
                  />
                </BlockRow>
              )}

              {profile && (
                <BlockRow
                  id="__aiagent__"
                  icon="✦"
                  label="AI Agent"
                  badge="AI"
                  enabled={profile.aiAgentEnabled}
                  expanded={expandedBlockId === "__aiagent__"}
                  onToggle={() => toggleExpand("__aiagent__")}
                  onEnableToggle={(v) => toggleAiAgent(v)}
                >
                  <div className="px-4 pb-4 pt-1 space-y-3">
                    {isPro ? (
                      <>
                        <p className="text-xs font-mono text-[#888]">
                          Your AI agent answers visitor questions and guides them to your products 24/7.
                        </p>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border ${
                            profile.aiAgentEnabled
                              ? "bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]"
                              : "bg-white/[0.03] border-white/[0.08] text-[#444]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              profile.aiAgentEnabled ? "bg-[#00ff88] animate-pulse" : "bg-[#444]"
                            }`}
                          />
                          {profile.aiAgentEnabled ? "Active on your page" : "Hidden from visitors"}
                        </span>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-mono text-[#888]">
                          Your AI agent answers visitor questions and guides them to your products 24/7.
                        </p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88]">
                          Pro feature — upgrade to activate
                        </span>
                      </div>
                    )}
                  </div>
                </BlockRow>
              )}

              {referralStats && (
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">💸</span>
                    <span className="text-sm font-mono text-[#e0e0e0] font-semibold">Earn</span>
                    <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88]">
                      Referrals
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#888] mb-3">
                    Refer creators, earn 20% of their first payment.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      readOnly
                      value={referralStats.referralLink ?? "Complete onboarding to get your link"}
                      className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#888] outline-none truncate"
                    />
                    <button
                      onClick={handleCopyReferralLink}
                      disabled={!referralStats.referralLink}
                      className="bg-[#00ff88] text-black font-mono font-semibold rounded-lg px-3 py-2 text-xs hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-white">{referralStats.totalReferrals}</div>
                      <div className="text-[10px] font-mono text-[#444] uppercase tracking-wider">Referrals</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-white">{referralStats.convertedReferrals}</div>
                      <div className="text-[10px] font-mono text-[#444] uppercase tracking-wider">Converted</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-[#00ff88]">${referralStats.totalEarnings}</div>
                      <div className="text-[10px] font-mono text-[#444] uppercase tracking-wider">Earned</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Blocks list ────────────────────────────────── */}
            {blocks.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={blocks.filter(b => !b.parentId).sort((a, b) => a.position - b.position).map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 mb-3">
                    <AnimatePresence initial={false}>
                      {blocks
                        .filter((b) => !b.parentId)
                        .sort((a, b) => a.position - b.position)
                        .map((block) => (
                          <SortableBlockCard
                            key={block.id}
                            block={block}
                            expanded={expandedBlockId === block.id}
                            onExpand={(id) => setExpandedBlockId((curr) => (curr === id ? null : id))}
                            onToggle={handleBlockToggle}
                            onUpdate={handleBlockUpdate}
                            onDelete={handleBlockDelete}
                          />
                        ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* ── Add block button ───────────────────────────── */}
            <button
              onClick={() => setShowAddBlockPicker((s) => !s)}
              className="w-full border border-dashed border-white/[0.08] rounded-xl p-4 flex items-center justify-center gap-2 text-[#333] text-sm font-mono hover:border-[#00ff88]/[0.2] hover:text-[#00ff88] transition-all"
            >
              + Add block
            </button>

            {/* Inline AddBlockPicker */}
            <AnimatePresence>
              {showAddBlockPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="mt-2"
                >
                  <AddBlockPicker
                    onClose={() => setShowAddBlockPicker(false)}
                    onSelect={handleAddBlock}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* ── RIGHT: phone preview ──────────────────────────── */}
          <div className="hidden lg:flex flex-col w-60 flex-shrink-0 sticky top-0 h-screen p-3 border-l border-white/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/30">Preview</span>
              {profile?.username && (
                <Link
                  href={`/${profile.username}`}
                  target="_blank"
                  className="text-[11px] font-mono text-[#00ff88] hover:underline"
                >
                  Open →
                </Link>
              )}
            </div>

            {/* Phone frame */}
            <div className={`mx-auto w-[190px] flex-1 max-h-[460px] bg-[#030303] rounded-[28px] border-[5px] border-[#1a1a1a] overflow-hidden transition-shadow duration-500 ${
              previewPulse
                ? "shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_2px_rgba(0,255,136,0.3)]"
                : "shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,255,136,0.08)]"
            }`}>
              <div
                className="h-full overflow-y-auto p-4 pt-6"
                style={{ scrollbarWidth: "none" }}
              >
                {/* Profile */}
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/[0.05] mx-auto mb-2 overflow-hidden border border-[rgba(0,255,136,0.3)]">
                    {profile?.image ? (
                      <img src={profile.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-[#00ff88] to-[#1a0b2e]">
                        {profile?.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-[11px] text-white leading-tight">
                    {profile?.name || profile?.username}
                  </div>
                  {profile?.bio && (
                    <div className="text-[9px] text-[#888] mt-0.5 line-clamp-2">{profile.bio}</div>
                  )}
                  {profile?.liveStatus && (
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.2)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                      <span className="text-[8px] font-bold text-white uppercase">
                        {profile.liveMessage || "Live"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Blocks preview */}
                <div className="space-y-1.5">
                  {blocks
                    .filter((b) => b.enabled && !b.parentId)
                    .slice(0, 5)
                    .map((block) => (
                      <div
                        key={block.id}
                        className={`p-2 rounded-xl border ${
                          block.type === "vault" ? "bg-yellow-500/[0.08] border-yellow-500/[0.15]" :
                          block.type === "drop" ? "bg-[#00ff88]/[0.05] border-[#00ff88]/[0.12]" :
                          block.type === "youtube" ? "bg-red-500/[0.06] border-red-500/[0.12]" :
                          block.type === "product" ? "bg-blue-500/[0.06] border-blue-500/[0.12]" :
                          block.type === "spotify" ? "bg-green-500/[0.06] border-green-500/[0.12]" :
                          block.type === "crypto" ? "bg-orange-500/[0.06] border-orange-500/[0.12]" :
                          "bg-white/[0.02] border-white/[0.07]"
                        }`}
                      >
                        <div className="text-[10px] text-white truncate font-medium">{block.title}</div>
                        {block.url && (
                          <div className="text-[9px] text-[#555] truncate mt-0.5">{block.url}</div>
                        )}
                      </div>
                    ))}
                  {blocks.length === 0 && (
                    <div className="text-[9px] text-[#333] font-mono text-center pt-4">
                      No blocks yet
                    </div>
                  )}
                </div>

                <div className="text-center mt-6">
                  <div className="text-[8px] text-[#333]">Powered by PayTree</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AccentColorProvider>
  )
}

// ─── Helper functions ────────────────────────────────────────────────────────

function moduleIcon(type: string): string {
  const map: Record<string, string> = {
    youtube: "📺", youtube_live: "🔴", tiktok: "🎬", podcast: "🎙️",
    spotify: "🎵", apple_music: "🎶", twitch: "🎮", image: "🖼️",
    rss: "📰", social_hub: "🔗", quick_tip: "💸", video: "🎥",
  }
  return map[type] || "🧩"
}
void moduleIcon

function moduleLabel(type: string): string {
  const map: Record<string, string> = {
    youtube: "YouTube", youtube_live: "YouTube Live", tiktok: "TikTok",
    podcast: "Podcast", spotify: "Spotify", apple_music: "Apple Music",
    twitch: "Twitch", image: "Image", rss: "RSS", social_hub: "Social Hub",
    quick_tip: "Quick Tip", video: "Video",
  }
  return map[type] || type.charAt(0).toUpperCase() + type.slice(1)
}
void moduleLabel

// ─── BlockRow (singletons) ────────────────────────────────────────────────────

interface BlockRowProps {
  id: string
  icon: string
  label: string
  badge: string
  enabled?: boolean
  expanded: boolean
  onToggle: () => void
  onEnableToggle?: (v: boolean) => void
  children: React.ReactNode
}

function BlockRow({ icon, label, badge, enabled, expanded, onToggle, onEnableToggle, children }: BlockRowProps) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
      <div
        className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-white/[0.01] transition-colors"
        onClick={onToggle}
      >
        <span className="text-[#222] text-sm cursor-grab select-none flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          ⠿
        </span>
        <span className="text-lg w-7 flex-shrink-0 text-center">{icon}</span>
        <span className="flex-1 text-sm text-[#d8d8d8] font-medium truncate">{label}</span>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-[#444]">{badge}</span>
        {onEnableToggle !== undefined && enabled !== undefined && (
          <button
            onClick={(e) => { e.stopPropagation(); onEnableToggle(!enabled) }}
            className={`w-8 h-[18px] rounded-full transition-all relative flex-shrink-0 ${
              enabled ? "bg-[rgba(0,255,136,0.2)]" : "bg-white/10"
            }`}
          >
            <motion.div
              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full ${enabled ? "bg-[#00ff88]" : "bg-white/50"}`}
              animate={{ left: enabled ? "calc(100% - 16px)" : "2px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        )}
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronRight size={14} className="text-[#444]" />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="overflow-hidden border-t border-white/[0.05]"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── BlockTypeIcon ────────────────────────────────────────────────────────────

function BlockTypeIcon({ type }: { type: string }) {
  const p = { size: 14, strokeWidth: 2 }
  switch (type) {
    case "link":
      return <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center"><LucideLink {...p} className="text-[#888]" /></div>
    case "collection":
      return <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center"><Folder {...p} className="text-[#888]" /></div>
    case "vault":
      return <div className="w-7 h-7 rounded-lg bg-yellow-500/[0.08] flex items-center justify-center"><Lock {...p} className="text-yellow-400" /></div>
    case "drop":
      return <div className="w-7 h-7 rounded-lg bg-[#00ff88]/[0.08] flex items-center justify-center"><Timer {...p} className="text-[#00ff88]" /></div>
    case "youtube":
      return <div className="w-7 h-7 rounded-lg bg-red-500/[0.08] flex items-center justify-center"><Youtube {...p} className="text-red-400" /></div>
    case "product":
      return <div className="w-7 h-7 rounded-lg bg-blue-500/[0.08] flex items-center justify-center"><ShoppingBag {...p} className="text-blue-400" /></div>
    case "spotify":
      return <div className="w-7 h-7 rounded-lg bg-green-500/[0.08] flex items-center justify-center"><Music {...p} className="text-green-400" /></div>
    case "podcast":
      return <div className="w-7 h-7 rounded-lg bg-orange-500/[0.08] flex items-center justify-center"><Mic {...p} className="text-orange-400" /></div>
    case "twitch":
      return <div className="w-7 h-7 rounded-lg bg-purple-500/[0.08] flex items-center justify-center"><Radio {...p} className="text-purple-400" /></div>
    case "social_link":
      return <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center"><Share2 {...p} className="text-[#888]" /></div>
    case "crypto":
      return <div className="w-7 h-7 rounded-lg bg-orange-500/[0.08] flex items-center justify-center"><Bitcoin {...p} className="text-orange-400" /></div>
    case "stats":
      return <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center"><BarChart2 {...p} className="text-[#888]" /></div>
    case "live_status":
      return <div className="w-7 h-7 rounded-lg bg-red-500/[0.08] flex items-center justify-center"><Radio {...p} className="text-red-400" /></div>
    default:
      return <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center"><LucideLink {...p} className="text-[#888]" /></div>
  }
}

function blockSubtitle(block: Block): string {
  const cfg = (block.config as Record<string, unknown> | null) ?? {}
  switch (block.type) {
    case "link": return block.url || "No URL set"
    case "vault": return "email gated"
    case "drop": return "countdown drop"
    case "youtube": return (cfg.channelId as string) || "No channel set"
    case "product": return cfg.price != null ? `$${(Number(cfg.price) / 100).toFixed(2)}` : "Free"
    case "collection": return `${block.children?.length ?? 0} items`
    default: return block.type
  }
}

// ─── BlockCard ────────────────────────────────────────────────────────────────

interface BlockCardProps {
  block: Block
  expanded: boolean
  onExpand: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onUpdate: (id: string, data: Partial<Block>) => void
  onDelete: (id: string) => void
  dragHandleProps?: Record<string, unknown>
}

function SortableBlockCard(props: BlockCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.block.id })
  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div ref={setNodeRef} style={dndStyle}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isDragging ? 0.5 : 1, y: 0, scale: isDragging ? 0.98 : 1 }}
        exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        style={{ zIndex: isDragging ? 10 : undefined, position: isDragging ? "relative" : undefined }}
      >
        <BlockCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
      </motion.div>
    </div>
  )
}

function BlockCard({ block, expanded, onExpand, onToggle, onUpdate, onDelete, dragHandleProps }: BlockCardProps) {
  const cfg = (block.config as Record<string, unknown> | null) ?? {}

  const [fields, setFields] = useState<Record<string, string>>({})
  const [activeSheet, setActiveSheet] = useState<string | null>(null)

  // Sync fields when block changes or opens
  useEffect(() => {
    setFields({
      title: block.title,
      url: block.url || "",
      content: (cfg.content as string) || "",
      downloadUrl: (cfg.downloadUrl as string) || "",
      dropAt: cfg.dropAt ? (() => { try { return new Date(cfg.dropAt as string).toISOString().slice(0, 16) } catch { return "" } })() : "",
      limitedSpots: cfg.limitedSpots != null ? String(cfg.limitedSpots) : "",
      channelId: (cfg.channelId as string) || "",
      rssUrl: (cfg.rssUrl as string) || "",
      priceDollars: cfg.price != null ? (Number(cfg.price) / 100).toFixed(2) : "",
      description: (cfg.description as string) || "",
      platform: (cfg.platform as string) || "instagram",
      currency: (cfg.currency as string) || "BTC",
      address: (cfg.address as string) || "",
    })
  }, [block.id])

  useEffect(() => {
    if (!expanded) setActiveSheet(null)
  }, [expanded])

  const set = (key: string, val: string) => setFields((prev) => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    const body: Record<string, unknown> = { title: fields.title }
    switch (block.type) {
      case "link":
        body.url = fields.url
        break
      case "vault":
        body.config = { ...block.config, content: fields.content, downloadUrl: fields.downloadUrl }
        break
      case "drop":
        body.config = {
          ...block.config,
          dropAt: fields.dropAt ? new Date(fields.dropAt).toISOString() : null,
          limitedSpots: fields.limitedSpots ? Number(fields.limitedSpots) : null,
        }
        break
      case "youtube":
      case "spotify":
      case "twitch":
      case "podcast":
        body.config = { ...block.config, channelId: fields.channelId, rssUrl: fields.rssUrl }
        break
      case "product":
        body.config = {
          ...block.config,
          price: Math.round(parseFloat(fields.priceDollars || "0") * 100),
          description: fields.description,
        }
        break
      case "social_link":
        body.url = fields.url
        body.config = { ...block.config, platform: fields.platform }
        break
      case "crypto":
        body.config = { ...block.config, currency: fields.currency, address: fields.address }
        break
    }
    try {
      const res = await fetch(`/api/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onUpdate(block.id, updated)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  const patchSheet = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onUpdate(block.id, updated)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  const actionBtn = (
    icon: React.ReactNode,
    label: string,
    sheet: string,
  ) => (
    <button
      key={sheet}
      onClick={(e) => { e.stopPropagation(); setActiveSheet((s) => (s === sheet ? null : sheet)) }}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
        activeSheet === sheet
          ? "bg-white/[0.06] border border-white/[0.12] text-[#888]"
          : "text-[#444] hover:bg-white/[0.04] hover:border hover:border-white/[0.08] hover:text-[#888]"
      }`}
    >
      {icon}
      {label}
    </button>
  )

  const ip = { size: 11, strokeWidth: 2 }

  return (
    <div className={`bg-white/[0.03] border rounded-xl overflow-hidden transition-colors duration-200 ${
      expanded ? "border-[#00ff88]/[0.15]" : "border-white/[0.07]"
    }`}>
      {/* Top row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => onExpand(block.id)}
      >
        <span
          {...(dragHandleProps || {})}
          onClick={(e) => e.stopPropagation()}
          className="text-[#222] text-sm cursor-grab active:cursor-grabbing select-none flex-shrink-0 hover:text-[#444] transition-colors"
        >⠿</span>

        <div className="hover:brightness-125 transition-all flex-shrink-0">
          <BlockTypeIcon type={block.type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[#d8d8d8] font-medium truncate">{block.title}</div>
          <div className="text-[11px] font-mono text-[#444] truncate">{blockSubtitle(block)}</div>
        </div>

        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-[#444] flex-shrink-0 hover:bg-white/[0.07] hover:text-[#666] transition-all">
          {block.type}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onToggle(block.id, !block.enabled) }}
          className={`w-8 h-[18px] rounded-full transition-all relative flex-shrink-0 ${
            block.enabled ? "bg-[rgba(0,255,136,0.2)]" : "bg-white/10"
          }`}
        >
          <motion.div
            className={`absolute top-0.5 w-3.5 h-3.5 rounded-full ${block.enabled ? "bg-[#00ff88]" : "bg-white/50"}`}
            animate={{ left: block.enabled ? "calc(100% - 16px)" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>

        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronRight size={14} className="text-[#444]" />
        </motion.div>
      </div>

      {/* Expanded */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {/* Action row */}
            <div className="flex items-center gap-1 px-2 py-2 border-t border-white/[0.04] flex-wrap">
              {actionBtn(<LayoutGrid {...ip} />, "Layout", "layout")}
              {actionBtn(<ImageIcon {...ip} />, "Thumbnail", "image")}
              {actionBtn(<Star {...ip} />, "Prioritize", "priority")}
              {actionBtn(<Calendar {...ip} />, "Schedule", "schedule")}
              {actionBtn(<Lock {...ip} />, "Lock", "lock")}
              <span className="ml-auto text-[11px] font-mono text-[#333]">
                {block.clickCount} clicks
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(block.id) }}
                className="ml-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-red-500/60 hover:bg-red-500/[0.06] hover:text-red-400 hover:scale-110 transition-all"
              >
                <Trash2 {...ip} />
              </button>
            </div>

            {/* Edit fields */}
            <div className="p-4 bg-black/[0.2] border-t border-white/[0.05] space-y-3">
              {/* Title — always shown */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Title</div>
                <input
                  value={fields.title || ""}
                  onChange={(e) => set("title", e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                />
              </div>

              {/* Type-specific fields */}
              {block.type === "link" && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">URL</div>
                  <input
                    value={fields.url || ""}
                    onChange={(e) => set("url", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                    placeholder="https://..."
                  />
                </div>
              )}

              {block.type === "vault" && (
                <>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Content (shown after unlock)</div>
                    <textarea
                      value={fields.content || ""}
                      onChange={(e) => set("content", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none min-h-[60px] resize-none"
                      placeholder="Hidden content..."
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Download URL</div>
                    <input
                      value={fields.downloadUrl || ""}
                      onChange={(e) => set("downloadUrl", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              {block.type === "drop" && (
                <>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Drop date & time</div>
                    <input
                      type="datetime-local"
                      value={fields.dropAt || ""}
                      onChange={(e) => set("dropAt", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Limited spots</div>
                    <input
                      type="number"
                      min="1"
                      value={fields.limitedSpots || ""}
                      onChange={(e) => set("limitedSpots", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                      placeholder="Unlimited"
                    />
                  </div>
                </>
              )}

              {(block.type === "youtube" || block.type === "twitch") && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Channel ID</div>
                  <input
                    value={fields.channelId || ""}
                    onChange={(e) => set("channelId", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                    placeholder="UCxxxxxxxxxxxxxx"
                  />
                </div>
              )}

              {(block.type === "spotify" || block.type === "podcast") && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">
                    {block.type === "podcast" ? "RSS URL" : "Spotify URL"}
                  </div>
                  <input
                    value={fields.rssUrl || ""}
                    onChange={(e) => set("rssUrl", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                    placeholder="https://..."
                  />
                </div>
              )}

              {block.type === "product" && (
                <>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Price (USD)</div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={fields.priceDollars || ""}
                      onChange={(e) => set("priceDollars", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Description</div>
                    <textarea
                      value={fields.description || ""}
                      onChange={(e) => set("description", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none min-h-[60px] resize-none"
                    />
                  </div>
                </>
              )}

              {block.type === "social_link" && (
                <>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Platform</div>
                    <select
                      value={fields.platform || "instagram"}
                      onChange={(e) => set("platform", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                    >
                      {["instagram","twitter","tiktok","youtube","github","linkedin","discord","facebook","reddit","snapchat","threads"].map((p) => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">URL</div>
                    <input
                      value={fields.url || ""}
                      onChange={(e) => set("url", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              {block.type === "crypto" && (
                <>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Currency</div>
                    <select
                      value={fields.currency || "BTC"}
                      onChange={(e) => set("currency", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                    >
                      {["BTC","ETH","SOL","USDT","USDC"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1">Address</div>
                    <input
                      value={fields.address || ""}
                      onChange={(e) => set("address", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                      placeholder="Wallet address"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleSave}
                className="bg-[#00ff88] text-black font-mono font-semibold rounded-lg px-3 py-1.5 text-xs hover:opacity-90 active:scale-95 transition-all"
              >
                Save
              </button>
            </div>

            {/* Sheets */}
            <AnimatePresence>
              {activeSheet && (
                <motion.div
                  key={activeSheet}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden border-t border-white/[0.04] bg-black/[0.25] p-3"
                >
                  {activeSheet === "layout" && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-2">Layout</div>
                      <div className="grid grid-cols-2 gap-2">
                        {(["classic", "featured"] as const).map((l) => (
                          <button
                            key={l}
                            onClick={() => patchSheet({ layout: l })}
                            className={`p-2.5 rounded-lg border text-[11px] font-mono transition-all ${
                              block.layout === l
                                ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                                : "bg-white/[0.02] border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"
                            }`}
                          >
                            {l.charAt(0).toUpperCase() + l.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSheet === "image" && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-2">Thumbnail URL</div>
                      <div className="flex gap-2">
                        <input
                          defaultValue={block.thumbnail || ""}
                          id={`thumb-${block.id}`}
                          className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                          placeholder="https://..."
                        />
                        <button
                          onClick={() => {
                            const el = document.getElementById(`thumb-${block.id}`) as HTMLInputElement
                            patchSheet({ thumbnail: el?.value || null })
                          }}
                          className="bg-[#00ff88] text-black font-mono font-semibold rounded-lg px-3 py-1.5 text-xs hover:opacity-90"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {activeSheet === "priority" && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-2">Priority</div>
                      <div className="space-y-1.5">
                        {[
                          { v: "none", label: "None", desc: "Standard position" },
                          { v: "animate", label: "Animate", desc: "Pulsing glow border" },
                          { v: "auto_expand", label: "Auto-expand", desc: "Opens when profile loads" },
                          { v: "redirect", label: "Redirect", desc: "Jump straight to URL" },
                        ].map(({ v, label, desc }) => (
                          <button
                            key={v}
                            onClick={() => patchSheet({ priority: v })}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${
                              block.priority === v
                                ? "bg-[#00ff88]/10 border-[#00ff88]/30"
                                : "bg-white/[0.02] border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            <div className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                              block.priority === v ? "bg-[#00ff88] border-[#00ff88]" : "border-white/20"
                            }`} />
                            <div>
                              <div className="text-[11px] font-mono text-[#d8d8d8]">{label}</div>
                              <div className="text-[10px] font-mono text-[#444]">{desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSheet === "schedule" && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-2">Schedule</div>
                      <div>
                        <div className="text-[10px] font-mono text-[#444] mb-1">Start</div>
                        <input
                          type="datetime-local"
                          defaultValue={block.scheduleStart ? new Date(block.scheduleStart).toISOString().slice(0, 16) : ""}
                          id={`sched-start-${block.id}`}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-[#444] mb-1">End</div>
                        <input
                          type="datetime-local"
                          defaultValue={block.scheduleEnd ? new Date(block.scheduleEnd).toISOString().slice(0, 16) : ""}
                          id={`sched-end-${block.id}`}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-[#e0e0e0] font-mono focus:border-[#00ff88]/30 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const start = (document.getElementById(`sched-start-${block.id}`) as HTMLInputElement)?.value
                          const end = (document.getElementById(`sched-end-${block.id}`) as HTMLInputElement)?.value
                          patchSheet({
                            scheduleStart: start ? new Date(start).toISOString() : null,
                            scheduleEnd: end ? new Date(end).toISOString() : null,
                          })
                        }}
                        className="bg-[#00ff88] text-black font-mono font-semibold rounded-lg px-3 py-1.5 text-xs hover:opacity-90"
                      >
                        Save schedule
                      </button>
                    </div>
                  )}

                  {activeSheet === "lock" && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-2">Lock</div>
                      <div className="space-y-1.5">
                        {[
                          { v: "none", label: "None", desc: "Publicly accessible" },
                          { v: "email", label: "Email", desc: "Visitor enters email to unlock" },
                          { v: "payment", label: "Payment", desc: "Paid access" },
                          { v: "password", label: "Password", desc: "Password required" },
                          { v: "age", label: "Age (18+)", desc: "Age confirmation required" },
                        ].map(({ v, label, desc }) => (
                          <button
                            key={v}
                            onClick={() => patchSheet({ lockType: v, lockValue: null })}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${
                              block.lockType === v
                                ? "bg-[#00ff88]/10 border-[#00ff88]/30"
                                : "bg-white/[0.02] border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            <div className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                              block.lockType === v ? "bg-[#00ff88] border-[#00ff88]" : "border-white/20"
                            }`} />
                            <div>
                              <div className="text-[11px] font-mono text-[#d8d8d8]">{label}</div>
                              <div className="text-[10px] font-mono text-[#444]">{desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── AddBlockPicker (inline) ──────────────────────────────────────────────────

interface AddBlockPickerProps {
  onClose: () => void
  onSelect: (type: string) => void
}

function AddBlockPicker({ onClose, onSelect }: AddBlockPickerProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Suggested")

  const categories = ["Suggested", "Commerce", "Social", "Media", "Live", "Display"]

  const allItems: Record<string, { id: string; name: string; desc: string; icon: React.ReactNode; color: string }[]> = {
    Suggested: [
      { id: "youtube",    name: "YouTube",  desc: "Latest videos",       icon: <Youtube size={16} />,    color: "bg-red-500/[0.08] text-red-400" },
      { id: "spotify",    name: "Spotify",  desc: "Track or playlist",   icon: <Music size={16} />,      color: "bg-green-500/[0.08] text-green-400" },
      { id: "twitch",     name: "Twitch",   desc: "Live stream",         icon: <Radio size={16} />,      color: "bg-purple-500/[0.08] text-purple-400" },
      { id: "podcast",    name: "Podcast",  desc: "RSS feed",            icon: <Mic size={16} />,        color: "bg-orange-500/[0.08] text-orange-400" },
      { id: "drop",       name: "Drop",     desc: "Countdown reveal",    icon: <Timer size={16} />,      color: "bg-[#00ff88]/[0.08] text-[#00ff88]" },
      { id: "stats",      name: "Stats",    desc: "Authority numbers",   icon: <BarChart2 size={16} />,  color: "bg-blue-500/[0.08] text-blue-400" },
    ],
    Commerce: [
      { id: "product",    name: "Product",        desc: "Digital download",  icon: <ShoppingBag size={16} />, color: "bg-blue-500/[0.08] text-blue-400" },
      { id: "vault",      name: "Vault",          desc: "Gated content",     icon: <Lock size={16} />,        color: "bg-yellow-500/[0.08] text-yellow-400" },
      { id: "crypto",     name: "Crypto",         desc: "Tip address",       icon: <Bitcoin size={16} />,     color: "bg-orange-500/[0.08] text-orange-400" },
      { id: "link",       name: "Affiliate Link", desc: "Tracked URL",       icon: <LucideLink size={16} />,  color: "bg-white/[0.04] text-[#888]" },
      { id: "link",       name: "Discount Code",  desc: "Promo code",        icon: <Star size={16} />,        color: "bg-white/[0.04] text-[#888]" },
    ],
    Social: [
      { id: "social_link", name: "Instagram", desc: "@handle",        icon: <Share2 size={16} />, color: "bg-pink-500/[0.08] text-pink-400" },
      { id: "social_link", name: "TikTok",    desc: "@handle",        icon: <Share2 size={16} />, color: "bg-white/[0.04] text-[#888]" },
      { id: "social_link", name: "X",         desc: "@handle",        icon: <Share2 size={16} />, color: "bg-white/[0.04] text-[#888]" },
      { id: "social_link", name: "Threads",   desc: "@handle",        icon: <Share2 size={16} />, color: "bg-white/[0.04] text-[#888]" },
      { id: "social_link", name: "Facebook",  desc: "Page or profile", icon: <Share2 size={16} />, color: "bg-blue-500/[0.08] text-blue-400" },
      { id: "social_link", name: "WhatsApp",  desc: "Chat link",      icon: <Share2 size={16} />, color: "bg-green-500/[0.08] text-green-400" },
      { id: "social_link", name: "Discord",   desc: "Server invite",  icon: <Share2 size={16} />, color: "bg-purple-500/[0.08] text-purple-400" },
      { id: "social_link", name: "Reddit",    desc: "Subreddit",      icon: <Share2 size={16} />, color: "bg-orange-500/[0.08] text-orange-400" },
      { id: "social_link", name: "Snapchat",  desc: "@handle",        icon: <Share2 size={16} />, color: "bg-yellow-500/[0.08] text-yellow-400" },
    ],
    Media: [
      { id: "youtube",  name: "YouTube",      desc: "Channel feed",   icon: <Youtube size={16} />,   color: "bg-red-500/[0.08] text-red-400" },
      { id: "spotify",  name: "Spotify",      desc: "Music embed",    icon: <Music size={16} />,     color: "bg-green-500/[0.08] text-green-400" },
      { id: "podcast",  name: "Podcast",      desc: "RSS episodes",   icon: <Mic size={16} />,       color: "bg-orange-500/[0.08] text-orange-400" },
      { id: "twitch",   name: "Twitch",       desc: "Stream embed",   icon: <Radio size={16} />,     color: "bg-purple-500/[0.08] text-purple-400" },
    ],
    Live: [
      { id: "drop",        name: "Drop",        desc: "Countdown reveal",  icon: <Timer size={16} />, color: "bg-[#00ff88]/[0.08] text-[#00ff88]" },
      { id: "live_status", name: "Live Status", desc: "Broadcast badge",   icon: <Radio size={16} />, color: "bg-red-500/[0.08] text-red-400" },
    ],
    Display: [
      { id: "stats",        name: "Stats",        desc: "Authority numbers", icon: <BarChart2 size={16} />,  color: "bg-blue-500/[0.08] text-blue-400" },
      { id: "text",         name: "Text",         desc: "Rich text block",   icon: <LucideLink size={16} />, color: "bg-white/[0.04] text-[#888]" },
      { id: "faq",          name: "FAQ",          desc: "Q&A accordion",     icon: <LucideLink size={16} />, color: "bg-white/[0.04] text-[#888]" },
      { id: "contact_form", name: "Contact Form", desc: "Email capture",     icon: <LucideLink size={16} />, color: "bg-white/[0.04] text-[#888]" },
    ],
  }

  const quickTypes = [
    { id: "collection", name: "Collection", icon: <Folder size={18} />, color: "text-[#888]" },
    { id: "link",       name: "Link",       icon: <LucideLink size={18} />, color: "text-[#888]" },
    { id: "product",    name: "Product",    icon: <ShoppingBag size={18} />, color: "text-blue-400" },
    { id: "vault",      name: "Vault",      icon: <Lock size={18} />, color: "text-yellow-400" },
  ]

  const items = allItems[category] || []
  const filtered = search
    ? Object.values(allItems).flat().filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.desc.toLowerCase().includes(search.toLowerCase())
      )
    : items

  return (
    <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
        <span className="text-xs font-mono text-[#888]">Add a block</span>
        <button onClick={onClose} className="text-[#444] hover:text-[#888] transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg mx-3 my-2 px-2 py-1.5">
        <Search size={12} className="text-[#444] flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-[12px] font-mono text-[#888] outline-none placeholder:text-[#333]"
          placeholder="Search blocks..."
          autoFocus
        />
      </div>

      {/* Quick types */}
      {!search && (
        <div className="grid grid-cols-4 gap-2 px-3 pb-3 border-b border-white/[0.06]">
          {quickTypes.map((qt) => (
            <button
              key={qt.id + qt.name}
              onClick={() => onSelect(qt.id)}
              className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-2 flex flex-col items-center gap-1 hover:border-[#00ff88]/[0.2] hover:bg-[#00ff88]/[0.02] transition-all"
            >
              <span className={qt.color}>{qt.icon}</span>
              <span className="text-[10px] font-mono text-[#444]">{qt.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="flex" style={{ minHeight: 200 }}>
        {/* Categories */}
        {!search && (
          <div className="w-36 border-r border-white/[0.06] p-2 flex-shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  category === cat
                    ? "bg-white/[0.05] text-[#e0e0e0]"
                    : "text-[#444] hover:text-[#888] hover:bg-white/[0.03] hover:translate-x-0.5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 p-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {filtered.map((item, i) => (
            <button
              key={`${item.id}-${i}`}
              onClick={() => onSelect(item.id)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                {item.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-[13px] text-[#d8d8d8]">{item.name}</div>
                <div className="text-[11px] text-[#444]">{item.desc}</div>
              </div>
              <ChevronRight size={12} className="text-[#333] group-hover:text-[#555] flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
