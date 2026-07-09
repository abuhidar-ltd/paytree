"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { paymentsUnderMaintenance } from "@/lib/payments-live"
import { PaymentsMaintenancePill } from "@/components/ui/payments-maintenance"

interface QuickTipModuleConfig {
  amounts?: number[] // Preset amounts in dollars, e.g., [5, 10, 20]
  defaultAmount?: number
  recipientName?: string
  stripeAccountId?: string // For Stripe Connect
}

interface QuickTipModuleProps {
  config: QuickTipModuleConfig
  span?: 1 | 2
  className?: string
  userId: string
}

export function QuickTipModule({ 
  config, 
  span = 1, 
  className = "",
  userId
}: QuickTipModuleProps) {
  const [selectedAmount, setSelectedAmount] = useState(config.defaultAmount || 5)
  const [isLoading, setIsLoading] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customAmount, setCustomAmount] = useState("")
  
  const spanClass = span === 2 ? "col-span-2" : ""
  const amounts = config.amounts || [5, 10, 20]

  // TEMPORARY: live tips paused while Stripe reviews our live application. Show
  // the "back soon" state instead of the tip button (the API is gated too).
  // Test mode is never gated. See lib/payments-live.ts.
  const maintenance = paymentsUnderMaintenance()
  if (maintenance) {
    return (
      <div className={`glass-brick ${spanClass} ${className} flex flex-col items-center justify-center gap-2 p-4 ${span === 1 ? "aspect-square" : ""}`}>
        <div className="text-2xl">💸</div>
        <PaymentsMaintenancePill fullWidth={span !== 1} />
      </div>
    )
  }

  const handleTip = async () => {
    setIsLoading(true)
    try {
      const amount = showCustom ? parseFloat(customAmount) : selectedAmount
      if (!amount || amount < 1) return
      
      // Create checkout session for tip
      const res = await fetch("/api/tips/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: Math.round(amount * 100), // Convert to cents
          userId,
          recipientName: config.recipientName,
        }),
      })
      
      if (!res.ok) throw new Error("Failed to create checkout")
      
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (error) {
      console.error("Tip error:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Compact 1x1 view
  if (span === 1) {
    return (
      <motion.button
        onClick={handleTip}
        disabled={isLoading}
        className={`
          glass-brick aspect-square ${className}
          flex flex-col items-center justify-center
          cursor-pointer
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isLoading ? (
          <div className="w-8 h-8 border-2 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin" />
        ) : (
          <>
            <div className="text-3xl font-bold text-[#00ff88]">
              ${config.defaultAmount || 5}
            </div>
            <div className="label mt-2">Send Tip</div>
            
            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 rounded-[32px] border border-[#00ff88]"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        )}
      </motion.button>
    )
  }
  
  // Extended 2x1 view with amount selection
  return (
    <motion.div
      className={`glass-brick ${spanClass} ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="label">Quick Tip</div>
            <div className="font-bold text-white">
              {config.recipientName ? `Support ${config.recipientName}` : "Send a Tip"}
            </div>
          </div>
          <div className="text-2xl">💸</div>
        </div>
        
        {/* Amount Selection */}
        <div className="flex gap-2 mb-4">
          {amounts.map((amount) => (
            <motion.button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount)
                setShowCustom(false)
              }}
              className={`
                flex-1 py-2 rounded-xl font-bold text-sm
                transition-colors
                ${selectedAmount === amount && !showCustom
                  ? "bg-[#00ff88] text-black"
                  : "bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)]"
                }
              `}
              whileTap={{ scale: 0.95 }}
            >
              ${amount}
            </motion.button>
          ))}
          <motion.button
            onClick={() => setShowCustom(!showCustom)}
            className={`
              px-3 py-2 rounded-xl font-bold text-sm
              transition-colors
              ${showCustom
                ? "bg-[#00ff88] text-black"
                : "bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)]"
              }
            `}
            whileTap={{ scale: 0.95 }}
          >
            ...
          </motion.button>
        </div>
        
        {/* Custom Amount Input */}
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]">$</span>
              <input
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className="
                  w-full pl-8 pr-4 py-3 rounded-xl
                  bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]
                  text-white placeholder:text-[#888888]
                  focus:outline-none focus:border-[rgba(0,255,136,0.5)]
                "
              />
            </div>
          </motion.div>
        )}
        
        {/* Send Button */}
        <motion.button
          onClick={handleTip}
          disabled={isLoading || (showCustom && (!customAmount || parseFloat(customAmount) < 1))}
          className="
            w-full py-3 rounded-xl
            bg-gradient-to-r from-[#00ff88] to-[#00cc6a]
            text-black font-bold
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <span>Send ${showCustom ? customAmount || "0" : selectedAmount}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
