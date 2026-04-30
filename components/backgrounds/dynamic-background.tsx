"use client"

import { PremiumBackground } from "./premium-background"
import { ParticlesBackground } from "./particles-background"
import { MeshGradient } from "./mesh-gradient"
import { getThemeGradient } from "@/lib/theme-utils"

interface DynamicBackgroundProps {
  style?: string
  customImageUrl?: string
  primaryColor?: string
  backgroundColor?: string
  theme?: string
}

export function DynamicBackground({ 
  style = "mesh", 
  customImageUrl,
  primaryColor = "#3b82f6",
  backgroundColor = "#0f172a",
  theme = "dark"
}: DynamicBackgroundProps) {
  
  const themeGradient = getThemeGradient(theme)
  
  // Custom image background
  if (style === "custom" && customImageUrl) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${customImageUrl})` }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>
    )
  }
  
  // Minimal gradient background
  if (style === "minimal") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${themeGradient}`}
        />
      </div>
    )
  }
  
  // Geometric shapes background
  if (style === "geometric") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${themeGradient}`} />
        
        {/* Rotating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-white/10 rounded-lg animate-rotate-slow" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 border-2 border-white/10 rotate-45 animate-float" style={{ animationDuration: '15s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 border-2 border-white/10 rounded-full animate-float" />
        
        {/* Gradient orbs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-float" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-float" style={{ animationDuration: '25s' }} />
      </div>
    )
  }
  
  // Particles background
  if (style === "particles") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${themeGradient}`} />
        <ParticlesBackground />
      </div>
    )
  }
  
  // Mesh gradient (default)
  if (style === "mesh") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${themeGradient}`} />
        <MeshGradient />
      </div>
    )
  }
  
  // Fallback to premium background
  return <PremiumBackground />
}
