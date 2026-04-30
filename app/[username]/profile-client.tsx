"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ObsidianCard, GlassBrick } from "@/components/ui/obsidian-card"
import { LiveStatusPill } from "@/components/ui/live-status-pill"
import { CryptoVaultPortal } from "@/components/ui/crypto-vault"
import { SocialIcon } from "@/components/social-icon"
import { VaultPortal } from "@/components/ui/vault-portal"
import { BentoGrid, type BentoModule } from "@/components/ui/bento-modules"
import { useApplyAccentColor } from "@/contexts/accent-color-context"

interface PortalLink {
  id: string
  title: string
  url?: string
  icon?: string
  isFolder: boolean
  isStarred?: boolean
  type?: string
  children: PortalLink[]
}

interface ShopProduct {
  id: string
  title: string
  description?: string
  price: number
  currency: string
  imageUrl?: string
  downloadUrl?: string
}

interface SocialLink {
  id: string
  platform: string
  url: string
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
}

interface User {
  id: string
  name: string | null
  username: string
  bio: string | null
  image: string | null
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

interface ProfileClientProps {
  user: User
  links: PortalLink[]
  socialLinks: SocialLink[]
  cryptoAddresses: CryptoAddress[]
  vaultItems: VaultItem[]
  products?: ShopProduct[]
  modules: BentoModule[]
  socialIconPosition: string
  isPublished: boolean
  isLive?: boolean
}

export function ProfileClient({
  user,
  links,
  socialLinks,
  cryptoAddresses,
  vaultItems,
  products = [],
  modules,
  socialIconPosition,
  isPublished,
  isLive = false,
}: ProfileClientProps) {
  const [openPortal, setOpenPortal] = useState<string | null>(null)
  const [portalStack, setPortalStack] = useState<PortalLink[]>([])
  
  // Apply the user's custom accent color
  useApplyAccentColor(user.accentColor)
  
  // Track click
  const trackClick = async (linkId: string, isPortalOpen: boolean = false) => {
    try {
      const data = JSON.stringify({ linkId, isPortalOpen, isLiveClick: isLive })
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track-click", data)
      } else {
        fetch("/api/track-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: data,
          keepalive: true,
        })
      }
    } catch (error) {
      // Silently fail
    }
  }
  
  const handleLinkClick = (link: PortalLink) => {
    if (link.isFolder && link.children.length > 0) {
      setPortalStack([...portalStack, link])
      setOpenPortal(link.id)
      trackClick(link.id, true)
    } else if (link.url) {
      trackClick(link.id, false)
      window.open(link.url, '_blank')
    }
  }
  
  const handleBack = () => {
    if (portalStack.length > 0) {
      const newStack = [...portalStack]
      newStack.pop()
      setPortalStack(newStack)
      setOpenPortal(newStack.length > 0 ? newStack[newStack.length - 1].id : null)
    }
  }

  const handleProductCheckout = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Failed to start checkout")
      }
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Checkout failed")
    }
  }
  
  // Get current links to display
  const getCurrentLinks = () => {
    if (openPortal && portalStack.length > 0) {
      return portalStack[portalStack.length - 1].children
    }
    return links.filter(l => !l.isFolder || (l.isFolder && l.children.length > 0))
  }
  
  const topLevelFolders = links.filter(l => l.isFolder && l.children.length > 0)
  const topLevelLinks = links.filter(l => !l.isFolder)
  const showStats = user.statsStudents > 0 || user.statsWinRate > 0 || user.statsFollowers > 0

  return (
    <>
      {/* Profile Header Card */}
      <ObsidianCard 
        variant="accent" 
        enableTilt={true}
        className="mb-6 p-6 sm:p-8"
      >
        {/* Profile Image */}
        <div className="text-center">
          <div className="pfp-xl mx-auto mb-4 border-2 border-[rgba(0,255,136,0.3)] shadow-[0_0_30px_rgba(0,255,136,0.2)]">
            {user.image ? (
              <img src={user.image} alt={user.name || user.username} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#00ff88] to-[#1a0b2e] flex items-center justify-center text-4xl font-bold">
                {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Verified Badge */}
          {isPublished && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)] mb-3">
              <svg className="w-4 h-4 text-[#00ff88]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span className="text-xs font-bold text-[#00ff88]">VERIFIED</span>
            </div>
          )}
          
          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {user.name || user.username}
          </h1>
          
          {/* Username */}
          {user.name && (
            <p className="text-[#888888] mb-4">@{user.username}</p>
          )}
          
          {/* Bio */}
          {user.bio && (
            <p className="text-[#888888] text-sm sm:text-base leading-relaxed max-w-sm mx-auto mb-4">
              {user.bio}
            </p>
          )}
          
          {/* Live Status */}
          {user.liveStatus && user.liveMessage && (
            <div className="flex justify-center">
              <LiveStatusPill message={user.liveMessage} size="md" />
            </div>
          )}
        </div>
        
        {/* Social Icons - Top */}
        {socialIconPosition === "top" && socialLinks.length > 0 && (
          <div className="flex justify-center gap-3 mt-6 pt-6 border-t border-[rgba(255,255,255,0.1)]">
            {socialLinks.map((social) => (
              <SocialIcon
                key={social.id}
                platform={social.platform}
                url={social.url}
                size={40}
              />
            ))}
          </div>
        )}
      </ObsidianCard>

      {/* Bento Stats */}
      {showStats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {user.statsStudents > 0 && (
            <GlassBrick className="!p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {formatNumber(user.statsStudents)}
              </div>
              <div className="label mt-1">{user.statsLabel1 || "Students"}</div>
            </GlassBrick>
          )}
          {user.statsWinRate > 0 && (
            <GlassBrick className="!p-4 text-center">
              <div className={`text-2xl sm:text-3xl font-bold ${user.statsWinRate >= 90 ? "text-[#00ff88]" : "text-white"}`}>
                {user.statsWinRate}%
              </div>
              <div className="label mt-1">{user.statsLabel2 || "Win Rate"}</div>
            </GlassBrick>
          )}
          {user.statsFollowers > 0 && (
            <GlassBrick className={`!p-4 text-center ${user.statsStudents > 0 && user.statsWinRate > 0 ? "span-2" : ""}`}>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {formatNumber(user.statsFollowers)}
              </div>
              <div className="label mt-1">{user.statsLabel3 || "Followers"}</div>
            </GlassBrick>
          )}
        </div>
      )}

      {/* Bento Modules */}
      {modules && modules.length > 0 && (
        <div className="mb-6">
          <BentoGrid
            modules={modules}
            userId={user.id}
            onVaultUnlock={async (vaultItemId, email) => {
              try {
                const res = await fetch("/api/vault/unlock", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ vaultItemId, email, userId: user.id }),
                })
                if (!res.ok) throw new Error("Failed to unlock")
              } catch (error) {
                console.error("Vault unlock error:", error)
              }
            }}
          />
        </div>
      )}

      {/* Deep Portal Links */}
      <AnimatePresence mode="wait">
        {openPortal ? (
          <motion.div
            key={openPortal}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4 mb-6"
          >
            {/* Back Button */}
            <button onClick={handleBack} className="back-btn">
              ← BACK TO {portalStack.length > 1 ? portalStack[portalStack.length - 2].title.toUpperCase() : "DASHBOARD"}
            </button>
            
            {/* Portal Title */}
            <div className="text-center py-2">
              <h2 className="text-xl font-bold text-white">
                {portalStack[portalStack.length - 1]?.icon} {portalStack[portalStack.length - 1]?.title}
              </h2>
            </div>
            
            {/* Nested Links */}
            <div className="bento-grid">
              {getCurrentLinks().map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={link.isFolder ? "span-2" : ""}
                >
                  <GlassBrick onClick={() => handleLinkClick(link)} span={link.isFolder ? 2 : 1}>
                    <div className="label">{link.isFolder ? "Portal" : "Link"}</div>
                    <div className="title flex items-center justify-between">
                      <span>{link.icon} {link.title}</span>
                      {link.isFolder && (
                        <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                    {link.isFolder && link.children.length > 0 && (
                      <div className="text-sm text-[#888888] mt-2">{link.children.length} items inside</div>
                    )}
                  </GlassBrick>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bento-grid mb-6"
          >
            {/* Folders First */}
            {topLevelFolders.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="span-2"
              >
                <GlassBrick onClick={() => handleLinkClick(link)} span={2}>
                  <div className="label">Portal</div>
                  <div className="title flex items-center justify-between">
                    <span>{link.icon} {link.title}</span>
                    <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="text-sm text-[#888888] mt-2">{link.children.length} items inside</div>
                </GlassBrick>
              </motion.div>
            ))}
            
            {/* Crypto Vault */}
            {cryptoAddresses.length > 0 && (
              <CryptoVaultPortal 
                addresses={cryptoAddresses} 
                onCopy={(addr) => trackClick(addr.id, false)}
              />
            )}
            
            {/* Regular Links (starred first) */}
            {[...topLevelLinks].sort((a, b) => (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0)).map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (topLevelFolders.length + index) * 0.1 }}
              >
                <GlassBrick onClick={() => handleLinkClick(link)}>
                  <div className="label flex items-center gap-1.5">
                    {link.isStarred && <span className="text-yellow-400 text-xs">★</span>}
                    <span>{link.type && link.type !== "generic" ? link.type.charAt(0).toUpperCase() + link.type.slice(1) : "Link"}</span>
                  </div>
                  <div className="title">{link.icon} {link.title}</div>
                </GlassBrick>
              </motion.div>
            ))}

            {/* Shop Products */}
            {products.length > 0 && (
              <>
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (topLevelFolders.length + topLevelLinks.length + index) * 0.1 }}
                  >
                    <GlassBrick onClick={() => handleProductCheckout(product.id)}>
                      {product.imageUrl && (
                        <div className="w-full h-24 rounded-lg overflow-hidden mb-3 -mt-1">
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="label">Shop</div>
                      <div className="title text-base">{product.title}</div>
                      {product.description && (
                        <p className="text-xs text-[#888888] mt-1 line-clamp-2">{product.description}</p>
                      )}
                      <div className="mt-2 text-[#00ff88] font-bold text-sm">
                        ${(product.price / 100).toFixed(2)} {product.currency.toUpperCase()}
                      </div>
                    </GlassBrick>
                  </motion.div>
                ))}
              </>
            )}
            
            {/* Vault Items */}
            {vaultItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (topLevelFolders.length + topLevelLinks.length + index) * 0.1 }}
                className="span-2"
              >
                <VaultPortal
                  item={item}
                  ownerId={user.id}
                  onUnlock={(email) => {
                    // Track vault unlock
                    trackClick(item.id, false)
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {links.length === 0 && cryptoAddresses.length === 0 && vaultItems.length === 0 && (
        <GlassBrick className="text-center py-12">
          <div className="text-5xl mb-4 opacity-40">🔗</div>
          <p className="text-lg font-bold text-white">No links yet</p>
          <p className="text-sm text-[#888888] mt-2">This terminal is just getting started</p>
        </GlassBrick>
      )}

      {/* Social Icons - Bottom */}
      {socialIconPosition === "bottom" && socialLinks.length > 0 && (
        <div className="flex justify-center gap-3 mb-8">
          {socialLinks.map((social) => (
            <SocialIcon
              key={social.id}
              platform={social.platform}
              url={social.url}
              size={40}
            />
          ))}
        </div>
      )}

      {/* Branding */}
      <div className="text-center">
        <a 
          href="/" 
          className="inline-flex items-center gap-3 px-6 py-3 glass-brick rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-all group"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_15px_rgba(0,255,136,0.3)] group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm text-white">Create your PayTree</span>
          <svg className="w-4 h-4 text-[#00ff88] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        
        <p className="text-xs text-[#555555] mt-6">
          0% commissions by PayTree. Third-party fees may apply.
        </p>
      </div>
    </>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}
