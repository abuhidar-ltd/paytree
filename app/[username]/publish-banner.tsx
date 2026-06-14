"use client"

import { useState } from "react"
import { toast } from "sonner"

interface PublishBannerProps {
  username: string
  canPublish: boolean
}

export function PublishBanner({ username }: PublishBannerProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePublish = async () => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/publish', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        toast.success("Your page is now live!")
        window.location.reload()
      } else {
        toast.error(data.error || "Failed to publish")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Publish error:", error)
      toast.error("Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[rgba(0,255,136,0.1)] backdrop-blur-xl border-b border-[rgba(0,255,136,0.2)] text-white py-4 px-4">
      
      <div className="container mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(0,255,136,0.2)] flex items-center justify-center">
            <span className="text-xl">👀</span>
          </div>
          <div>
            <p className="font-bold text-white">Preview Mode</p>
            <p className="text-sm text-[#888888]">Publish to get your permanent shareable link</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right mr-2">
            <p className="text-sm text-[#888888]">Your link will be:</p>
            <p className="font-mono text-sm font-bold text-[#00ff88]">paytree.to/{username}</p>
          </div>
          
          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-6 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Publishing...
              </>
            ) : (
              <>Publish Now</>
            )}
          </button>
          
          <a
            href="/dashboard/studio"
            className="bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] font-mono rounded-xl px-4 py-2.5 text-sm hover:border-white/20 transition-colors"
          >
            Edit
          </a>
        </div>
      </div>
    </div>
  )
}
