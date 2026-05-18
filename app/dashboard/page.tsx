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

// Types
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

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  // State
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

  // Blocks UI state
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [showAddBlockPicker, setShowAddBlockPicker] = useState(false)
  const [editFields, setEditFields] = useState<Record<string, Record<string, string>>>({})

  // Legacy form state (still referenced by preserved handlers)
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
  // Suppress unused-var warnings for the legacy form state we're keeping
  void newLink; void setNewLink; void isAddingLink; void setIsAddingLink
  void newSocialLink; void setNewSocialLink; void isAddingSocial; void setIsAddingSocial
  void newDrop; void setNewDrop; void isAddingDrop; void setIsAddingDrop

  const isPro = profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trial' || profile?.subscriptionStatus === 'canceling'

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setReferralStats(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login")
    } else if (isLoaded && user) {
      loadData()
    }
  }, [isLoaded, user, router])

  const loadData = async () => {
    try {
      const [profileRes, linksRes, socialRes, cryptoRes, vaultRes, modulesRes, productsRes, dropsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/links"),
        fetch("/api/social-links"),
        fetch("/api/crypto-addresses"),
        fetch("/api/vault/items"),
        fetch("/api/modules"),
        fetch("/api/products"),
        fetch("/api/drops"),
      ])

      if (profileRes.ok) setProfile(await profileRes.json())
      if (linksRes.ok) setLinks(await linksRes.json())
      if (socialRes.ok) setSocialLinks(await socialRes.json())
      if (cryptoRes.ok) setCryptoAddresses(await cryptoRes.json())
      if (vaultRes.ok) setVaultItems(await vaultRes.json())
      if (modulesRes.ok) setModules(await modulesRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (dropsRes.ok) setDrops(await dropsRes.json())
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load dashboard data. Please refresh.")
    } finally {
      setLoading(false)
    }
  }

  // Link handlers
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
    } catch (error) {
      toast.error("Failed to add link")
    } finally {
      setSaving(false)
    }
  }

  const toggleLink = async (id: string, enabled: boolean) => {
    setLinks(links.map(l => l.id === id ? { ...l, enabled } : l))
    try {
      await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
    } catch (error) {
      setLinks(links.map(l => l.id === id ? { ...l, enabled: !enabled } : l))
      toast.error("Failed to update link. Please try again.")
    }
  }

  const deleteLink = async (id: string) => {
    if (!confirm("Delete this link?")) return
    const previousLinks = [...links]
    setLinks(links.filter(l => l.id !== id))
    try {
      await fetch(`/api/links/${id}`, { method: "DELETE" })
    } catch (error) {
      setLinks(previousLinks)
      toast.error("Failed to delete link. Please try again.")
    }
  }

  // Drop handlers
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
        setDrops(prev => [...prev, drop])
        setNewDrop({ title: "", description: "", dropAt: "", revealUrl: "", revealText: "", limitedSpots: "" })
        setIsAddingDrop(false)
        toast.success("Drop scheduled!")
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to add drop")
      }
    } catch (error) {
      toast.error("Failed to add drop")
    } finally {
      setSaving(false)
    }
  }

  const toggleDrop = async (id: string, enabled: boolean) => {
    const previous = drops
    setDrops(prev => prev.map(d => d.id === id ? { ...d, enabled } : d))
    try {
      const res = await fetch(`/api/drops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error("toggle failed")
    } catch (error) {
      setDrops(previous)
      toast.error("Failed to update drop. Please try again.")
    }
  }

  const deleteDrop = async (id: string) => {
    if (!confirm("Delete this drop?")) return
    const previous = drops
    setDrops(prev => prev.filter(d => d.id !== id))
    try {
      const res = await fetch(`/api/drops/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("delete failed")
    } catch (error) {
      setDrops(previous)
      toast.error("Failed to delete drop. Please try again.")
    }
  }

  // Portal handlers
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
    } catch (error) {
      toast.error("Failed to create portal")
    }
  }

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
    } catch (error) {
      toast.error("Failed to add link")
    }
  }

  // Live status handlers
  const toggleLiveStatus = async (isLive: boolean) => {
    try {
      await fetch("/api/live-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveStatus: isLive }),
      })
      setProfile(prev => prev ? { ...prev, liveStatus: isLive } : null)
    } catch (error) {
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
      setProfile(prev => prev ? { ...prev, liveMessage: message } : null)
    } catch (error) {
      toast.error("Failed to update message")
    }
  }

  // AI Agent handler
  const toggleAiAgent = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiAgentEnabled: enabled }),
      })
      if (!res.ok) {
        toast.error("Failed to update AI Agent")
        return
      }
      setProfile((prev) => (prev ? { ...prev, aiAgentEnabled: enabled } : null))
      toast.success(enabled ? "AI Agent enabled" : "AI Agent disabled")
    } catch {
      toast.error("Failed to update AI Agent")
    }
  }

  // Stats handlers
  const updateStats = async (stats: Partial<Profile>) => {
    try {
      await fetch("/api/stats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats),
      })
      setProfile(prev => prev ? { ...prev, ...stats } : null)
    } catch (error) {
      toast.error("Failed to update stats")
    }
  }

  // Crypto handlers
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
    } catch (error) {
      toast.error("Failed to add address")
    }
  }

  const removeCryptoAddress = async (id: string) => {
    try {
      await fetch(`/api/crypto-addresses/${id}`, { method: "DELETE" })
      setCryptoAddresses(cryptoAddresses.filter(a => a.id !== id))
    } catch (error) {
      toast.error("Failed to remove address")
    }
  }

  const toggleCryptoAddress = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/crypto-addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      setCryptoAddresses(cryptoAddresses.map(a => a.id === id ? { ...a, enabled } : a))
    } catch (error) {
      toast.error("Failed to toggle address")
    }
  }

  // Vault handlers
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
    } catch (error) {
      toast.error("Failed to create vault item")
    }
  }

  const deleteVaultItem = async (id: string) => {
    try {
      await fetch(`/api/vault/items/${id}`, { method: "DELETE" })
      setVaultItems(vaultItems.filter(v => v.id !== id))
      toast.success("Vault item deleted")
    } catch (error) {
      toast.error("Failed to delete vault item")
    }
  }

  const toggleVaultLock = async (id: string, locked: boolean) => {
    try {
      await fetch(`/api/vault/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEmailLocked: locked }),
      })
      setVaultItems(vaultItems.map(v => v.id === id ? { ...v, isEmailLocked: locked } : v))
    } catch (error) {
      toast.error("Failed to update vault item")
    }
  }

  // Social handlers
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
    } catch (error) {
      toast.error("Failed to add social link")
    } finally {
      setSaving(false)
    }
  }

  const deleteSocialLink = async (id: string) => {
    if (!confirm("Delete this social link?")) return
    const previous = [...socialLinks]
    setSocialLinks(socialLinks.filter(l => l.id !== id))
    try {
      await fetch(`/api/social-links/${id}`, { method: "DELETE" })
    } catch (error) {
      setSocialLinks(previous)
    }
  }

  // Calculate stats
  const totalClicks = links.reduce((acc, link) => acc + (link._count?.clicks || 0), 0)
  // Exclude vault items — they're rendered as their own block kind via /api/vault/items
  const folders = links.filter(l => l.isFolder && !l.isVaultItem)
  const regularLinks = links.filter(l => !l.isFolder && !l.parentId && !l.isVaultItem)

  // Unified blocks list (order: drops -> links -> portals -> modules -> products -> vault -> social -> crypto)
  type AnyBlock =
    | { kind: "drop"; id: string; data: DbDrop }
    | { kind: "link"; id: string; data: DbLink }
    | { kind: "portal"; id: string; data: DbLink }
    | { kind: "module"; id: string; data: BentoModule }
    | { kind: "product"; id: string; data: Product }
    | { kind: "vault"; id: string; data: VaultItem }
    | { kind: "social"; id: string; data: SocialLink }
    | { kind: "crypto"; id: string; data: CryptoAddress }

  const allBlocks: AnyBlock[] = [
    ...drops.map(d => ({ kind: "drop" as const, id: d.id, data: d })),
    ...regularLinks.map(l => ({ kind: "link" as const, id: l.id, data: l })),
    ...folders.map(f => ({ kind: "portal" as const, id: f.id, data: f })),
    ...modules.map(m => ({ kind: "module" as const, id: m.id, data: m })),
    ...products.map(p => ({ kind: "product" as const, id: p.id, data: p })),
    ...vaultItems.map(v => ({ kind: "vault" as const, id: v.id, data: v })),
    ...socialLinks.map(s => ({ kind: "social" as const, id: s.id, data: s })),
    ...cryptoAddresses.map(c => ({ kind: "crypto" as const, id: c.id, data: c })),
  ]

  // editFields helpers — read with fallback, write per blockId/key
  const getField = (blockId: string, key: string, fallback: string): string =>
    editFields[blockId]?.[key] ?? fallback
  const setField = (blockId: string, key: string, val: string) =>
    setEditFields(prev => ({ ...prev, [blockId]: { ...(prev[blockId] || {}), [key]: val } }))
  const clearFields = (blockId: string) =>
    setEditFields(prev => {
      const { [blockId]: _gone, ...rest } = prev
      void _gone
      return rest
    })

  const handleCopyReferralLink = async () => {
    if (!referralStats?.referralLink) return
    try {
      await navigator.clipboard.writeText(referralStats.referralLink)
      toast.success("Link copied!")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const toggleExpand = (id: string) =>
    setExpandedBlockId(curr => (curr === id ? null : id))

  // Auto-expand a freshly created block + close the picker
  const handleAddBlock = async (type: string) => {
    setShowAddBlockPicker(false)
    try {
      switch (type) {
        case "link": {
          const res = await fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Untitled link" }),
          })
          if (!res.ok) throw new Error()
          const link = await res.json()
          setLinks(prev => [...prev, link])
          setExpandedBlockId(link.id)
          toast.success("Link added")
          break
        }
        case "portal": {
          await createFolder("New portal", "📁")
          // createFolder updates state asynchronously; expand the most recently created folder
          // by waiting one tick for state, then picking the newest folder id.
          setTimeout(() => {
            const newest = [...links].filter(l => l.isFolder).slice(-1)[0]
            if (newest) setExpandedBlockId(newest.id)
          }, 0)
          break
        }
        case "drop": {
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          const res = await fetch("/api/drops", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Untitled drop", dropAt: tomorrow }),
          })
          if (!res.ok) throw new Error()
          const drop = await res.json()
          setDrops(prev => [...prev, drop])
          setExpandedBlockId(drop.id)
          toast.success("Drop added")
          break
        }
        case "social": {
          const res = await fetch("/api/social-links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform: "instagram", url: "https://" }),
          })
          if (!res.ok) throw new Error()
          const social = await res.json()
          setSocialLinks(prev => [...prev, social])
          setExpandedBlockId(social.id)
          toast.success("Social link added")
          break
        }
        case "crypto": {
          const res = await fetch("/api/crypto-addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currency: "BTC", address: "" }),
          })
          if (!res.ok) throw new Error()
          const addr = await res.json()
          setCryptoAddresses(prev => [...prev, addr])
          setExpandedBlockId(addr.id)
          toast.success("Crypto address added")
          break
        }
        case "vault": {
          const res = await fetch("/api/vault/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Untitled vault item", isEmailLocked: true }),
          })
          if (!res.ok) throw new Error()
          const item = await res.json()
          setVaultItems(prev => [...prev, item])
          setExpandedBlockId(item.id)
          toast.success("Vault item added")
          break
        }
        case "product": {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Untitled product", price: 100 }),
          })
          if (!res.ok) {
            const errorData = await res.json()
            toast.error(errorData.error || "Failed to add product")
            return
          }
          const p = await res.json()
          setProducts(prev => [...prev, p])
          setExpandedBlockId(p.id)
          toast.success("Product added")
          break
        }
        case "live":
          setExpandedBlockId("__live__")
          break
        case "stats":
          setExpandedBlockId("__stats__")
          break
        // Module sub-types
        case "module:youtube":
        case "module:spotify":
        case "module:podcast":
        case "module:twitch":
        case "module:tiktok":
        case "module:apple_music":
        case "module:rss":
        case "module:image":
        case "module:social_hub":
        case "module:quick_tip": {
          const moduleType = type.replace("module:", "")
          const res = await fetch("/api/modules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: moduleType, span: 2, config: {} }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            toast.error(err.error || "Failed to add module")
            return
          }
          const m = await res.json()
          setModules(prev => [...prev, m])
          setExpandedBlockId(m.id)
          toast.success("Module added")
          break
        }
        default:
          toast.error("Unknown block type")
      }
    } catch (error) {
      toast.error("Failed to add block")
    }
  }

  // Generic save helpers (PATCH then update local state)
  const saveLinkEdits = async (id: string, blockKey: string) => {
    const fields = editFields[blockKey]
    if (!fields) return
    const body: Record<string, unknown> = {}
    if (fields.title !== undefined) body.title = fields.title
    if (fields.url !== undefined) body.url = fields.url
    if (fields.icon !== undefined) body.icon = fields.icon

    try {
      const res = await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setLinks(prev => prev.map(l => (l.id === id ? { ...l, ...body } as DbLink : l)))
      clearFields(blockKey)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  const saveDropEdits = async (id: string, blockKey: string) => {
    const fields = editFields[blockKey]
    if (!fields) return
    const body: Record<string, unknown> = {}
    if (fields.title !== undefined) body.title = fields.title
    if (fields.description !== undefined) body.description = fields.description || null
    if (fields.dropAt !== undefined && fields.dropAt) body.dropAt = new Date(fields.dropAt).toISOString()
    if (fields.revealUrl !== undefined) body.revealUrl = fields.revealUrl || null
    if (fields.revealText !== undefined) body.revealText = fields.revealText || null
    if (fields.limitedSpots !== undefined) {
      const n = parseInt(fields.limitedSpots, 10)
      body.limitedSpots = Number.isFinite(n) && n > 0 ? n : null
      body.spotsLeft = Number.isFinite(n) && n > 0 ? n : null
    }
    try {
      const res = await fetch(`/api/drops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setDrops(prev => prev.map(d => (d.id === id ? { ...d, ...body } as DbDrop : d)))
      clearFields(blockKey)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  const saveSocialEdits = async (id: string, blockKey: string) => {
    const fields = editFields[blockKey]
    if (!fields) return
    const body: Record<string, unknown> = {}
    if (fields.url !== undefined) body.url = fields.url
    if (fields.platform !== undefined) body.platform = fields.platform
    try {
      const res = await fetch(`/api/social-links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setSocialLinks(prev => prev.map(s => (s.id === id ? { ...s, ...body } as SocialLink : s)))
      clearFields(blockKey)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  const saveCryptoEdits = async (id: string, blockKey: string) => {
    const fields = editFields[blockKey]
    if (!fields) return
    const body: Record<string, unknown> = {}
    if (fields.address !== undefined) body.address = fields.address
    if (fields.label !== undefined) body.label = fields.label
    if (fields.currency !== undefined) body.currency = fields.currency
    try {
      const res = await fetch(`/api/crypto-addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setCryptoAddresses(prev => prev.map(c => (c.id === id ? { ...c, ...body } as CryptoAddress : c)))
      clearFields(blockKey)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  const saveVaultEdits = async (id: string, blockKey: string) => {
    const fields = editFields[blockKey]
    if (!fields) return
    const body: Record<string, unknown> = {}
    if (fields.title !== undefined) body.title = fields.title
    if (fields.icon !== undefined) body.icon = fields.icon
    if (fields.url !== undefined) body.url = fields.url
    if (fields.downloadUrl !== undefined) body.downloadUrl = fields.downloadUrl
    if (fields.downloadName !== undefined) body.downloadName = fields.downloadName
    if (fields.vaultContent !== undefined) body.vaultContent = fields.vaultContent
    try {
      const res = await fetch(`/api/vault/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setVaultItems(prev => prev.map(v => (v.id === id ? { ...v, ...body } as VaultItem : v)))
      clearFields(blockKey)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  const saveProductEdits = async (id: string, blockKey: string) => {
    const fields = editFields[blockKey]
    if (!fields) return
    const body: Record<string, unknown> = {}
    if (fields.title !== undefined) body.title = fields.title
    if (fields.description !== undefined) body.description = fields.description
    if (fields.imageUrl !== undefined) body.imageUrl = fields.imageUrl
    if (fields.priceDollars !== undefined) {
      const n = parseFloat(fields.priceDollars)
      if (Number.isFinite(n)) body.price = Math.round(n * 100)
    }
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)))
      clearFields(blockKey)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  const saveModuleEdits = async (id: string, blockKey: string) => {
    const fields = editFields[blockKey]
    if (!fields) return
    const mod = modules.find(m => m.id === id)
    if (!mod) return
    const config: Record<string, unknown> = { ...mod.config }
    Object.keys(fields).forEach(k => {
      if (k.startsWith("config.")) {
        config[k.slice("config.".length)] = fields[k]
      }
    })
    const body: Record<string, unknown> = { config }
    if (fields.title !== undefined) body.title = fields.title
    try {
      const res = await fetch(`/api/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setModules(prev => prev.map(m => (m.id === id ? { ...m, ...updated } : m)))
      clearFields(blockKey)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  const setModuleSpan = async (id: string, span: number) => {
    const previous = modules
    setModules(prev => prev.map(m => (m.id === id ? { ...m, span } : m)))
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

  const toggleModule = async (id: string, enabled: boolean) => {
    const previous = modules
    setModules(prev => prev.map(m => (m.id === id ? { ...m, enabled } : m)))
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

  const deleteModule = async (id: string) => {
    if (!confirm("Delete this module?")) return
    const previous = modules
    setModules(prev => prev.filter(m => m.id !== id))
    try {
      await fetch(`/api/modules/${id}`, { method: "DELETE" })
    } catch {
      setModules(previous)
      toast.error("Failed to delete module")
    }
  }

  const toggleProduct = async (id: string, enabled: boolean) => {
    const previous = products
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, enabled } : p)))
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

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return
    const previous = products
    setProducts(prev => prev.filter(p => p.id !== id))
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" })
    } catch {
      setProducts(previous)
      toast.error("Failed to delete product")
    }
  }

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

  return (
    <AccentColorProvider initialColor={profile?.accentColor || "#00ff88"}>
    <div className="min-h-screen bg-[#030303] text-white relative">
      <PremiumBackground />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 safe-bottom">
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          
          {/* Left: Editor */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <GlassBrick className="!p-4 text-center">
                <div className="text-2xl font-bold text-white">{links.length}</div>
                <div className="label">Links</div>
              </GlassBrick>
              <GlassBrick className="!p-4 text-center">
                <div className="text-2xl font-bold text-[#00ff88]">{totalClicks}</div>
                <div className="label">Clicks</div>
              </GlassBrick>
              <GlassBrick className="!p-4 text-center">
                <div className="text-2xl font-bold text-white">{folders.length}</div>
                <div className="label">Portals</div>
              </GlassBrick>
            </div>

            {/* Topbar — heading + Style toggle */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-white/30">Your Page</h2>
              <button
                onClick={() => setShowStylePanel(s => !s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                  showStylePanel
                    ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                    : "bg-white/[0.03] border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"
                }`}
              >
                Style
              </button>
            </div>

            {/* Style panel — slide-down from old "style" tab */}
            <AnimatePresence>
              {showStylePanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="space-y-6 pb-2">
                    <ObsidianCard variant="accent" className="p-6">
                      <h3 className="font-bold text-xl mb-2 text-white">Accent Color</h3>
                      <p className="text-sm text-[#888888] mb-6">
                        Choose a color theme for your page. This will update the glow effects and accents across your entire profile.
                      </p>
                      <ColorSwatchSelector showLabels />
                    </ObsidianCard>

                    <GlassBrick className="!p-6">
                      <h3 className="font-bold text-lg mb-4 text-white">Preview</h3>
                      <p className="text-sm text-[#888888] mb-4">
                        Your accent color will be applied to borders, glows, and interactive elements.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="accent-glow-card !p-4 text-center">
                          <div className="text-2xl mb-2">✨</div>
                          <div className="text-sm font-medium text-white">Glow Card</div>
                        </div>
                        <div className="glass-brick !p-4 text-center hover:border-[var(--accent-color)] hover:shadow-[0_0_20px_var(--accent-glow)] transition-all">
                          <div className="text-2xl mb-2">🔗</div>
                          <div className="text-sm font-medium text-white">Link Card</div>
                        </div>
                      </div>
                    </GlassBrick>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unified blocks list */}
            <div className="space-y-1.5">
              {/* Singleton: Live Status */}
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

              {/* Singleton: Stats */}
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

              {/* Singleton: AI Agent */}
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

              {/* Singleton: Earn */}
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

              {/* Dynamic blocks */}
              {allBlocks.map((block) => {
                const blockKey = block.id
                let icon = "•"
                let label = ""
                let badge = ""
                let enabled: boolean | undefined = undefined
                let onEnable: ((v: boolean) => void) | undefined = undefined
                switch (block.kind) {
                  case "drop":
                    icon = "🎬"
                    label = block.data.title || "Untitled drop"
                    badge = "Drop"
                    enabled = block.data.enabled
                    onEnable = (v) => toggleDrop(block.id, v)
                    break
                  case "link":
                    icon = block.data.icon || "🔗"
                    label = block.data.title || "Untitled link"
                    badge = "Link"
                    enabled = block.data.enabled
                    onEnable = (v) => toggleLink(block.id, v)
                    break
                  case "portal":
                    icon = block.data.icon || "📁"
                    label = block.data.title || "Portal"
                    badge = "Portal"
                    enabled = block.data.enabled
                    onEnable = (v) => toggleLink(block.id, v)
                    break
                  case "module":
                    icon = moduleIcon(block.data.type)
                    label = block.data.title || moduleLabel(block.data.type)
                    badge = moduleLabel(block.data.type)
                    enabled = block.data.enabled
                    onEnable = (v) => toggleModule(block.id, v)
                    break
                  case "product":
                    icon = "🛒"
                    label = block.data.title || "Product"
                    badge = "Product"
                    enabled = block.data.enabled
                    onEnable = (v) => toggleProduct(block.id, v)
                    break
                  case "vault":
                    icon = block.data.icon || "🔒"
                    label = block.data.title || "Vault item"
                    badge = "Vault"
                    break
                  case "social":
                    icon = "🔗"
                    label = block.data.platform.charAt(0).toUpperCase() + block.data.platform.slice(1)
                    badge = "Social"
                    break
                  case "crypto":
                    icon = "₿"
                    label = block.data.label || block.data.currency
                    badge = block.data.currency
                    enabled = block.data.enabled
                    onEnable = (v) => toggleCryptoAddress(block.id, v)
                    break
                }
                return (
                  <BlockRow
                    key={`${block.kind}-${block.id}`}
                    id={block.id}
                    icon={icon}
                    label={label}
                    badge={badge}
                    enabled={enabled}
                    expanded={expandedBlockId === block.id}
                    onToggle={() => toggleExpand(block.id)}
                    onEnableToggle={onEnable}
                  >
                    {(() => {
                      switch (block.kind) {
                        case "link": {
                          const link = block.data
                          return (
                            <div className="space-y-3">
                              <div className="grid grid-cols-[80px,1fr] gap-2">
                                <input
                                  value={getField(blockKey, "icon", link.icon || "")}
                                  onChange={(e) => setField(blockKey, "icon", e.target.value)}
                                  className="input-obsidian text-center text-xl"
                                  placeholder="🔗"
                                />
                                <input
                                  value={getField(blockKey, "title", link.title || "")}
                                  onChange={(e) => setField(blockKey, "title", e.target.value)}
                                  className="input-obsidian"
                                  placeholder="Title"
                                />
                              </div>
                              <input
                                value={getField(blockKey, "url", link.url || "")}
                                onChange={(e) => setField(blockKey, "url", e.target.value)}
                                className="input-obsidian w-full"
                                placeholder="https://..."
                              />
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Style</div>
                                <div className="flex gap-1.5 flex-wrap">
                                  {(["glass","3d","gradient","glow","neon"] as const).map(s => {
                                    const active = (link.style || "glass") === s
                                    return (
                                      <button
                                        key={s}
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/links/${block.id}`, {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ style: s }),
                                            })
                                            if (!res.ok) { toast.error("Failed to update style"); return }
                                            setLinks(prev => prev.map(l => l.id === block.id ? { ...l, style: s } : l))
                                            toast.success("Style updated")
                                          } catch { toast.error("Failed to update style") }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                                          active
                                            ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]"
                                            : "bg-white/[0.03] border border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"
                                        }`}
                                      >
                                        {s === "3d" ? "3D" : s.charAt(0).toUpperCase() + s.slice(1)}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Size</div>
                                <div className="flex gap-1.5">
                                  {(["full","half"] as const).map(size => {
                                    const active = (link.cardSize || "full") === size
                                    return (
                                      <button
                                        key={size}
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/links/${block.id}`, {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ cardSize: size }),
                                            })
                                            if (!res.ok) { toast.error("Failed to update size"); return }
                                            setLinks(prev => prev.map(l => l.id === block.id ? { ...l, cardSize: size } : l))
                                            toast.success("Size updated")
                                          } catch { toast.error("Failed to update size") }
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                                          active
                                            ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]"
                                            : "bg-white/[0.03] border border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"
                                        }`}
                                      >
                                        {size === "full" ? "Full" : "Half"}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveLinkEdits(block.id, blockKey)} variant="accent-solid" className="flex-1">Save</Button>
                                <Button onClick={() => deleteLink(block.id)} variant="outline">Delete</Button>
                              </div>
                            </div>
                          )
                        }
                        case "portal": {
                          const folder = block.data
                          const children = links.filter(l => l.parentId === block.id)
                          return (
                            <div className="space-y-3">
                              <div className="grid grid-cols-[80px,1fr] gap-2">
                                <input
                                  value={getField(blockKey, "icon", folder.icon || "")}
                                  onChange={(e) => setField(blockKey, "icon", e.target.value)}
                                  className="input-obsidian text-center text-xl"
                                  placeholder="📁"
                                />
                                <input
                                  value={getField(blockKey, "title", folder.title || "")}
                                  onChange={(e) => setField(blockKey, "title", e.target.value)}
                                  className="input-obsidian"
                                  placeholder="Portal name"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">
                                  Items inside ({children.length})
                                </div>
                                <div className="space-y-1.5">
                                  {children.map((child) => (
                                    <div key={child.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                      <span>{child.icon || "🔗"}</span>
                                      <span className="flex-1 text-sm text-[#e0e0e0] truncate">{child.title}</span>
                                      <span className="text-[10px] font-mono text-[#444] truncate max-w-[140px]">{child.url}</span>
                                    </div>
                                  ))}
                                  {children.length === 0 && (
                                    <div className="px-3 py-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs text-[#666] font-mono">
                                      Empty portal — open Studio to add items
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveLinkEdits(block.id, blockKey)} variant="accent-solid" className="flex-1">Save</Button>
                                <Link href="/dashboard/studio">
                                  <Button variant="ghost">Studio</Button>
                                </Link>
                                <Button onClick={() => deleteLink(block.id)} variant="outline">Delete</Button>
                              </div>
                            </div>
                          )
                        }
                        case "drop": {
                          const drop = block.data
                          const dropAtLocal = (() => {
                            try { return new Date(drop.dropAt).toISOString().slice(0, 16) } catch { return "" }
                          })()
                          return (
                            <div className="space-y-3">
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Title</div>
                                <input
                                  value={getField(blockKey, "title", drop.title || "")}
                                  onChange={(e) => setField(blockKey, "title", e.target.value)}
                                  className="input-obsidian w-full"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Description</div>
                                <input
                                  value={getField(blockKey, "description", drop.description || "")}
                                  onChange={(e) => setField(blockKey, "description", e.target.value)}
                                  className="input-obsidian w-full"
                                  placeholder="Limited release"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Drop date & time</div>
                                <input
                                  type="datetime-local"
                                  value={getField(blockKey, "dropAt", dropAtLocal)}
                                  onChange={(e) => setField(blockKey, "dropAt", e.target.value)}
                                  className="input-obsidian w-full"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Reveal URL</div>
                                <input
                                  value={getField(blockKey, "revealUrl", drop.revealUrl || "")}
                                  onChange={(e) => setField(blockKey, "revealUrl", e.target.value)}
                                  className="input-obsidian w-full"
                                  placeholder="https://..."
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Reveal text</div>
                                <textarea
                                  value={getField(blockKey, "revealText", drop.revealText || "")}
                                  onChange={(e) => setField(blockKey, "revealText", e.target.value)}
                                  className="input-obsidian w-full min-h-[60px]"
                                  placeholder="Code: PAYTREE25"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Limited spots</div>
                                <input
                                  type="number"
                                  min="1"
                                  value={getField(blockKey, "limitedSpots", drop.limitedSpots != null ? String(drop.limitedSpots) : "")}
                                  onChange={(e) => setField(blockKey, "limitedSpots", e.target.value)}
                                  className="input-obsidian w-full"
                                  placeholder="100"
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveDropEdits(block.id, blockKey)} variant="accent-solid" className="flex-1">Save</Button>
                                <Button onClick={() => deleteDrop(block.id)} variant="outline">Delete</Button>
                              </div>
                            </div>
                          )
                        }
                        case "module": {
                          const m = block.data
                          const cfg = (m.config || {}) as Record<string, string>
                          return (
                            <div className="space-y-3">
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Title (optional)</div>
                                <input
                                  value={getField(blockKey, "title", m.title || "")}
                                  onChange={(e) => setField(blockKey, "title", e.target.value)}
                                  className="input-obsidian w-full"
                                />
                              </div>
                              {renderModuleConfigInputs(blockKey, m.type, cfg, getField, setField)}
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Size</div>
                                <div className="flex gap-1.5">
                                  {[1, 2, 4].map(span => {
                                    const active = m.span === span
                                    return (
                                      <button
                                        key={span}
                                        onClick={() => setModuleSpan(block.id, span)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                                          active
                                            ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]"
                                            : "bg-white/[0.03] border border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"
                                        }`}
                                      >
                                        {span === 1 ? "1×" : span === 2 ? "2×" : "Full"}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveModuleEdits(block.id, blockKey)} variant="accent-solid" className="flex-1">Save</Button>
                                <Button onClick={() => deleteModule(block.id)} variant="outline">Delete</Button>
                              </div>
                            </div>
                          )
                        }
                        case "product": {
                          const p = block.data
                          return (
                            <div className="space-y-3">
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Title</div>
                                <input
                                  value={getField(blockKey, "title", p.title || "")}
                                  onChange={(e) => setField(blockKey, "title", e.target.value)}
                                  className="input-obsidian w-full"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Price (USD)</div>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={getField(blockKey, "priceDollars", (p.price / 100).toFixed(2))}
                                  onChange={(e) => setField(blockKey, "priceDollars", e.target.value)}
                                  className="input-obsidian w-full"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Description</div>
                                <textarea
                                  value={getField(blockKey, "description", p.description || "")}
                                  onChange={(e) => setField(blockKey, "description", e.target.value)}
                                  className="input-obsidian w-full min-h-[60px]"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Image URL</div>
                                <input
                                  value={getField(blockKey, "imageUrl", p.imageUrl || "")}
                                  onChange={(e) => setField(blockKey, "imageUrl", e.target.value)}
                                  className="input-obsidian w-full"
                                  placeholder="https://..."
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveProductEdits(block.id, blockKey)} variant="accent-solid" className="flex-1">Save</Button>
                                <Button onClick={() => deleteProduct(block.id)} variant="outline">Delete</Button>
                              </div>
                            </div>
                          )
                        }
                        case "vault": {
                          const v = block.data
                          return (
                            <div className="space-y-3">
                              <div className="grid grid-cols-[80px,1fr] gap-2">
                                <input
                                  value={getField(blockKey, "icon", v.icon || "")}
                                  onChange={(e) => setField(blockKey, "icon", e.target.value)}
                                  className="input-obsidian text-center text-xl"
                                  placeholder="🔒"
                                />
                                <input
                                  value={getField(blockKey, "title", v.title || "")}
                                  onChange={(e) => setField(blockKey, "title", e.target.value)}
                                  className="input-obsidian"
                                  placeholder="Title"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">URL</div>
                                <input
                                  value={getField(blockKey, "url", v.url || "")}
                                  onChange={(e) => setField(blockKey, "url", e.target.value)}
                                  className="input-obsidian w-full"
                                  placeholder="https://..."
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Download URL</div>
                                <input
                                  value={getField(blockKey, "downloadUrl", v.downloadUrl || "")}
                                  onChange={(e) => setField(blockKey, "downloadUrl", e.target.value)}
                                  className="input-obsidian w-full"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Vault content</div>
                                <textarea
                                  value={getField(blockKey, "vaultContent", v.vaultContent || "")}
                                  onChange={(e) => setField(blockKey, "vaultContent", e.target.value)}
                                  className="input-obsidian w-full min-h-[60px]"
                                  placeholder="Hidden content shown after email unlock"
                                />
                              </div>
                              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                <div className="text-xs font-mono text-[#888]">Email-locked</div>
                                <button
                                  onClick={() => toggleVaultLock(block.id, !v.isEmailLocked)}
                                  className={`w-10 h-6 rounded-full transition-all relative ${
                                    v.isEmailLocked ? "bg-[rgba(0,255,136,0.2)]" : "bg-white/10"
                                  }`}
                                >
                                  <motion.div
                                    className={`absolute top-0.5 w-5 h-5 rounded-full ${v.isEmailLocked ? "bg-[#00ff88]" : "bg-white"}`}
                                    animate={{ left: v.isEmailLocked ? "calc(100% - 22px)" : "2px" }}
                                  />
                                </button>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveVaultEdits(block.id, blockKey)} variant="accent-solid" className="flex-1">Save</Button>
                                <Button onClick={() => deleteVaultItem(block.id)} variant="outline">Delete</Button>
                              </div>
                            </div>
                          )
                        }
                        case "social": {
                          const s = block.data
                          return (
                            <div className="space-y-3">
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Platform</div>
                                <select
                                  value={getField(blockKey, "platform", s.platform)}
                                  onChange={(e) => setField(blockKey, "platform", e.target.value)}
                                  className="input-obsidian w-full"
                                >
                                  <option value="instagram">Instagram</option>
                                  <option value="twitter">Twitter / X</option>
                                  <option value="youtube">YouTube</option>
                                  <option value="tiktok">TikTok</option>
                                  <option value="github">GitHub</option>
                                  <option value="linkedin">LinkedIn</option>
                                  <option value="discord">Discord</option>
                                </select>
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">URL</div>
                                <input
                                  value={getField(blockKey, "url", s.url || "")}
                                  onChange={(e) => setField(blockKey, "url", e.target.value)}
                                  className="input-obsidian w-full"
                                  placeholder="https://..."
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveSocialEdits(block.id, blockKey)} variant="accent-solid" className="flex-1">Save</Button>
                                <Button onClick={() => deleteSocialLink(block.id)} variant="outline">Delete</Button>
                              </div>
                            </div>
                          )
                        }
                        case "crypto": {
                          const c = block.data
                          return (
                            <div className="space-y-3">
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Currency</div>
                                <input
                                  value={getField(blockKey, "currency", c.currency)}
                                  onChange={(e) => setField(blockKey, "currency", e.target.value.toUpperCase())}
                                  className="input-obsidian w-full"
                                  placeholder="BTC"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Address</div>
                                <input
                                  value={getField(blockKey, "address", c.address)}
                                  onChange={(e) => setField(blockKey, "address", e.target.value)}
                                  className="input-obsidian w-full font-mono"
                                />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">Label (optional)</div>
                                <input
                                  value={getField(blockKey, "label", c.label || "")}
                                  onChange={(e) => setField(blockKey, "label", e.target.value)}
                                  className="input-obsidian w-full"
                                  placeholder="Personal wallet"
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button onClick={() => saveCryptoEdits(block.id, blockKey)} variant="accent-solid" className="flex-1">Save</Button>
                                <Button onClick={() => removeCryptoAddress(block.id)} variant="outline">Delete</Button>
                              </div>
                            </div>
                          )
                        }
                      }
                    })()}
                  </BlockRow>
                )
              })}

              {/* + Add block */}
              <button
                onClick={() => setShowAddBlockPicker(true)}
                className="w-full mt-3 py-3 rounded-xl border border-dashed border-white/[0.10] text-[#444] text-sm font-mono hover:border-white/20 hover:text-[#888] transition-all"
              >
                + Add block
              </button>
            </div>

          </div>

          {/* Right: Live Preview */}
          <div className="hidden lg:block lg:sticky lg:top-24 h-fit">
            <ObsidianCard variant="accent" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Live Preview</h3>
                <Link href={`/${profile?.username}`} target="_blank" className="text-sm text-[#00ff88] hover:underline">
                  Open →
                </Link>
              </div>
              
              {/* Phone Frame */}
              <div className="relative mx-auto w-[280px] h-[560px] bg-[#030303] rounded-[32px] border-[6px] border-[#1a1a1a] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 overflow-y-auto scrollbar-hide p-6 pt-8">
                  {/* Profile */}
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.05)] mx-auto mb-3 overflow-hidden border border-[rgba(0,255,136,0.3)]">
                      {profile?.image ? (
                        <img src={profile.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-[#00ff88] to-[#1a0b2e]">
                          {profile?.name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-base text-white">{profile?.name || profile?.username}</div>
                    {profile?.bio && (
                      <div className="text-xs text-[#888888] mt-1">{profile.bio}</div>
                    )}
                    
                    {/* Live Status Preview */}
                    {profile?.liveStatus && profile?.liveMessage && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.2)]">
                        <div className="beeping-dot !w-1.5 !h-1.5" />
                        <span className="text-xs font-bold text-white uppercase">{profile.liveMessage}</span>
                      </div>
                    )}
                  </div>

                  {/* Links Preview */}
                  <div className="space-y-2">
                    {links.filter(l => l.enabled && !l.parentId).slice(0, 5).map(link => (
                      <div
                        key={link.id}
                        className="p-3 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{link.icon || "🔗"}</span>
                          <span className="text-sm font-medium text-white truncate">{link.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Branding */}
                  <div className="text-center mt-8">
                    <div className="text-xs text-[#555555]">Powered by PayTree</div>
                  </div>
                </div>
              </div>
            </ObsidianCard>
          </div>
        </div>
      </div>

      <AddBlockPicker
        open={showAddBlockPicker}
        onClose={() => setShowAddBlockPicker(false)}
        onSelect={handleAddBlock}
      />
    </div>
    </AccentColorProvider>
  )
}

// -------------------- Module helpers --------------------

function moduleIcon(type: string): string {
  const map: Record<string, string> = {
    youtube: "📺",
    youtube_live: "🔴",
    tiktok: "🎬",
    podcast: "🎙️",
    spotify: "🎵",
    apple_music: "🎶",
    twitch: "🎮",
    image: "🖼️",
    rss: "📰",
    social_hub: "🔗",
    quick_tip: "💸",
    video: "🎥",
  }
  return map[type] || "🧩"
}

function moduleLabel(type: string): string {
  const map: Record<string, string> = {
    youtube: "YouTube",
    youtube_live: "YouTube Live",
    tiktok: "TikTok",
    podcast: "Podcast",
    spotify: "Spotify",
    apple_music: "Apple Music",
    twitch: "Twitch",
    image: "Image",
    rss: "RSS",
    social_hub: "Social Hub",
    quick_tip: "Quick Tip",
    video: "Video",
  }
  return map[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

function renderModuleConfigInputs(
  blockId: string,
  type: string,
  cfg: Record<string, string>,
  getField: (id: string, key: string, fallback: string) => string,
  setField: (id: string, key: string, val: string) => void,
) {
  const lbl = (text: string) => (
    <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1.5">{text}</div>
  )
  const text = (key: string, placeholder: string, label: string) => (
    <div>
      {lbl(label)}
      <input
        value={getField(blockId, `config.${key}`, cfg[key] || "")}
        onChange={(e) => setField(blockId, `config.${key}`, e.target.value)}
        className="input-obsidian w-full"
        placeholder={placeholder}
      />
    </div>
  )

  switch (type) {
    case "youtube":
      return text("channelId", "UCxxxxxxxxxxxxxxxxxxxxxx", "Channel ID")
    case "tiktok":
      return (
        <>
          {text("videoUrl", "TikTok video URL", "Video URL")}
          {text("title", "Title (optional)", "Title")}
        </>
      )
    case "podcast":
      return text("rssUrl", "https://feeds.example.com/podcast.xml", "Podcast RSS feed URL")
    case "spotify":
      return text("spotifyUrl", "Spotify track/album/playlist URL", "Spotify URL")
    case "apple_music":
      return text("appleMusicUrl", "Apple Music URL", "Apple Music URL")
    case "image":
      return (
        <>
          {text("imageUrl", "https://...", "Image URL")}
          {text("title", "Title (optional)", "Title")}
          {text("caption", "Caption (optional)", "Caption")}
        </>
      )
    case "twitch":
    case "youtube_live":
      return (
        <>
          {text("channelId", type === "twitch" ? "Twitch username" : "YouTube channel ID", "Channel")}
          {text("channelName", "Display name (optional)", "Display name")}
        </>
      )
    case "social_hub":
      return (
        <>
          {text("instagramUrl", "Instagram URL", "Instagram")}
          {text("twitterUrl", "Twitter URL", "Twitter")}
          {text("youtubeUrl", "YouTube URL", "YouTube")}
          {text("tiktokUrl", "TikTok URL", "TikTok")}
        </>
      )
    case "rss":
      return text("feedUrl", "RSS feed URL", "Feed URL")
    case "quick_tip":
      return (
        <>
          {text("amount", "5", "Default amount")}
          {text("currency", "USD", "Currency")}
        </>
      )
    default:
      return null
  }
}

// -------------------- BlockRow --------------------

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

function BlockRow({
  icon,
  label,
  badge,
  enabled,
  expanded,
  onToggle,
  onEnableToggle,
  children,
}: BlockRowProps) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
      <div
        className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-white/[0.01] transition-colors"
        onClick={onToggle}
      >
        <span className="text-[#444] text-sm cursor-grab select-none" onClick={(e) => e.stopPropagation()}>⠿</span>
        <span className="text-lg w-7 flex-shrink-0 text-center">{icon}</span>
        <span className="flex-1 text-sm text-[#e0e0e0] font-medium truncate">{label}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#444] bg-white/[0.04] px-2 py-0.5 rounded-md">
          {badge}
        </span>
        {onEnableToggle !== undefined && enabled !== undefined && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEnableToggle(!enabled)
            }}
            className={`w-9 h-5 rounded-full transition-all relative ${
              enabled ? "bg-[rgba(0,255,136,0.2)]" : "bg-white/10"
            }`}
            aria-label={enabled ? "Disable" : "Enable"}
          >
            <motion.div
              className={`absolute top-0.5 w-4 h-4 rounded-full ${enabled ? "bg-[#00ff88]" : "bg-white"}`}
              animate={{ left: enabled ? "calc(100% - 18px)" : "2px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        )}
        <motion.svg
          className="w-4 h-4 text-[#444] flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </motion.svg>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/[0.05]"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// -------------------- AddBlockPicker --------------------

interface AddBlockPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (type: string) => void
}

function AddBlockPicker({ open, onClose, onSelect }: AddBlockPickerProps) {
  if (!open) return null

  const groups: { title: string; items: { id: string; icon: string; label: string }[] }[] = [
    {
      title: "Links & Navigation",
      items: [
        { id: "link", icon: "🔗", label: "Link" },
        { id: "portal", icon: "📁", label: "Portal" },
      ],
    },
    {
      title: "Media & Social",
      items: [
        { id: "module:youtube", icon: "📺", label: "YouTube" },
        { id: "module:spotify", icon: "🎵", label: "Spotify" },
        { id: "module:podcast", icon: "🎙️", label: "Podcast" },
        { id: "module:twitch", icon: "🎮", label: "Twitch" },
        { id: "module:tiktok", icon: "🎬", label: "TikTok" },
        { id: "module:apple_music", icon: "🎶", label: "Apple Music" },
        { id: "module:rss", icon: "📰", label: "RSS" },
        { id: "module:image", icon: "🖼️", label: "Image" },
      ],
    },
    {
      title: "Monetize",
      items: [
        { id: "product", icon: "🛒", label: "Product" },
        { id: "vault", icon: "🔒", label: "Vault" },
        { id: "crypto", icon: "₿", label: "Crypto" },
        { id: "module:quick_tip", icon: "💸", label: "Quick Tip" },
      ],
    },
    {
      title: "Live & Drops",
      items: [
        { id: "drop", icon: "🎬", label: "Drop" },
        { id: "live", icon: "📡", label: "Live Status" },
      ],
    },
    {
      title: "Display",
      items: [
        { id: "stats", icon: "📊", label: "Stats" },
        { id: "module:social_hub", icon: "🔗", label: "Social Hub" },
        { id: "social", icon: "🌐", label: "Social Link" },
      ],
    },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <h3 className="text-sm font-mono uppercase tracking-widest text-white/60">Add a block</h3>
            <button
              onClick={onClose}
              className="text-[#666] hover:text-white transition-colors text-lg"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="p-5 space-y-5">
            {groups.map((group) => (
              <div key={group.title}>
                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-2">
                  {group.title}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item.id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-[#00ff88]/30 hover:bg-[#00ff88]/[0.05] transition-all text-left"
                    >
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <span className="text-sm text-[#e0e0e0] truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
