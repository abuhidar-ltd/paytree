"use client"

import Link from "next/link"
import { ProfileHeader } from "@/components/profile-header"
import { LinkCard } from "@/components/ui/link-card"

interface ProfileLink {
  id: string
  title: string
  url: string
}

interface User {
  id: string
  name: string | null
  username: string
  bio: string | null
  image: string | null
  links: ProfileLink[]
}

interface ProfileViewProps {
  user: User
}

export default function ProfileView({ user }: ProfileViewProps) {
  // Non-blocking click tracking
  const trackClick = (linkId: string) => {
    try {
      const data = JSON.stringify({ linkId })
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/clicks", data)
      } else {
        fetch("/api/clicks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: data,
          keepalive: true,
        })
      }
    } catch (error) {
      // Silently fail
    }
  }

  // Determine theme based on username hash (simple deterministic way to give variation)
  // In a real app, this would be stored in the DB
  const themes = [
    "bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50",
    "bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50", 
    "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
    "bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100"
  ]
  
  const themeIndex = user.username.length % themes.length
  const bgClass = themes[themeIndex]

  return (
    <div className={`min-h-screen ${bgClass} relative overflow-hidden transition-colors duration-700`}>
      {/* Decorative background elements - Subtle & Abstract */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-white/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-white/40 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      {/* Main content - Centered & Mobile First */}
      <div className="relative container mx-auto px-4 py-12 sm:py-16 min-h-screen flex flex-col">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          
          {/* Profile Header */}
          <ProfileHeader
            name={user.name || user.username}
            username={user.username}
            bio={user.bio || undefined}
            image={user.image || undefined}
            className="mb-10 sm:mb-12"
            verified={true} // In real app, check user.isVerified
          />

          {/* Payment Links List */}
          <div className="space-y-4 mb-16 flex-1">
            {user.links.length === 0 ? (
              <div className="text-center py-12 px-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 animate-fade-in shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-md text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No links yet</h3>
                <p className="text-gray-500">This profile is just getting started.</p>
              </div>
            ) : (
              user.links.map((link, index) => (
                <div
                  key={link.id}
                  className="animate-slide-up opacity-0"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards' 
                  }}
                >
                  <LinkCard
                    title={link.title}
                    url={link.url}
                    onTrackClick={() => trackClick(link.id)}
                    variant="default"
                    icon={
                      link.title.toLowerCase().includes("coffee") ? "☕" :
                      link.title.toLowerCase().includes("call") ? "📞" :
                      link.title.toLowerCase().includes("art") ? "🎨" :
                      link.title.toLowerCase().includes("support") ? "💝" :
                      link.title.toLowerCase().includes("twitter") ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                      ) : undefined
                    }
                  />
                </div>
              ))
            )}
          </div>

          {/* Footer Branding */}
          <div className="mt-auto pt-8 pb-4 text-center animate-fade-in delay-500 opacity-0" style={{ animationFillMode: 'forwards' }}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-md rounded-full text-sm font-medium text-gray-600 hover:bg-white/60 hover:text-gray-900 transition-all hover:scale-105 shadow-sm border border-white/50"
            >
              <div className="w-4 h-4 bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] rounded-sm" />
              <span>Create your Paytree</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
