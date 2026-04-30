"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface PaymentModuleConfig {
  productId: string
  title: string
  description?: string
  price: number // In cents
  currency?: string
  imageUrl?: string
  downloadPreview?: string // Blurred preview of the digital product
}

interface PaymentModuleProps {
  config: PaymentModuleConfig
  span?: 1 | 2 | 4
  className?: string
}

export function PaymentModule({ config, span = 2, className = "" }: PaymentModuleProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const spanClass = span === 4 ? "col-span-2 row-span-2" : span === 2 ? "col-span-2" : ""
  const currency = config.currency || "usd"
  
  // Format price
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(config.price / 100)
  
  const handlePurchase = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/${config.productId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      
      if (!res.ok) throw new Error("Failed to create checkout")
      
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (error) {
      console.error("Purchase error:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Compact 1x1 view
  if (span === 1) {
    return (
      <motion.button
        onClick={handlePurchase}
        disabled={isLoading}
        className={`glass-brick aspect-square relative overflow-hidden ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Background Image */}
        {config.imageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${config.imageUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        <div className="relative h-full flex flex-col items-center justify-end p-4 text-center">
          <div className="font-bold text-white text-sm truncate w-full mb-1">
            {config.title}
          </div>
          <div className="text-lg font-bold text-[#00ff88]">
            {formattedPrice}
          </div>
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin" />
          </div>
        )}
      </motion.button>
    )
  }
  
  // Standard 2x1 or 2x2 view
  return (
    <motion.div
      className={`glass-brick relative overflow-hidden ${spanClass} ${className}`}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className={`flex ${span === 4 ? "flex-col" : "flex-row"} h-full`}>
        {/* Product Image */}
        {config.imageUrl && (
          <div className={`
            relative overflow-hidden flex-shrink-0
            ${span === 4 ? "h-48" : "w-28 h-full"}
          `}>
            <img 
              src={config.imageUrl}
              alt={config.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[rgba(3,3,3,0.8)]" />
            
            {/* Price Badge */}
            <div className="
              absolute top-3 left-3
              px-2 py-1 rounded-lg
              bg-[#00ff88] text-black text-xs font-bold
            ">
              {formattedPrice}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className={`
          flex-1 flex flex-col justify-between p-5
          ${!config.imageUrl ? "items-center text-center" : ""}
        `}>
          <div>
            <div className="label">Digital Product</div>
            <div className="font-bold text-white text-lg mb-1">{config.title}</div>
            {config.description && (
              <div className="text-sm text-[#888888] line-clamp-2">
                {config.description}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            {!config.imageUrl && (
              <div className="text-2xl font-bold text-[#00ff88]">
                {formattedPrice}
              </div>
            )}
            
            <motion.button
              onClick={handlePurchase}
              disabled={isLoading}
              className={`
                px-6 py-3 rounded-xl font-bold
                bg-gradient-to-r from-[#00ff88] to-[#00cc6a]
                text-black
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
                ${!config.imageUrl ? "" : "ml-auto"}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Buy Now</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Hover Glow */}
      <motion.div
        className="absolute inset-0 rounded-[32px] border border-[#00ff88] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.3 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}
