"use client"

import { useEffect, useState } from "react"

interface PremiumBackgroundProps {
  variant?: "nebula" | "minimal" | "particles"
}

export function PremiumBackground({ variant = "nebula" }: PremiumBackgroundProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Deep black base */}
      <div className="absolute inset-0 bg-[#030303]" />
      
      {/* Nebula gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0a0a0a_0%,#050505_100%)]" />
      
      {variant === "nebula" && mounted && (
        <>
          {/* Animated nebula orbs */}
          <div 
            className="absolute w-[500px] h-[500px] rounded-full opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%)",
              filter: "blur(80px)",
              top: "-10%",
              left: "-10%",
              animation: "float 20s ease-in-out infinite"
            }}
          />
          
          <div 
            className="absolute w-[400px] h-[400px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(0,255,136,0.3) 0%, transparent 70%)",
              filter: "blur(80px)",
              top: "40%",
              right: "-10%",
              animation: "float 25s ease-in-out infinite",
              animationDelay: "-5s"
            }}
          />
          
          <div 
            className="absolute w-[350px] h-[350px] rounded-full opacity-25"
            style={{
              background: "radial-gradient(circle, rgba(0,0,0,0.5) 0%, transparent 70%)",
              filter: "blur(70px)",
              bottom: "-5%",
              left: "25%",
              animation: "float 22s ease-in-out infinite",
              animationDelay: "-10s"
            }}
          />
          
          {/* Accent glow */}
          <div 
            className="absolute w-[200px] h-[200px] rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, rgba(0,255,136,0.5) 0%, transparent 70%)",
              filter: "blur(60px)",
              top: "20%",
              left: "60%",
              animation: "float 18s ease-in-out infinite",
              animationDelay: "-8s"
            }}
          />
        </>
      )}
      
      {variant === "particles" && mounted && (
        <div className="absolute inset-0">
          {/* Star field effect */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                opacity: Math.random() * 0.5 + 0.1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 50%, black, transparent)"
        }}
      />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,3,3,0.6)_100%)]" />
      
      {/* Noise texture for premium feel */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
        }} 
      />
      
      {/* Top fade for header clarity */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#030303]/80 to-transparent" />
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030303]/80 to-transparent" />
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

// Export simple version for performance-critical pages
export function MinimalBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#030303]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0a0a0a_0%,#050505_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,3,3,0.6)_100%)]" />
    </div>
  )
}
