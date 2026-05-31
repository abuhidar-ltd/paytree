"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ObsidianCard, GlassBrick } from "@/components/ui/obsidian-card"
import { LiveStatusPill } from "@/components/ui/live-status-pill"
import { CryptoVaultPortal } from "@/components/ui/crypto-vault"
import { SocialIcon } from "@/components/social-icon"
import { VaultPortal } from "@/components/ui/vault-portal"
import { LinkCard3D } from "@/components/ui/link-card-3d"
import { BentoGrid, type BentoModule } from "@/components/ui/bento-modules"
import { useApplyAccentColor } from "@/contexts/accent-color-context"
import { AiAgentChat } from "@/components/ui/ai-agent-chat"
import { SocialProofToast } from "@/components/ui/social-proof-toast"
import { BlockRenderer } from "@/components/ui/block-renderer"
import { DropCard, type Drop } from "@/components/ui/drop-card"

interface PortalLink {
  id: string
  title: string
  url?: string
  icon?: string
  isFolder: boolean
  isStarred?: boolean
  type?: string
  cardStyle?: string
  cardSize?: string
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

interface BlockChild {
  id: string
  type: string
  title: string
  url?: string | null
  description?: string | null
  thumbnail?: string | null
  style?: string
  size?: string
  lockType?: string
  lockValue?: string | null
  config?: Record<string, unknown>
}

interface Block {
  id: string
  type: string
  title: string
  url?: string | null
  description?: string | null
  thumbnail?: string | null
  style?: string
  size?: string
  layout?: string
  lockType?: string
  lockValue?: string | null
  config?: Record<string, unknown>
  children?: BlockChild[]
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
  heroStyle?: string | null
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
  buttonStyle?: string
  drops?: Drop[]
  blocks?: Block[]
  showAiAgent?: boolean
  accentColor?: string
  creatorStripeReady?: boolean
  removeBranding?: boolean
  isPreview?: boolean
  isOwner?: boolean
}

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
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
  buttonStyle,
  drops = [],
  blocks = [],
  showAiAgent = false,
  accentColor,
  creatorStripeReady = false,
  removeBranding = false,
  isPreview = false,
  isOwner = false,
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
      window.open(link.url, "_blank")
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={isPreview ? "pointer-events-none" : undefined}
    >
      {/* Profile Header */}
      {(user.heroStyle ?? "classic") === "cinematic" ? (
        <motion.div
          className="mb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg">
            {user.name || user.username}
          </h1>
          {user.name && <p className="text-[#888888] mb-3">@{user.username}</p>}
          {user.bio && (
            <p className="text-white/80 text-sm leading-relaxed max-w-sm mx-auto mb-4 drop-shadow">
              {user.bio}
            </p>
          )}
          {user.liveStatus && user.liveMessage && (
            <div className="flex justify-center mb-4">
              <LiveStatusPill message={user.liveMessage} size="md" />
            </div>
          )}
          {socialIconPosition === "top" && socialLinks.length > 0 && (
            <div className="flex justify-center gap-3 mt-4">
              {socialLinks.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                >
                  <SocialIcon platform={s.platform} url={s.url} size={40} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ObsidianCard
            variant="accent"
            enableTilt={true}
            className="mb-6 p-6 sm:p-8"
          >
            {/* Profile Image */}
            <div className="text-center">
              <motion.div
                className="pfp-xl mx-auto mb-4 rounded-full overflow-hidden shadow-[0_0_30px_rgba(0,255,136,0.2)]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                {user.image ? (
                  <img src={user.image} alt={user.name || user.username} className="w-full h-full object-cover rounded-full overflow-hidden" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#00ff88] to-[#1a0b2e] flex items-center justify-center text-4xl font-bold">
                    {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.div>

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
              <motion.h1
                className="text-2xl sm:text-3xl font-bold text-white mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
              >
                {user.name || user.username}
              </motion.h1>

              {/* Username */}
              {user.name && (
                <p className="text-[#888888] mb-4">@{user.username}</p>
              )}

              {/* Bio */}
              {user.bio && (
                <motion.p
                  className="text-[#888888] text-sm sm:text-base leading-relaxed max-w-sm mx-auto mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                >
                  {user.bio}
                </motion.p>
              )}

              {/* Live Status */}
              {user.liveStatus && user.liveMessage && (
                <div className="flex justify-center">
                  <LiveStatusPill message={user.liveMessage} size="md" />
                </div>
              )}
            </div>

            {/* Social Icons - Top */}
            {socialIconPosition === "top" && (socialLinks.length > 0 || blocks.some(b => b.type === "social_link")) && (
              <div className="flex justify-center gap-3 mt-6 pt-6 border-t border-[rgba(255,255,255,0.1)]">
                {socialLinks.map((social, i) => (
                  <motion.div
                    key={social.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <SocialIcon platform={social.platform} url={social.url} size={40} />
                  </motion.div>
                ))}
              </div>
            )}
          </ObsidianCard>
        </motion.div>
      )}

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
            <GlassBrick className={`!p-4 text-center ${user.statsStudents > 0 && user.statsWinRate > 0 ? "col-span-2" : ""}`}>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {formatNumber(user.statsFollowers)}
              </div>
              <div className="label mt-1">{user.statsLabel3 || "Followers"}</div>
            </GlassBrick>
          )}
        </div>
      )}

      {/* Bento Modules */}
      {(!blocks || blocks.length === 0) && modules && modules.length > 0 && (
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
      {(!blocks || blocks.length === 0) && (
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
              ← BACK TO {portalStack.length > 1 ? portalStack[portalStack.length - 2].title.toUpperCase() : "HOME"}
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
            {/* Drops */}
            {drops.length > 0 && (
              <div className="span-2 flex flex-col gap-3">
                {drops.map((drop) => (
                  <DropCard key={drop.id} drop={drop} />
                ))}
              </div>
            )}

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
            <div className="flex flex-wrap gap-3 span-2">
              {[...topLevelLinks].sort((a, b) => (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0)).map((link, index) => (
                <motion.div
                  key={link.id}
                  className={link.cardSize === "half" ? "w-[calc(50%-6px)]" : "w-full"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (topLevelFolders.length + index) * 0.1 }}
                >
                  <LinkCard3D
                    title={link.title}
                    url={link.url}
                    icon={link.icon}
                    variant={(link.cardStyle && link.cardStyle !== "default" ? link.cardStyle : (buttonStyle || "glass")) as any}
                    onTrackClick={() => trackClick(link.id, false)}
                  />
                </motion.div>
              ))}
            </div>

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
                    <GlassBrick onClick={creatorStripeReady ? () => handleProductCheckout(product.id) : undefined}>
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
                      {creatorStripeReady ? (
                        <div className="mt-2 text-[#00ff88] font-bold text-sm">
                          ${(product.price / 100).toFixed(2)} {product.currency.toUpperCase()}
                        </div>
                      ) : (
                        <div className="mt-2 text-[#444] font-mono text-xs">
                          Payments not set up
                        </div>
                      )}
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
                    trackClick(item.id, false)
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      )}

      {/* Empty State */}
      {(!blocks || blocks.length === 0) && links.length === 0 && (
        <GlassBrick className="text-center py-12">
          <div className="text-5xl mb-4 opacity-40">🔗</div>
          <p className="text-lg font-bold text-white">No links yet</p>
          <p className="text-sm text-[#888888] mt-2">This terminal is just getting started</p>
        </GlassBrick>
      )}

      {/* Social Icons - Bottom */}
      {socialIconPosition === "bottom" && (socialLinks.length > 0 || blocks.some(b => b.type === "social_link")) && (
        <div className="flex justify-center gap-3 mb-8">
          {socialLinks.map((social, i) => (
            <motion.div
              key={social.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
            >
              <SocialIcon platform={social.platform} url={social.url} size={40} />
            </motion.div>
          ))}
          {blocks.filter(b => b.type === "social_link").map((b, i) => {
            const bCfg = (b.config || {}) as Record<string, any>
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (socialLinks.length + i) * 0.05, type: "spring", stiffness: 260, damping: 20 }}
              >
                <SocialIcon platform={bCfg.platform || b.title} url={b.url || ""} size={40} />
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Blocks (unified renderer) — staggered scroll entrance */}
      {blocks.filter(b => b.type !== "social_link").length > 0 && (
        <motion.div
          className="flex flex-col gap-3 w-full mb-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {renderBlocksWithSizing(
            blocks.filter(b => b.type !== "social_link"),
            {
              userId: user.id,
              accentColor: accentColor || "#00ff88",
              buttonStyle: buttonStyle || "glass",
              username: user.username,
              creatorStripeReady,
            }
          )}
        </motion.div>
      )}

      {/* Branding */}
      {!removeBranding && !isOwner && !isPreview && (
        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-3 px-6 py-3 glass-brick rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-all group"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_15px_rgba(0,255,136,0.3)] group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm text-white">Create your Paytree</span>
            <svg className="w-4 h-4 text-[#00ff88] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <p className="text-xs text-[#555555] mt-6">
            0% commissions by Paytree. Third-party fees may apply.
          </p>
        </div>
      )}

      {/* Social proof notifications */}
      <SocialProofToast username={user.username} />

      {/* AI Agent chat */}
      {showAiAgent && !isPreview && (
        <AiAgentChat
          username={user.username}
          creatorName={user.name || user.username}
          accentColor={accentColor || user.accentColor || "#00ff88"}
        />
      )}
    </motion.div>
  )
}

function renderBlocksWithSizing(
  blocks: Block[],
  commonProps: { userId: string; accentColor: string; buttonStyle: string; username: string; creatorStripeReady?: boolean }
) {
  const result: React.ReactNode[] = []
  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]
    if (block.size === "half") {
      const next = blocks[i + 1]
      if (next && next.size === "half") {
        result.push(
          <motion.div key={`pair-${i}`} variants={itemVariants} className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="min-w-0 overflow-hidden"><BlockRenderer block={block} {...commonProps} /></div>
            <div className="min-w-0 overflow-hidden"><BlockRenderer block={next} {...commonProps} /></div>
          </motion.div>
        )
        i += 2
        continue
      }
    }
    result.push(
      <motion.div key={block.id} variants={itemVariants}>
        <BlockRenderer block={block} {...commonProps} />
      </motion.div>
    )
    i++
  }
  return result
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}
