"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PremiumBackground } from "@/components/backgrounds/premium-background"

interface AnalyticsData {
  totalViews: number
  totalClicks: number
  conversionRate: number
  viewsToday: number
  clicksToday: number
  topLinks: Array<{
    id: string
    title: string
    clicks: number
    url: string
  }>
  recentActivity: Array<{
    type: "view" | "click"
    timestamp: string
    linkTitle?: string
  }>
  chartData: Array<{
    date: string
    views: number
    clicks: number
  }>
}

export default function AnalyticsPage() {
  const { data: session, isPending } = useSession()
  const user = session?.user
  const isLoaded = !isPending
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d")

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login")
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    if (isLoaded && user) {
      fetchAnalytics()
    }
  }, [isLoaded, user, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <PremiumBackground />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-champagne/30 border-t-champagne rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen text-white relative">
      <PremiumBackground />

      {/* Elegant Header */}
      <header className="relative z-10 border-b border-white/5 bg-navy-deep/60 backdrop-blur-xl sticky top-0 safe-top">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-champagne to-rose-gold shadow-champagne-glow" />
            <span className="text-platinum hidden sm:inline">Paytree</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="text-slate hover:text-platinum transition-colors text-sm min-h-[44px] flex items-center">
              Dashboard
            </Link>
            <Link href="/analytics" className="text-platinum font-semibold text-sm min-h-[44px] flex items-center">
              Analytics
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8 safe-bottom">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="heading-luxury-lg text-platinum mb-2">
              Analytics
            </h1>
            <p className="text-slate text-sm sm:text-base">Track your performance and engagement</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="glass-elegant rounded-xl p-1 flex gap-1 border border-white/5 self-start sm:self-auto">
            {[
              { label: "7 days", value: "7d" as const },
              { label: "30 days", value: "30d" as const },
              { label: "90 days", value: "90d" as const }
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setTimeRange(value)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm min-h-[44px] ${
                  timeRange === value
                    ? "bg-gradient-to-r from-champagne to-rose-gold text-navy-deep"
                    : "text-slate hover:text-platinum hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[
            {
              label: "Total Views",
              value: analytics?.totalViews || 0,
              change: "+12%",
              icon: "👁️",
            },
            {
              label: "Total Clicks",
              value: analytics?.totalClicks || 0,
              change: "+8%",
              icon: "🎯",
            },
            {
              label: "Conversion",
              value: `${analytics?.conversionRate || 0}%`,
              change: "+2.5%",
              icon: "📈",
            },
            {
              label: "Today",
              value: (analytics?.viewsToday || 0) + (analytics?.clicksToday || 0),
              change: "+5",
              icon: "⚡",
            }
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="glass-elegant rounded-2xl p-4 sm:p-6 shadow-elegant-md border border-white/5 hover:border-champagne/20 transition-all animate-elegant-scale-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="text-2xl sm:text-3xl">{stat.icon}</div>
                <div className="text-champagne text-xs sm:text-sm font-medium bg-champagne/10 px-2 py-1 rounded-lg border border-champagne/20">
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-platinum mb-1">{stat.value}</div>
              <div className="text-slate text-xs sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Views & Clicks Chart */}
          <div className="glass-elegant rounded-2xl p-4 sm:p-6 animate-elegant-slide-up shadow-elegant-md border border-white/5">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-platinum">Views & Clicks Over Time</h2>
            <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
              {analytics?.chartData?.map((day, i) => {
                const maxValue = Math.max(...(analytics?.chartData?.map(d => Math.max(d.views, d.clicks)) || [1]))
                const viewHeight = (day.views / maxValue) * 100
                const clickHeight = (day.clicks / maxValue) * 100
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex gap-0.5 sm:gap-1 items-end" style={{ height: '160px' }}>
                      <div
                        className="flex-1 bg-gradient-to-t from-champagne to-champagne/60 rounded-t-lg transition-all duration-500 hover:opacity-80 relative group"
                        style={{ height: `${viewHeight}%`, minHeight: viewHeight > 0 ? '4px' : '0' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 glass-elegant px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-champagne/20 hidden sm:block">
                          {day.views} views
                        </div>
                      </div>
                      <div
                        className="flex-1 bg-gradient-to-t from-rose-gold to-rose-gold/60 rounded-t-lg transition-all duration-500 hover:opacity-80 relative group"
                        style={{ height: `${clickHeight}%`, minHeight: clickHeight > 0 ? '4px' : '0' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 glass-elegant px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-champagne/20 hidden sm:block">
                          {day.clicks} clicks
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate mt-2 hidden sm:block">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-champagne" />
                <span className="text-xs sm:text-sm text-slate">Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-gold" />
                <span className="text-xs sm:text-sm text-slate">Clicks</span>
              </div>
            </div>
          </div>

          {/* Top Links */}
          <div className="glass-elegant rounded-2xl p-4 sm:p-6 animate-elegant-slide-up shadow-elegant-md border border-white/5" style={{ animationDelay: '100ms' }}>
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-platinum">Top Performing Links</h2>
            <div className="space-y-3 sm:space-y-4">
              {analytics?.topLinks?.length ? (
                analytics.topLinks.map((link, i) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 hover:border-champagne/20"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-champagne to-rose-gold flex items-center justify-center font-bold text-sm sm:text-lg text-navy-deep">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base truncate text-platinum">{link.title}</div>
                      <div className="text-xs sm:text-sm text-slate truncate">{link.url}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-base sm:text-lg text-champagne">{link.clicks}</div>
                      <div className="text-[10px] sm:text-xs text-slate">clicks</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate">
                  <div className="text-4xl mb-4 opacity-40">📊</div>
                  <p className="text-sm sm:text-base">No data yet. Share your profile to start tracking!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-elegant rounded-2xl p-4 sm:p-6 animate-elegant-slide-up shadow-elegant-md border border-white/5" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-platinum">Recent Activity</h2>
          <div className="space-y-3">
            {analytics?.recentActivity?.length ? (
              analytics.recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 hover:border-champagne/20"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.type === "view" ? "bg-champagne/20" : "bg-rose-gold/20"
                  }`}>
                    {activity.type === "view" ? "👁️" : "🎯"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base text-platinum">
                      {activity.type === "view" ? "Profile viewed" : `Clicked "${activity.linkTitle}"`}
                    </div>
                    <div className="text-xs sm:text-sm text-slate">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate">
                <div className="text-4xl mb-4 opacity-40">🔔</div>
                <p className="text-sm sm:text-base">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
