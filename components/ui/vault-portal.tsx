"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassBrick } from "./obsidian-card"

interface VaultItem {
  id: string
  title: string
  icon?: string
  downloadUrl?: string
  downloadName?: string
  vaultContent?: string
  url?: string // For private links
}

interface VaultPortalProps {
  item: VaultItem
  ownerId: string
  onUnlock?: (email: string) => void
  className?: string
}

export function VaultPortal({ item, ownerId, onUnlock, className = "" }: VaultPortalProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)
  
  // Check localStorage for unlock status on mount
  useEffect(() => {
    const storageKey = `vault-${ownerId}-${item.id}`
    const unlockedEmail = localStorage.getItem(storageKey)
    if (unlockedEmail) {
      setIsUnlocked(true)
      setEmail(unlockedEmail)
    }
    setCheckingStatus(false)
  }, [ownerId, item.id])
  
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    
    try {
      const res = await fetch("/api/vault/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          linkId: item.id,
          ownerId,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to send code")
      }
      setStep("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch("/api/vault/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          linkId: item.id,
          ownerId,
          code,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to verify code")
      }

      // Store in localStorage
      const storageKey = `vault-${ownerId}-${item.id}`
      localStorage.setItem(storageKey, email)

      setIsUnlocked(true)
      onUnlock?.(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDownload = () => {
    if (item.downloadUrl) {
      window.open(item.downloadUrl, "_blank")
    }
  }
  
  const handleOpenLink = () => {
    if (item.url) {
      window.open(item.url, "_blank")
    }
  }
  
  if (checkingStatus) {
    return (
      <GlassBrick className={`relative overflow-hidden ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-[rgba(255,255,255,0.1)] rounded w-1/2 mb-2" />
          <div className="h-4 bg-[rgba(255,255,255,0.05)] rounded w-3/4" />
        </div>
      </GlassBrick>
    )
  }
  
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          // Locked State
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            {/* Blurred Preview */}
            <div className="relative overflow-hidden rounded-[32px]">
              <GlassBrick className="relative">
                {/* Blurred background content */}
                <div className="vault-locked opacity-50">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{item.icon || "🔒"}</span>
                    <div>
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="text-sm text-[#888888]">Unlock with email</div>
                    </div>
                  </div>
                  {item.vaultContent && (
                    <div className="mt-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] text-sm text-[#888888] line-clamp-3">
                      {item.vaultContent}
                    </div>
                  )}
                </div>
                
                {/* Lock Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(3,3,3,0.7)] backdrop-blur-sm rounded-[32px]">
                  <div className="vault-overlay p-6 rounded-2xl max-w-[280px] w-full">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[rgba(0,255,136,0.1)] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-white mb-1">Unlock Content</h3>
                      <p className="text-xs text-[#888888]">Enter your email to access</p>
                    </div>
                    
                    {step === "email" ? (
                      <form onSubmit={handleSendCode} className="space-y-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="input-obsidian w-full text-center"
                          required
                          disabled={isLoading}
                        />
                      
                        {error && (
                          <p className="text-red-400 text-xs text-center">{error}</p>
                        )}
                      
                        <button
                          type="submit"
                          disabled={isLoading || !email}
                          className="btn-accent-solid w-full text-sm py-3 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Sending...
                            </span>
                          ) : (
                            "Send Code"
                          )}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyCode} className="space-y-3">
                        <div className="text-xs text-[#888888] text-center">
                          We sent a 6-digit code to <span className="text-white">{email}</span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="123456"
                          className="input-obsidian w-full text-center tracking-[0.3em]"
                          required
                          disabled={isLoading}
                        />
                        {error && (
                          <p className="text-red-400 text-xs text-center">{error}</p>
                        )}
                        <button
                          type="submit"
                          disabled={isLoading || code.length !== 6}
                          className="btn-accent-solid w-full text-sm py-3 disabled:opacity-50"
                        >
                          {isLoading ? "Verifying..." : "Unlock"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStep("email")
                            setCode("")
                            setError(null)
                          }}
                          className="btn-obsidian w-full text-sm py-3"
                        >
                          Change email
                        </button>
                      </form>
                    )}
                    
                    <p className="text-[10px] text-[#555555] text-center mt-3">
                      Your email will be stored securely
                    </p>
                  </div>
                </div>
              </GlassBrick>
            </div>
          </motion.div>
        ) : (
          // Unlocked State
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <GlassBrick className="border-[rgba(0,255,136,0.3)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-xl">
                  {item.icon || "🔓"}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{item.title}</div>
                  <div className="text-sm text-[#00ff88] flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlocked
                  </div>
                </div>
              </div>
              
              {/* Show content based on type */}
              {item.vaultContent && (
                <div className="mt-3 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                  <p className="text-sm text-[#888888] whitespace-pre-wrap">{item.vaultContent}</p>
                </div>
              )}
              
              {/* Download button */}
              {item.downloadUrl && (
                <button
                  onClick={handleDownload}
                  className="mt-4 btn-accent w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download {item.downloadName || "File"}
                </button>
              )}
              
              {/* Private link button */}
              {item.url && !item.downloadUrl && (
                <button
                  onClick={handleOpenLink}
                  className="mt-4 btn-accent w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Access Content
                </button>
              )}
            </GlassBrick>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Vault Manager Component for Dashboard
interface VaultManagerProps {
  vaultItems: VaultItem[]
  onCreateItem: (item: Partial<VaultItem>) => void
  onDeleteItem: (id: string) => void
  onToggleLock: (id: string, locked: boolean) => void
}

export function VaultManager({
  vaultItems,
  onCreateItem,
  onDeleteItem,
  onToggleLock
}: VaultManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newItem, setNewItem] = useState({
    title: "",
    icon: "🔒",
    type: "link" as "link" | "download" | "content",
    url: "",
    downloadUrl: "",
    downloadName: "",
    vaultContent: "",
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const item: Partial<VaultItem> = {
      title: newItem.title,
      icon: newItem.icon,
    }
    
    if (newItem.type === "link") {
      item.url = newItem.url
    } else if (newItem.type === "download") {
      item.downloadUrl = newItem.downloadUrl
      item.downloadName = newItem.downloadName
    } else if (newItem.type === "content") {
      item.vaultContent = newItem.vaultContent
    }
    
    onCreateItem(item)
    setNewItem({
      title: "",
      icon: "🔒",
      type: "link",
      url: "",
      downloadUrl: "",
      downloadName: "",
      vaultContent: "",
    })
    setIsAdding(false)
  }
  
  return (
    <div className="space-y-4">
      <div className="obsidian-card-static p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white">The Vault</h3>
            <p className="text-sm text-[#888888]">Email-gated content for your audience</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="btn-accent text-sm px-4 py-2"
            >
              + Add Item
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
              className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.1)]"
            >
              <div className="grid grid-cols-[80px,1fr] gap-3">
                <input
                  type="text"
                  value={newItem.icon}
                  onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                  className="input-obsidian text-center text-xl"
                  placeholder="🔒"
                />
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="input-obsidian"
                  placeholder="Item title"
                  required
                />
              </div>
              
              {/* Type Selector */}
              <div className="flex gap-2">
                {[
                  { id: "link", label: "Private Link", icon: "🔗" },
                  { id: "download", label: "Download", icon: "📥" },
                  { id: "content", label: "Text Content", icon: "📝" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setNewItem({ ...newItem, type: type.id as typeof newItem.type })}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      newItem.type === type.id
                        ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.3)]"
                        : "bg-[rgba(255,255,255,0.02)] text-[#888888] border border-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
              
              {/* Type-specific fields */}
              {newItem.type === "link" && (
                <input
                  type="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="input-obsidian w-full"
                  placeholder="https://private-link.com"
                  required
                />
              )}
              
              {newItem.type === "download" && (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={newItem.downloadUrl}
                    onChange={(e) => setNewItem({ ...newItem, downloadUrl: e.target.value })}
                    className="input-obsidian w-full"
                    placeholder="https://download-url.com/file.pdf"
                    required
                  />
                  <input
                    type="text"
                    value={newItem.downloadName}
                    onChange={(e) => setNewItem({ ...newItem, downloadName: e.target.value })}
                    className="input-obsidian w-full"
                    placeholder="File name (e.g., My Preset Pack)"
                  />
                </div>
              )}
              
              {newItem.type === "content" && (
                <textarea
                  value={newItem.vaultContent}
                  onChange={(e) => setNewItem({ ...newItem, vaultContent: e.target.value })}
                  className="input-obsidian w-full min-h-[100px] resize-none"
                  placeholder="Secret content that will be revealed..."
                  required
                />
              )}
              
              <div className="flex gap-3">
                <button type="submit" className="btn-accent-solid flex-1">
                  Create Vault Item
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
        
        {/* Vault Items List */}
        {!isAdding && (
          <div className="space-y-3 mt-4">
            {vaultItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)]"
              >
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-lg">
                  {item.icon || "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{item.title}</div>
                  <div className="text-xs text-[#888888]">
                    {item.downloadUrl ? "Download" : item.vaultContent ? "Content" : "Link"}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 text-[#888888] hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            
            {vaultItems.length === 0 && !isAdding && (
              <div className="text-center py-8 text-[#888888]">
                <div className="text-3xl mb-2 opacity-40">🔒</div>
                <p>No vault items yet</p>
                <p className="text-sm mt-1">Create gated content to capture emails</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

