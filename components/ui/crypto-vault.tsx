"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassBrick } from "./obsidian-card"

interface CryptoAddress {
  id: string
  currency: string
  address: string
  label?: string
  enabled: boolean
}

// Currency icons and colors
const CRYPTO_CONFIG: Record<string, { icon: string; color: string; name: string }> = {
  BTC: { icon: "₿", color: "#F7931A", name: "Bitcoin" },
  ETH: { icon: "Ξ", color: "#627EEA", name: "Ethereum" },
  SOL: { icon: "◎", color: "#9945FF", name: "Solana" },
  USDT: { icon: "₮", color: "#26A17B", name: "Tether" },
  USDC: { icon: "$", color: "#2775CA", name: "USD Coin" },
  BNB: { icon: "◆", color: "#F3BA2F", name: "BNB" },
  XRP: { icon: "✕", color: "#23292F", name: "Ripple" },
  ADA: { icon: "₳", color: "#0033AD", name: "Cardano" },
  DOGE: { icon: "Ð", color: "#C2A633", name: "Dogecoin" },
  MATIC: { icon: "⬡", color: "#8247E5", name: "Polygon" },
}

interface CryptoVaultProps {
  addresses: CryptoAddress[]
  onCopy?: (address: CryptoAddress) => void
  className?: string
}

