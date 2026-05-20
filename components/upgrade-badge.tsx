"use client"

import Link from "next/link"
import { Button } from "./ui/button"

interface UpgradeBadgeProps {
  isPro: boolean
  compact?: boolean
}

export function UpgradeBadge({ isPro, compact = false }: UpgradeBadgeProps) {
  if (isPro) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full ${compact ? 'text-xs' : 'text-sm'}`}>
        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        <span className="font-semibold text-green-400">Pro</span>
      </div>
    )
  }

  if (compact) {
    return (
      <Link href="/upgrade">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)] rounded-full text-xs hover:bg-[rgba(0,255,136,0.2)] transition-all cursor-pointer">
          <span className="font-semibold text-[#888888]">Free</span>
          <span className="text-[#00ff88]">→ Upgrade</span>
        </div>
      </Link>
    )
  }

  return (
    <Link href="/upgrade">
      <Button size="sm" className="bg-[#00ff88] text-[#030303] hover:bg-[#00cc6a] font-bold">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        Upgrade
      </Button>
    </Link>
  )
}
