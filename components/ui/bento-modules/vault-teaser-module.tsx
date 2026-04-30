"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface VaultTeaserModuleConfig {
  vaultItemId: string
  title: string
  description?: string
  teaserImage?: string // Blurred preview
  icon?: string
  unlockCount?: number
}

interface VaultTeaserModuleProps {
  config: VaultTeaserModuleConfig
  span?: 1 | 2
  className?: string
  onUnlock?: (email: string) => Promise<void>
}

export function VaultTeaserModule({ 
  config, 
  span = 2, 
  className = "",
  onUnlock 
}: VaultTeaserModuleProps) {
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const spanClass = span === 2 ? "col-span-2" : ""
  
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !onUnlock) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      await onUnlock(email)
      setIsUnlocking(false)
      setEmail("")
    } catch (err) {
      setError("Failed to unlock. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <motion.div
      className={`glass-brick relative overflow-hidden ${spanClass} ${className}`}
      whileHover={!isUnlocking ? { scale: 1.02 } : undefined}
    >
      {/* Teaser Background */}
      {config.teaserImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-xl opacity-30"
          style={{ backgroundImage: `url(${config.teaserImage})` }}
        />
      )}
      
      <div className="relative p-5">
        <AnimatePresence mode="wait">
          {!isUnlocking ? (
            <motion.div
              key="teaser"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4"
            >
              {/* Lock Icon / Image */}
              <div className="
                w-16 h-16 rounded-2xl flex-shrink-0
                bg-gradient-to-br from-[rgba(0,255,136,0.2)] to-[rgba(0,255,136,0.05)]
                border border-[rgba(0,255,136,0.3)]
                flex items-center justify-center
                relative overflow-hidden
              ">
                {config.teaserImage ? (
                  <>
                    <img 
                      src={config.teaserImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-sm opacity-50"
                    />
                    <div className="relative z-10">
                      <svg className="w-8 h-8 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <span className="text-3xl">{config.icon || "🔒"}</span>
                )}
                
                {/* Animated Lock Pulse */}
                <motion.div
                  className="absolute inset-0 border-2 border-[#00ff88] rounded-2xl"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="label">Vault</div>
                <div className="font-bold text-white truncate">{config.title}</div>
                {config.description && (
                  <div className="text-sm text-[#888888] mt-1 line-clamp-1">
                    {config.description}
                  </div>
                )}
                {config.unlockCount !== undefined && config.unlockCount > 0 && (
                  <div className="text-xs text-[#00ff88] mt-2">
                    {config.unlockCount.toLocaleString()} unlocks
                  </div>
                )}
              </div>
              
              {/* Unlock Button */}
              <motion.button
                onClick={() => setIsUnlocking(true)}
                className="
                  px-4 py-2 rounded-full flex-shrink-0
                  bg-[#00ff88] text-black font-bold text-sm
                  hover:bg-[#00cc6a] transition-colors
                "
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Unlock
              </motion.button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleUnlock}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{config.title}</div>
                  <div className="text-sm text-[#888888]">Enter email to unlock</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUnlocking(false)}
                  className="text-[#888888] hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="
                    flex-1 px-4 py-3 rounded-xl
                    bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]
                    text-white placeholder:text-[#888888]
                    focus:outline-none focus:border-[rgba(0,255,136,0.5)]
                    transition-colors
                  "
                  autoFocus
                  required
                />
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="
                    px-6 py-3 rounded-xl
                    bg-[#00ff88] text-black font-bold
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-[#00cc6a] transition-colors
                  "
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    "Get Access"
                  )}
                </motion.button>
              </div>
              
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