export function CryptoVault({ addresses, onCopy, className = "" }: CryptoVaultProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const handleCopy = async (addr: CryptoAddress) => {
    try {
      await navigator.clipboard.writeText(addr.address)
      setCopiedId(addr.id)
      onCopy?.(addr)
      
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }
  
  const enabledAddresses = addresses.filter(a => a.enabled)
  
  if (enabledAddresses.length === 0) return null
  
  return (
    <div className={`space-y-4 ${className}`}>
      {enabledAddresses.map((addr, index) => {
        const config = CRYPTO_CONFIG[addr.currency] || { 
          icon: "◈", 
          color: "#888888", 
          name: addr.currency 
        }
        
        return (
          <motion.div
            key={addr.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassBrick onClick={() => handleCopy(addr)}>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{ 
                    backgroundColor: `${config.color}20`,
                    color: config.color 
                  }}
                >
                  {config.icon}
                </div>
                <div>
                  <div className="label" style={{ color: config.color }}>
                    {config.name} ({addr.currency})
                  </div>
                  <div className="font-bold text-white">
                    {addr.label || "Tap to Copy"}
                  </div>
                </div>
              </div>
              
              <div className="address-box relative">
                {addr.address}
                
                {/* Copy indicator */}
                <AnimatePresence>
                  {copiedId === addr.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center bg-[rgba(0,255,136,0.1)] rounded-[15px]"
                    >
                      <span className="text-[#00ff88] font-bold">
                        ✓ COPIED!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassBrick>
          </motion.div>
        )
      })}
    </div>
  )
}

// Portal-style crypto vault (collapsible)
interface CryptoVaultPortalProps {
  addresses: CryptoAddress[]
  onCopy?: (address: CryptoAddress) => void
  title?: string
  icon?: string
}

export function CryptoVaultPortal({ 
  addresses, 
  onCopy, 
  title = "Crypto Vault & Tips",
  icon = "₿"
}: CryptoVaultPortalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const handleCopy = async (addr: CryptoAddress) => {
    try {
      await navigator.clipboard.writeText(addr.address)
      setCopiedId(addr.id)
      onCopy?.(addr)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }
  
  const enabledAddresses = addresses.filter(a => a.enabled)
  
  if (enabledAddresses.length === 0) return null
  
  return (
    <div className="span-2">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassBrick onClick={() => setIsOpen(true)} span={2}>
              <div className="label">Finances</div>
              <div className="title flex items-center gap-2">
                {icon} {title}
              </div>
            </GlassBrick>
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="back-btn"
            >
              ← BACK TO DASHBOARD
            </button>
            
            {enabledAddresses.map((addr, index) => {
              const config = CRYPTO_CONFIG[addr.currency] || { 
                icon: "◈", 
                color: "#888888", 
                name: addr.currency 
              }
              
              return (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassBrick onClick={() => handleCopy(addr)}>
                    <div className="label" style={{ color: config.color }}>
                      {config.name} ({addr.currency}) - Tap to Copy
                    </div>
                    <div className="title">{addr.label || `${config.name} Address`}</div>
                    <div className="address-box relative">
                      {addr.address}
                      <AnimatePresence>
                        {copiedId === addr.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center bg-[rgba(0,255,136,0.1)] rounded-[15px]"
                          >
                            <span className="text-[#00ff88] font-bold">
                              ✓ COPIED TO CLIPBOARD!
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </GlassBrick>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Dashboard manager for crypto addresses
interface CryptoManagerProps {
  addresses: CryptoAddress[]
  onAdd: (currency: string, address: string, label?: string) => void
  onRemove: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

export function CryptoManager({
  addresses,
  onAdd,
  onRemove,
  onToggle
}: CryptoManagerProps) {
  const [currency, setCurrency] = useState("BTC")
  const [address, setAddress] = useState("")
  const [label, setLabel] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(currency, address, label || undefined)
    setAddress("")
    setLabel("")
    setIsAdding(false)
  }
  
  return (
    <div className="obsidian-card-static p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Crypto Vault</h3>
          <p className="text-sm text-[#888888] mt-1">
            Accept tips in crypto
          </p>
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-accent text-sm px-4 py-2"
          >
            + Add Address
          </button>
        )}
      </div>
      
      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3 pt-3 border-t border-[rgba(255,255,255,0.1)]"
          >
            <div className="grid grid-cols-2 gap-3">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-obsidian"
              >
                {Object.entries(CRYPTO_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (optional)"
                className="input-obsidian"
              />
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Wallet address"
              className="input-obsidian w-full font-mono text-sm"
              required
            />
            <div className="flex gap-3">
              <button type="submit" className="btn-accent-solid flex-1">
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-obsidian"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      
      {/* Address List */}
      <div className="space-y-3">
        {addresses.map((addr) => {
          const config = CRYPTO_CONFIG[addr.currency] || { 
            icon: "◈", 
            color: "#888888", 
            name: addr.currency 
          }
          
          return (
            <div
              key={addr.id}
              className={`
                p-4 rounded-2xl border transition-all
                ${addr.enabled 
                  ? "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.1)]" 
                  : "bg-[rgba(255,255,255,0.01)] border-[rgba(255,255,255,0.05)] opacity-50"
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: config.color }}>{config.icon}</span>
                  <span className="font-bold text-white">{config.name}</span>
                  {addr.label && (
                    <span className="text-sm text-[#888888]">• {addr.label}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Toggle */}
                  <button
                    onClick={() => onToggle(addr.id, !addr.enabled)}
                    className={`
                      w-10 h-6 rounded-full transition-all relative
                      ${addr.enabled 
                        ? "bg-[rgba(0,255,136,0.2)] border-[rgba(0,255,136,0.5)]" 
                        : "bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)]"
                      }
                      border
                    `}
                  >
                    <motion.div
                      className={`
                        absolute top-0.5 w-5 h-5 rounded-full
                        ${addr.enabled ? "bg-[#00ff88]" : "bg-white"}
                      `}
                      animate={{
                        left: addr.enabled ? "calc(100% - 22px)" : "2px"
                      }}
                    />
                  </button>
                  
                  {/* Delete */}
                  <button
                    onClick={() => onRemove(addr.id)}
                    className="p-2 text-[#888888] hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="font-mono text-xs text-[#888888] truncate">
                {addr.address}
              </div>
            </div>
          )
        })}
        
        {addresses.length === 0 && !isAdding && (
          <div className="text-center py-8 text-[#888888]">
            <div className="text-3xl mb-2 opacity-40">₿</div>
            <p>No crypto addresses yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

