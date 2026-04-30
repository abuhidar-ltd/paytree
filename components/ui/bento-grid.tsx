"use client"

import { ReactNode } from "react"

interface BentoGridProps {
  children: ReactNode
  className?: string
  columns?: 2 | 3 | 4
}

export function BentoGrid({ 
  children, 
  className = "",
  columns = 3
}: BentoGridProps) {
  const columnClasses = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  }

  return (
    <div className={`grid grid-cols-1 ${columnClasses[columns]} gap-4 sm:gap-5 lg:gap-6 ${className}`}>
      {children}
    </div>
  )
}

interface BentoCardProps {
  children: ReactNode
  className?: string
  span?: "normal" | "wide" | "tall"
  onClick?: () => void
  href?: string
}

export function BentoCard({
  children,
  className = "",
  span = "normal",
  onClick,
  href
}: BentoCardProps) {
  const spanClasses = {
    normal: "",
    wide: "sm:col-span-2",
    tall: "row-span-2"
  }

  const baseClasses = `
    glass-card-hover
    p-5 sm:p-6
    min-h-[140px]
    flex flex-col
    cursor-pointer
    ${spanClasses[span]}
    ${className}
  `.trim()

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
      >
        {children}
      </a>
    )
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClasses} text-left w-full`}>
        {children}
      </button>
    )
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  )
}

interface BentoHeaderProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  badge?: ReactNode
}

export function BentoHeader({ icon, title, subtitle, badge }: BentoHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-4">
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ff88] to-[rgba(0,255,136,0.5)] flex items-center justify-center text-[#030303] shadow-soft">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white truncate">{title}</h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-zinc-400 truncate mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

interface BentoStatProps {
  value: string | number
  label: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

export function BentoStat({ value, label, trend, trendValue }: BentoStatProps) {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-zinc-400"
  }

  const trendIcons = {
    up: "↑",
    down: "↓",
    neutral: "→"
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-white">{value}</span>
        {trend && trendValue && (
          <span className={`text-sm font-medium ${trendColors[trend]}`}>
            {trendIcons[trend]} {trendValue}
          </span>
        )}
      </div>
      <span className="text-sm text-zinc-400 mt-1">{label}</span>
    </div>
  )
}

