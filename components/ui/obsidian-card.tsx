"use client"

import { ReactNode, useRef, useState, useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface ObsidianCardProps {
  children: ReactNode
  className?: string
  variant?: "default" | "accent" | "static" | "dynamic-accent"
  enableTilt?: boolean
  layoutId?: string
  onClick?: () => void
  href?: string
  glowOnHover?: boolean
}

export function ObsidianCard({
  children,
  className = "",
  variant = "default",
  enableTilt = true,
  layoutId,
  onClick,
  href,
  glowOnHover = false
}: ObsidianCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  // Mouse position for parallax tilt
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Spring physics for smooth tilt
  const springConfig = { stiffness: 300, damping: 30 }
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig)
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || !enableTilt) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    mouseX.set((e.clientX - centerX) / rect.width)
    mouseY.set((e.clientY - centerY) / rect.height)
  }
  
  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }
  
  // Gyroscope support for mobile
  useEffect(() => {
    if (!enableTilt || typeof window === 'undefined') return
    
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return
      mouseX.set(e.gamma / 45) // -45 to 45 degrees
      mouseY.set((e.beta - 45) / 45) // Offset for natural holding position
    }
    
    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      // Permission will be requested on user interaction
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [enableTilt, mouseX, mouseY])
  
  const variantClasses = {
    default: "obsidian-card",
    accent: "obsidian-card-accent",
    static: "obsidian-card-static",
    "dynamic-accent": "accent-glow-card"
  }
  
  // Add glow hover style if enabled
  const glowStyle = glowOnHover ? {
    "--hover-glow": "var(--accent-glow)",
    "--hover-border": "var(--accent-color)"
  } as React.CSSProperties : {}
  
  const commonProps = {
    layoutId,
    className: `${variantClasses[variant]} ${className}`,
    onMouseMove: handleMouseMove,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: handleMouseLeave,
    style: enableTilt ? {
      rotateX: isHovered ? rotateX : 0,
      rotateY: isHovered ? rotateY : 0,
      transformStyle: "preserve-3d" as const
    } : undefined,
    whileHover: variant !== "static" ? { scale: 1.02 } : undefined,
    whileTap: variant !== "static" ? { scale: 0.98 } : undefined,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 }
  }
  
  if (href) {
    return (
      <motion.a
        {...commonProps}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </motion.a>
    )
  }
  
  if (onClick) {
    return (
      <motion.button
        {...commonProps}
        onClick={onClick}
        style={{ ...commonProps.style, width: '100%', textAlign: 'left' }}
      >
        {children}
      </motion.button>
    )
  }
  
  return (
    <motion.div ref={cardRef} {...commonProps}>
      {children}
    </motion.div>
  )
}

// Simplified Glass Brick for links
interface GlassBrickProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
  span?: 1 | 2 | 3
  glowOnHover?: boolean
}

export function GlassBrick({
  children,
  className = "",
  onClick,
  href,
  span = 1,
  glowOnHover = false
}: GlassBrickProps) {
  const spanClass = span === 2 ? "span-2" : span === 3 ? "span-3" : ""
  const glowClass = glowOnHover ? "hover:border-[var(--accent-color)] hover:shadow-[0_0_20px_var(--accent-glow)]" : ""
  
  const motionProps = {
    className: `glass-brick ${spanClass} ${glowClass} ${className}`,
    whileHover: { y: -5, scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring" as const, stiffness: 300, damping: 30 }
  }
  
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        <motion.div {...motionProps}>
          {children}
        </motion.div>
      </a>
    )
  }
  
  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        <motion.div {...motionProps}>
          {children}
        </motion.div>
      </button>
    )
  }
  
  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  )
}

// Accent Glow Card - Uses dynamic accent color
interface AccentGlowCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function AccentGlowCard({ children, className = "", onClick }: AccentGlowCardProps) {
  return (
    <motion.div
      className={`accent-glow-card ${className}`}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
