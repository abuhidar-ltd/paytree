"use client"

import { motion, AnimatePresence } from "framer-motion"

interface LiveStatusPillProps {
  message: string
  isLive?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LiveStatusPill({
  message,
  isLive = true,
  className = "",
  size = "md"
}: LiveStatusPillProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-2",
    md: "px-5 py-3 text-sm gap-2.5",
    lg: "px-6 py-4 text-base gap-3"
  }
  
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5"
  }
  
  return (
    <AnimatePresence>
      {isLive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`
            inline-flex items-center ${sizeClasses[size]}
            rounded-full
            bg-[rgba(0,255,136,0.05)]
            border border-[rgba(0,255,136,0.2)]
            ${className}
          `}
        >
          {/* Beeping Dot */}
          <div className="relative">
            <motion.div
              className={`${dotSizes[size]} bg-[#00ff88] rounded-full`}
              style={{
                boxShadow: "0 0 10px #00ff88, 0 0 20px #00ff88"
              }}
              animate={{
                opacity: [1, 0.5, 1],
                boxShadow: [
                  "0 0 10px #00ff88, 0 0 20px #00ff88",
                  "0 0 5px #00ff88, 0 0 10px #00ff88",
                  "0 0 10px #00ff88, 0 0 20px #00ff88"
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Ping animation ring */}
            <motion.div
              className={`absolute inset-0 ${dotSizes[size]} bg-[#00ff88] rounded-full`}
              animate={{
                scale: [1, 2],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </div>
          
          {/* Message */}
          <span className="font-bold uppercase tracking-wider text-white">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Dashboard toggle component
interface LiveStatusToggleProps {
  isLive: boolean
  message: string
  onToggle: (isLive: boolean) => void
  onMessageChange: (message: string) => void
}

export function LiveStatusToggle({
  isLive,
  message,
  onToggle,
  onMessageChange
}: LiveStatusToggleProps) {
  return (
    <div className="obsidian-card-static p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Live Broadcast Mode</h3>
          <p className="text-sm text-[#888888] mt-1">
            Show a live status on your profile
          </p>
        </div>
        
        {/* Toggle Switch */}
        <button
          onClick={() => onToggle(!isLive)}
          className={`
            relative w-14 h-8 rounded-full transition-all duration-300
            ${isLive 
              ? "bg-[rgba(0,255,136,0.2)] border-[rgba(0,255,136,0.5)]" 
              : "bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.2)]"
            }
            border
          `}
        >
          <motion.div
            className={`
              absolute top-1 w-6 h-6 rounded-full
              ${isLive ? "bg-[#00ff88]" : "bg-white"}
            `}
            animate={{
              left: isLive ? "calc(100% - 28px)" : "4px",
              boxShadow: isLive ? "0 0 10px #00ff88" : "none"
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
      
      {/* Message Input */}
      <div className="space-y-2">
        <label className="text-sm text-[#888888]">Status Message</label>
        <input
          type="text"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="TRADING ON SOLANA"
          className="input-obsidian w-full"
          maxLength={50}
        />
      </div>
      
      {/* Preview */}
      {message && (
        <div className="pt-2">
          <p className="text-xs text-[#888888] mb-2">Preview:</p>
          <LiveStatusPill message={message} isLive={isLive} size="sm" />
        </div>
      )}
    </div>
  )
}

