"use client"

import Link from "next/link"
import { Button } from "./button"

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  username?: string
}

export function PaywallModal({ isOpen, onClose, username }: PaywallModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl max-w-md w-full p-8 border border-white/10 shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Celebration Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
          <span className="text-4xl">🎉</span>
        </div>

        {/* Content - Positive, encouraging tone */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-3">
            Your Page is Ready!
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Everything looks great. To make it permanent and share your link with the world, upgrade to Starter.
          </p>
        </div>

        {/* What they get */}
        <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10">
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-3xl font-bold text-white">$4.99</span>
              <span className="text-gray-400">/month</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              7-day free trial
            </span>
          </div>
          
          <ul className="space-y-2 text-sm">
            {[
              "Your permanent link: paytree.com/" + (username || "you"),
              "Unlimited payment links",
              "All premium designs",
              "Analytics & insights",
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-300">
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Primary CTA - Link to upgrade page */}
          <Link href="/upgrade">
            <Button
              className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-green-500/30"
            >
              🚀 Upgrade & Publish
            </Button>
          </Link>

          {/* Secondary */}
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full h-12 text-gray-400 hover:text-white"
          >
            Keep Editing
          </Button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Cancel anytime. Your design is saved.
        </p>
      </div>
    </div>
  )
}
