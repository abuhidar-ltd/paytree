"use client"

import { ReactNode } from "react"

interface ButtonVariationProps {
  children: ReactNode
  onClick?: () => void
  variant?: "3d" | "gradient" | "glow" | "outline" | "glass" | "neon"
  className?: string
}

export function ButtonVariation({ 
  children, 
  onClick, 
  variant = "3d",
  className = ""
}: ButtonVariationProps) {
  const variants = {
    "3d": "bg-[#00ff88] text-[#030303] shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-b-4 border-[#00cc6a] hover:border-[#00aa55] active:translate-y-0 active:border-b-2",
    
    "gradient": "bg-gradient-to-r from-[#00ff88] via-[#00cc6a] to-[#00ff88] text-[#030303] shadow-lg hover:shadow-2xl bg-[length:200%_auto] hover:bg-right-bottom transition-all duration-500 animate-gradient-x",
    
    "glow": "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] hover:bg-blue-500 transition-all duration-300 animate-glow-pulse",
    
    "outline": "bg-transparent border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-600 transition-all duration-300 hover:shadow-lg",
    
    "glass": "bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg",
    
    "neon": "bg-transparent border-2 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] hover:shadow-[0_0_20px_rgba(34,211,238,0.8),inset_0_0_20px_rgba(34,211,238,0.2)] hover:bg-cyan-400/10 transition-all duration-300"
  }

  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold min-h-[44px] btn-touch touch-ripple touch-action-manipulation active:scale-[0.98] select-none ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// Add gradient animation to globals.css
export const buttonAnimations = `
@keyframes gradient-x {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-gradient-x {
  animation: gradient-x 3s ease infinite;
}
`

