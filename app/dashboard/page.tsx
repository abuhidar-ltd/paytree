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
import { UpgradeBadge } from "@/components/upgrade-badge"
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
  isFolder: boolean
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"links" | "portals" | "modules" | "products" | "live" | "stats" | "crypto" | "vault" | "style">("links")

  // Forms
  const [newLink, setNewLink] = useState({ title: "", url: "", icon: "💳" })
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [newSocialLink, setNewSocialLink] = useState({ platform: "instagram", url: "" })
  const [isAddingSocial, setIsAddingSocial] = useState(false)

  const isPro = profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trial' || profile?.subscriptionStatus === 'canceling'

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login")
    } else if (isLoaded && user) {
      loadData()
    }
  }, [isLoaded, user, router])

  const loadData = async () => {
    try {
      const [profileRes, linksRes, socialRes, cryptoRes, vaultRes, modulesRes, productsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/links"),
        fetch("/api/social-links"),
        fetch("/api/crypto-addresses"),
        fetch("/api/vault/items"),
        fetch("/api/modules"),
        fetch("/api/products"),
      ])

      if (profileRes.ok) setProfile(await profileRes.json())
      if (linksRes.ok) setLinks(await linksRes.json())
      if (socialRes.ok) setSocialLinks(await socialRes.json())
      if (cryptoRes.ok) setCryptoAddresses(await cryptoRes.json())
      if (vaultRes.ok) setVaultItems(await vaultRes.json())
      if (modulesRes.ok) setModules(await modulesRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
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
  const folders = links.filter(l => l.isFolder)
  const regularLinks = links.filter(l => !l.isFolder && !l.parentId)

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

      {/* Header */}
      <header className="sticky top-0 left-0 right-0 z-[100] border-b border-[rgba(255,255,255,0.05)] bg-[rgba(3,3,3,0.8)] backdrop-blur-xl safe-top">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_20px_rgba(0,255,136,0.3)]" />
            <span className="text-white hidden sm:inline kinetic-shimmer">PayTree</span>
          </Link>
          <nav className="flex items-center gap-4">
            <UpgradeBadge isPro={isPro} compact />
            <Link href="/dashboard/analytics">
              <Button variant="ghost" size="sm" className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </Link>
            <Link href={`/${profile?.username}`} target="_blank">
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="hidden sm:inline">View Live</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Button>
            </Link>
          </nav>
        </div>
      </header>

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

            {/* Feature Tabs */}
            <div className="obsidian-card-static p-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {[
                { id: "links", label: "Links", icon: "🔗" },
                { id: "portals", label: "Portals", icon: "🚪" },
                { id: "modules", label: "Modules", icon: "🧩" },
                { id: "products", label: "Products", icon: "🛒" },
                { id: "vault", label: "Vault", icon: "🔒" },
                { id: "live", label: "Live", icon: "📡" },
                { id: "stats", label: "Stats", icon: "📊" },
                { id: "crypto", label: "Crypto", icon: "₿" },
                { id: "style", label: "Style", icon: "🎨" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                    ${activeTab === tab.id 
                      ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.3)]" 
                      : "text-[#888888] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Links Tab */}
                {activeTab === "links" && (
                  <div className="space-y-4">
                    {/* Add Link Button */}
                    {!isAddingLink ? (
                      <button 
                        onClick={() => setIsAddingLink(true)}
                        disabled={profile?.subscriptionStatus === 'free' && links.length >= 2}
                        className="w-full glass-brick text-center group disabled:opacity-50 disabled:cursor-not-allowed py-8"
                      >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">➕</div>
                        <div className="font-bold text-white">Add New Link</div>
                        <div className="text-sm text-[#888888] mt-1">
                          {profile?.subscriptionStatus === 'free' && links.length >= 2 
                            ? `Free: ${links.length}/2 links`
                            : "Any payment URL"
                          }
                        </div>
                      </button>
                    ) : (
                      <ObsidianCard variant="accent" className="p-6">
                        <h3 className="font-bold text-xl mb-4 text-white">Add Link</h3>
                        <form onSubmit={addLink} className="space-y-4">
                          <div className="grid grid-cols-[80px,1fr] gap-3">
                            <input
                              value={newLink.icon}
                              onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                              className="input-obsidian text-center text-xl"
                              placeholder="💳"
                            />
                            <input
                              value={newLink.title}
                              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                              className="input-obsidian"
                              placeholder="Title"
                              autoFocus
                            />
                          </div>
                          <input
                            value={newLink.url}
                            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                            className="input-obsidian w-full"
                            placeholder="https://..."
                          />
                          <div className="flex gap-3">
                            <Button type="submit" variant="accent-solid" className="flex-1" disabled={!newLink.title || !newLink.url || saving}>
                              {saving ? "Adding..." : "Add Link"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setIsAddingLink(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </ObsidianCard>
                    )}

                    {/* Links List */}
                    {regularLinks.map((link) => (
                      <GlassBrick key={link.id} className="flex items-center gap-4 !p-4">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-xl">
                          {link.icon || "🔗"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white truncate">{link.title}</div>
                          <div className="text-sm text-[#888888] truncate">{link.url}</div>
                        </div>
                        {link._count?.clicks !== undefined && (
                          <div className="px-3 py-1 rounded-full bg-[rgba(0,255,136,0.1)] text-[#00ff88] text-sm font-bold">
                            {link._count.clicks}
                          </div>
                        )}
                        <button
                          onClick={() => toggleLink(link.id, !link.enabled)}
                          className={`w-12 h-7 rounded-full transition-all ${
                            link.enabled 
                              ? "bg-[rgba(0,255,136,0.2)] border-[rgba(0,255,136,0.5)]" 
                              : "bg-[rgba(255,255,255,0.1)]"
                          } border relative`}
                        >
                          <motion.div
                            className={`absolute top-0.5 w-6 h-6 rounded-full ${link.enabled ? "bg-[#00ff88]" : "bg-white"}`}
                            animate={{ left: link.enabled ? "calc(100% - 26px)" : "2px" }}
                          />
                        </button>
                        <button
                          onClick={() => deleteLink(link.id)}
                          className="p-2 text-[#888888] hover:text-red-500 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </GlassBrick>
                    ))}

                    {regularLinks.length === 0 && !isAddingLink && (
                      <GlassBrick className="text-center py-12">
                        <div className="text-5xl mb-4 opacity-40">🔗</div>
                        <p className="font-bold text-white">No links yet</p>
                        <p className="text-sm text-[#888888] mt-2">Add your first payment link</p>
                      </GlassBrick>
                    )}

                    {/* Social Links */}
                    <div className="pt-6 border-t border-[rgba(255,255,255,0.05)]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white">Social Links</h3>
                        {!isAddingSocial && (
                          <button
                            onClick={() => setIsAddingSocial(true)}
                            className="text-sm text-[#00ff88] hover:underline"
                          >
                            + Add
                          </button>
                        )}
                      </div>

                      {isAddingSocial && (
                        <form onSubmit={addSocialLink} className="obsidian-card-static p-4 space-y-4 mb-4">
                          <select
                            value={newSocialLink.platform}
                            onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
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
                          <input
                            value={newSocialLink.url}
                            onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                            className="input-obsidian w-full"
                            placeholder="https://..."
                          />
                          <div className="flex gap-3">
                            <Button type="submit" variant="accent" className="flex-1" disabled={!newSocialLink.url || saving}>
                              Add
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setIsAddingSocial(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}

                      <div className="space-y-3">
                        {socialLinks.map(social => (
                          <div key={social.id} className="flex items-center gap-4 p-3 rounded-xl bg-[rgba(255,255,255,0.02)]">
                            <div className="w-10 h-10 rounded-lg bg-[rgba(0,255,136,0.1)] flex items-center justify-center capitalize text-sm font-bold text-[#00ff88]">
                              {social.platform.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="capitalize font-medium text-white">{social.platform}</div>
                              <div className="text-sm text-[#888888] truncate">{social.url}</div>
                            </div>
                            <button
                              onClick={() => deleteSocialLink(social.id)}
                              className="p-2 text-[#888888] hover:text-red-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Portals Tab */}
                {activeTab === "portals" && (
                  <div className="space-y-4">
                    <PortalBuilder
                      onCreateFolder={createFolder}
                      onCreateLink={createNestedLink}
                      folders={folders.map(f => ({
                        id: f.id,
                        title: f.title,
                        icon: f.icon || undefined,
                        isFolder: true,
                        children: []
                      }))}
                    />
                    
                    {folders.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-white">Your Portals</h3>
                        {folders.map(folder => (
                          <GlassBrick key={folder.id} className="flex items-center gap-4 !p-4">
                            <div className="w-12 h-12 rounded-xl bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-xl">
                              {folder.icon || "📁"}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-white">{folder.title}</div>
                              <div className="text-sm text-[#888888]">
                                {links.filter(l => l.parentId === folder.id).length} items inside
                              </div>
                            </div>
                            <button
                              onClick={() => deleteLink(folder.id)}
                              className="p-2 text-[#888888] hover:text-red-500"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </GlassBrick>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Modules Tab */}
                {activeTab === "modules" && (
                  <ModuleEditor
                    modules={modules as any}
                    onModulesChange={(newModules) => setModules(newModules as BentoModule[])}
                    isPro={isPro}
                  />
                )}

                {/* Products Tab */}
                {activeTab === "products" && (
                  <ProductManager
                    products={products}
                    onProductsChange={setProducts}
                    isPro={isPro}
                  />
                )}

                {/* Live Status Tab */}
                {activeTab === "live" && profile && (
                  <LiveStatusToggle
                    isLive={profile.liveStatus}
                    message={profile.liveMessage || ""}
                    onToggle={toggleLiveStatus}
                    onMessageChange={updateLiveMessage}
                  />
                )}

                {/* Stats Tab */}
                {activeTab === "stats" && profile && (
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
                )}

                {/* Crypto Tab */}
                {activeTab === "crypto" && (
                  <CryptoManager
                    addresses={cryptoAddresses}
                    onAdd={addCryptoAddress}
                    onRemove={removeCryptoAddress}
                    onToggle={toggleCryptoAddress}
                  />
                )}

                {/* Vault Tab */}
                {activeTab === "vault" && (
                  <div className="space-y-6">
                    <VaultManager
                      vaultItems={vaultItems.map(v => ({
                        id: v.id,
                        title: v.title,
                        icon: v.icon,
                        url: v.url,
                        downloadUrl: v.downloadUrl,
                        downloadName: v.downloadName,
                        vaultContent: v.vaultContent,
                      }))}
                      onCreateItem={createVaultItem}
                      onDeleteItem={deleteVaultItem}
                      onToggleLock={toggleVaultLock}
                    />
                    
                    {/* Link to Analytics */}
                    <Link href="/dashboard/analytics" className="block">
                      <GlassBrick className="flex items-center gap-4 !p-5 hover:border-[rgba(0,255,136,0.3)] transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-xl">
                          📊
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-white group-hover:text-[#00ff88] transition-colors">View Analytics</div>
                          <div className="text-sm text-[#888888]">
                            {vaultItems.reduce((sum, v) => sum + (v._count?.vaultUnlocks || 0), 0)} emails captured from vault
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-[#888888] group-hover:text-[#00ff88] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </GlassBrick>
                    </Link>
                  </div>
                )}

                {/* Style Tab */}
                {activeTab === "style" && (
                  <div className="space-y-6">
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
                )}
              </motion.div>
            </AnimatePresence>
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
    </div>
    </AccentColorProvider>
  )
}
