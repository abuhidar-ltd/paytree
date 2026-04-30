"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ImageModuleConfig {
  imageUrl: string
  title?: string
  caption?: string
  aspectRatio?: "square" | "portrait" | "landscape"
  enableLightbox?: boolean
}

interface ImageModuleProps {
  config: ImageModuleConfig
  span?: 1 | 2 | 4
  className?: string
}

export function ImageModule({ config, span = 1, className = "" }: ImageModuleProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  const spanClass = span === 4 ? "col-span-2 row-span-2" : span === 2 ? "col-span-2" : ""
  
  const aspectClass = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-video",
  }[config.aspectRatio || "square"]
  
  const handleClick = () => {
    if (config.enableLightbox !== false) {
      setIsLightboxOpen(true)
    }
  }
  
  return (
    <>
      <motion.div
        className={`
          glass-brick relative overflow-hidden ${spanClass} ${aspectClass} ${className}
          cursor-pointer group
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
      >
        {/* Loading State */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.02)]">
            <div className="w-8 h-8 border-2 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin" />
          </div>
        )}
        
        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(255,255,255,0.02)]">
            <svg className="w-8 h-8 text-[#888888] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-[#888888]">Image not found</span>
          </div>
        )}
        
        {/* Image */}
        <img
          src={config.imageUrl}
          alt={config.title || "Image"}
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-opacity duration-300
            ${isLoaded ? "opacity-100" : "opacity-0"}
          `}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
        
        {/* Overlay on Hover */}
        <div className="
          absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
        " />
        
        {/* Title/Caption */}
        {(config.title || config.caption) && (
          <div className="
            absolute bottom-0 left-0 right-0 p-4
            translate-y-full group-hover:translate-y-0
            transition-transform duration-300
          ">
            {config.title && (
              <div className="font-bold text-white truncate">{config.title}</div>
            )}
            {config.caption && (
              <div className="text-sm text-[#888888] truncate mt-1">{config.caption}</div>
            )}
          </div>
        )}
        
        {/* Expand Icon */}
        {config.enableLightbox !== false && (
          <div className="
            absolute top-3 right-3
            w-8 h-8 rounded-full
            bg-[rgba(0,0,0,0.5)] backdrop-blur-sm
            flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-opacity
          ">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        )}
      </motion.div>
      
      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.2)] transition-colors"
              onClick={() => setIsLightboxOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image */}
            <motion.img
              src={config.imageUrl}
              alt={config.title || "Image"}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Caption */}
            {(config.title || config.caption) && (
              <motion.div
                className="absolute bottom-6 left-6 right-6 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
              >
                {config.title && (
                  <div className="font-bold text-xl text-white">{config.title}</div>
                )}
                {config.caption && (
                  <div className="text-[#888888] mt-2">{config.caption}</div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
