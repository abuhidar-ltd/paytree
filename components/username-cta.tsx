"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function UsernameCTA() {
  const [username, setUsername] = useState("")
  const router = useRouter()

  const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, "")
  const previewUrl = sanitizedUsername ? `paytree.to/${sanitizedUsername}` : "paytree.to/yourname"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sanitizedUsername) {
      // /start (not /join) — TikTok's URL safety filter blocks auth-keyword paths
      router.push(`/start?username=${sanitizedUsername}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="glass rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl animate-scale-in">
        <div className="flex-1 relative">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose your username"
            className="w-full h-14 px-6 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition-all"
            autoComplete="off"
          />
          {username && (
            <div className="absolute left-6 -bottom-7 text-sm text-gray-400 font-mono animate-fade-in">
              {previewUrl}
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={!sanitizedUsername}
          className="h-14 px-8 bg-[#00ff88] hover:bg-[#00cc6a] text-[#030303] rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(0,255,136,0.3)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Claim Your Page →
        </Button>
      </div>
      <p className="text-center text-sm text-gray-400 mt-10">
        ✓ Free to start • ✓ No credit card required • ✓ 7-day trial on Pro
      </p>
    </form>
  )
}

