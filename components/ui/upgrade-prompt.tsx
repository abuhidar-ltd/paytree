"use client"

import Link from "next/link"
import { Button } from "./button"

interface UpgradePromptProps {
  feature: string
  description?: string
  inline?: boolean
  onDismiss?: () => void
}

export function UpgradePrompt({ 
  feature, 
  description, 
  inline = false,
  onDismiss 
}: UpgradePromptProps) {
  if (inline) {
    return (
      <div className="glass rounded-xl p-4 border-2 border-[rgba(0,255,136,0.3)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00ff88] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white mb-1">
              Upgrade to Pro for {feature}
            </div>
            {description && (
              <div className="text-sm text-gray-400 mb-3">
                {description}
              </div>
            )}
            <Link href="/pricing">
              <Button size="sm" className="bg-[#00ff88] text-[#030303] hover:bg-[#00cc6a] font-bold">
                View Plans →
              </Button>
            </Link>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#00ff88] flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,136,0.3)]">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold mb-2">Upgrade to Pro</h3>
      <p className="text-gray-400 mb-6">
        Unlock {feature} and more premium features
      </p>
      {description && (
        <p className="text-sm text-gray-500 mb-6">
          {description}
        </p>
      )}
      <Link href="/pricing">
        <Button className="bg-[#00ff88] text-[#030303] hover:bg-[#00cc6a] font-bold h-12 px-8 text-lg">
          View Pricing Plans
        </Button>
      </Link>
    </div>
  )
}
