import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "obsidian" | "accent" | "accent-solid"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    // duration-150 keeps press feedback snappy (iOS-feel) while still
    // smoothing hover. duration-300 felt laggy on tap.
    const baseStyles = `
      inline-flex items-center justify-center gap-2 font-semibold
      transition-all duration-150 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030303]
      disabled:pointer-events-none disabled:opacity-50
      btn-touch touch-action-manipulation select-none
      rounded-full
      active:scale-[0.97]
    `.trim()
    
    const variants = {
      // Default: Obsidian glass button
      default: `
        bg-[rgba(255,255,255,0.05)]
        backdrop-blur-xl
        border border-[rgba(255,255,255,0.15)]
        text-white
        hover:bg-[rgba(255,255,255,0.1)]
        hover:border-[rgba(255,255,255,0.25)]
        hover:-translate-y-1
        active:translate-y-0 active:scale-[0.98]
      `.trim(),
      
      // Outline: Ghost with border
      outline: `
        bg-transparent
        border border-[rgba(255,255,255,0.2)]
        text-white
        hover:bg-[rgba(255,255,255,0.05)]
        hover:border-[rgba(255,255,255,0.3)]
        active:scale-[0.98]
      `.trim(),
      
      // Ghost: Minimal
      ghost: `
        bg-transparent
        text-[#888888]
        hover:bg-[rgba(255,255,255,0.05)]
        hover:text-white
        active:scale-[0.98]
      `.trim(),
      
      // Destructive: Red
      destructive: `
        bg-red-600
        text-white
        hover:bg-red-700
        active:scale-[0.98]
      `.trim(),
      
      // Obsidian: Glass with razor rim
      obsidian: `
        bg-[rgba(255,255,255,0.05)]
        backdrop-blur-xl
        border border-[rgba(255,255,255,0.15)]
        text-white
        hover:bg-[rgba(255,255,255,0.1)]
        hover:border-[rgba(255,255,255,0.25)]
        hover:-translate-y-1
        hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]
        active:translate-y-0 active:scale-[0.98]
        relative
        before:content-['']
        before:absolute before:top-0 before:left-0 before:right-0
        before:h-[1px]
        before:bg-gradient-to-r before:from-transparent before:via-[rgba(255,255,255,0.3)] before:to-transparent
        before:rounded-t-full
      `.trim(),
      
      // Accent: Neon green outline
      accent: `
        bg-[rgba(0,255,136,0.1)]
        backdrop-blur-xl
        border border-[rgba(0,255,136,0.3)]
        text-[#00ff88]
        hover:bg-[rgba(0,255,136,0.2)]
        hover:border-[rgba(0,255,136,0.5)]
        hover:-translate-y-1
        hover:shadow-[0_0_40px_rgba(0,255,136,0.2),0_10px_30px_rgba(0,0,0,0.3)]
        active:translate-y-0 active:scale-[0.98]
        shadow-[0_0_20px_rgba(0,255,136,0.1)]
      `.trim(),
      
      // Accent Solid: Full neon green
      "accent-solid": `
        bg-[#00ff88]
        text-[#030303]
        font-bold
        hover:-translate-y-1
        hover:scale-[1.02]
        hover:shadow-[0_0_50px_rgba(0,255,136,0.5),0_10px_30px_rgba(0,0,0,0.3)]
        active:translate-y-0 active:scale-[0.98]
        shadow-[0_0_30px_rgba(0,255,136,0.3)]
      `.trim(),
    }
    
    // Apple HIG: 44px minimum touch target. Bumped sm from 40 → 44.
    const sizes = {
      default: "h-12 px-7 py-3 text-sm min-h-[48px]",
      sm: "h-11 px-5 py-2 text-sm min-h-[44px]",
      lg: "h-14 px-10 py-4 text-base min-h-[56px]",
    }
    
    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
