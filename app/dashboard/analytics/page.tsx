"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import { GlassBrick } from "@/components/ui/obsidian-card"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import dynamic from "next/dynamic"

// Lazy-load recharts-heavy analytics components
const ViewsChart = dynamic(() => import("@/components/ui/analytics-charts").then(m => m.ViewsChart), { ssr: false })
const ClicksChart = dynamic(() => import("@/components/ui/analytics-charts").then(m => m.ClicksChart), { ssr: false })
const ReferralsChart = dynamic(() => import("@/components/ui/analytics-charts").then(m => m.ReferralsChart), { ssr: false })
const ReferralsPieChart = dynamic(() => import("@/components/ui/analytics-charts").then(m => m.ReferralsPieChart), { ssr: false })
const VaultUnlocksChart = dynamic(() => import("@/components/ui/analytics-charts").then(m => m.VaultUnlocksChart), { ssr: false })
const AudienceTable = dynamic(() => import("@/components/ui/audience-table").then(m => m.AudienceTable), { ssr: false })

// Types
interface OverviewStats {
  totalViews: number
  totalViewsLast7Days: number
  viewsTrend: number
  uniqueViews: number
  uniqueViewsLast7Days: number
  totalClicks: number
  totalClicksLast7Days: number
  clicksTrend: number
  ctr: number
  totalAudience: number
  vaultUnlocks: number
  vaultConversionRate: number
}

interface ViewData {
  date: string
  views: number
  unique: number
}

interface ReferralData {
  name: string
  count: number
  percentage: number
  color: string
  [key: string]: string | number
}

interface VaultStats {
  totalUnlocks: number
  recentUnlocks: number
  itemStats: {
    id: string
    title: string
    icon: string | null
    totalUnlocks: number
    recentUnlocks: number
  }[]
  chartData: { date: string; unlocks: number }[]
  itemCount: number
}

type Tab = "overview" | "audience" | "vault"

export default function AnalyticsDashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")
  const [userPlan, setUserPlan] = useState<string>("free")
  
  // Data states
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [viewsData, setViewsData] = useState<ViewData[]>([])
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [vaultStats, setVaultStats] = useState<VaultStats | null>(null)
  
  const isPro = userPlan === "pro"
  
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login")
    }
  }, [isLoaded, user, router])

  // Fetch user plan
  useEffect(() => {
    if (!user) return
    fetch("/api/profile").then(r => r.json()).then(data => {
      if (data.subscriptionPlan) setUserPlan(data.subscriptionPlan)
    }).catch(() => {})
  }, [user])
  
  // Fetch data
  useEffect(() => {
    if (!user) return
    
    const fetchData = async () => {
      setLoading(true)
      try {
        const fetches: Promise<Response>[] = [
          fetch("/api/analytics/overview"),
          fetch(`/api/analytics/views?period=${period}`),
          fetch(`/api/analytics/vault?period=${period}`),
        ]
        // Only fetch referrals for Pro
        if (isPro) {
          fetches.push(fetch(`/api/analytics/referrals?period=${period}`))
        }

        const results = await Promise.all(fetches)
        
        if (results[0].ok) setOverview(await results[0].json())
        if (results[1].ok) setViewsData(await results[1].json())
        if (results[2].ok) setVaultStats(await results[2].json())
        if (isPro && results[3]?.ok) {
          const data = await results[3].json()
          setReferrals(data.referrals || [])
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, period, isPro])
  
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303]">
        <PremiumBackground />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#888888]">Loading analytics...</p>
        </div>
      </div>
    )
  }
  
  const TrendIndicator = ({ value }: { value: number }) => (
    <span className={`text-xs font-bold ${value >= 0 ? "text-[#00ff88]" : "text-red-500"}`}>
      {value >= 0 ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  )
  
  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <PremiumBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(3,3,3,0.8)] backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-[#888888] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-[rgba(255,255,255,0.1)]" />
            <h1 className="text-lg font-bold text-white">Analytics</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input-obsidian text-sm py-2 px-3 min-w-[120px]"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            
            <SignOutButton>
              <button className="btn-obsidian text-sm">Sign Out</button>
            </SignOutButton>
          </div>
        </div>
      </header>
      
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview" as Tab, label: "Overview", icon: "📊" },
            { id: "audience" as Tab, label: "Audience CRM", icon: "👥" },
            { id: "vault" as Tab, label: "Vault Analytics", icon: "🔒" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.3)]"
                  : "text-[#888888] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Total Views</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">
                    {loading ? "—" : overview?.totalViews.toLocaleString()}
                  </span>
                  {overview && <TrendIndicator value={overview.viewsTrend} />}
                </div>
                <p className="text-xs text-[#555555] mt-1">
                  {overview?.totalViewsLast7Days.toLocaleString() || 0} this week
                </p>
              </GlassBrick>
              
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Unique Visitors</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">
                    {loading ? "—" : overview?.uniqueViews.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[#555555] mt-1">
                  {overview?.uniqueViewsLast7Days.toLocaleString() || 0} this week
                </p>
              </GlassBrick>
              
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Total Clicks</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">
                    {loading ? "—" : overview?.totalClicks.toLocaleString()}
                  </span>
                  {overview && <TrendIndicator value={overview.clicksTrend} />}
                </div>
                <p className="text-xs text-[#555555] mt-1">
                  {overview?.ctr || 0}% CTR
                </p>
              </GlassBrick>
              
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Emails Captured</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#00ff88]">
                    {loading ? "—" : overview?.totalAudience.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[#555555] mt-1">
                  {overview?.vaultConversionRate || 0}% conversion
                </p>
              </GlassBrick>
            </div>
            
            {/* Views Chart */}
            <GlassBrick className="p-6">
              <h3 className="font-bold text-white mb-4">Views Over Time</h3>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin" />
                </div>
              ) : (
                <ViewsChart data={viewsData} height={300} />
              )}
            </GlassBrick>
            
            {/* Referrals - Pro only */}
            {isPro ? (
              <div className="grid md:grid-cols-2 gap-6">
                <GlassBrick className="p-6">
                  <h3 className="font-bold text-white mb-4">Traffic Sources</h3>
                  {loading ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin" />
                    </div>
                  ) : referrals.length > 0 ? (
                    <ReferralsChart data={referrals} height={200} />
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-[#888888]">
                      <p>No referral data yet</p>
                    </div>
                  )}
                </GlassBrick>
                
                <GlassBrick className="p-6">
                  <h3 className="font-bold text-white mb-4">Source Distribution</h3>
                  {loading ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin" />
                    </div>
                  ) : referrals.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <ReferralsPieChart data={referrals} height={200} />
                      <div className="space-y-2 flex-1">
                        {referrals.slice(0, 5).map((ref) => (
                          <div key={ref.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: ref.color }}
                            />
                            <span className="text-sm text-[#888888] flex-1">{ref.name}</span>
                            <span className="text-sm font-medium text-white">{ref.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-[#888888]">
                      <p>No referral data yet</p>
                    </div>
                  )}
                </GlassBrick>
              </div>
            ) : (
              <GlassBrick className="p-6 text-center">
                <h3 className="font-bold text-white mb-2">Traffic Sources</h3>
                <p className="text-sm text-[#888888] mb-4">Upgrade to Pro to see where your visitors come from.</p>
                <Link href="/pricing">
                  <button className="px-6 py-2.5 rounded-xl bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.3)] text-sm font-bold hover:bg-[rgba(0,255,136,0.2)] transition-all">
                    Upgrade to Pro
                  </button>
                </Link>
              </GlassBrick>
            )}
          </div>
        )}
        
        {/* Audience CRM Tab */}
        {activeTab === "audience" && (
          <div className="space-y-6">
            {/* Audience Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Total Emails</p>
                <span className="text-3xl font-bold text-[#00ff88]">
                  {overview?.totalAudience.toLocaleString() || 0}
                </span>
              </GlassBrick>
              
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">From Vault</p>
                <span className="text-3xl font-bold text-white">
                  {overview?.vaultUnlocks.toLocaleString() || 0}
                </span>
              </GlassBrick>
              
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Conversion Rate</p>
                <span className="text-3xl font-bold text-white">
                  {overview?.vaultConversionRate || 0}%
                </span>
              </GlassBrick>
              
              <GlassBrick className="p-5 flex flex-col justify-between">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Export</p>
                <a
                  href="/api/audience/export"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.3)] text-sm font-bold hover:bg-[rgba(0,255,136,0.2)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </a>
              </GlassBrick>
            </div>
            
            {/* Audience Table */}
            <AudienceTable />
          </div>
        )}
        
        {/* Vault Analytics Tab */}
        {activeTab === "vault" && (
          <div className="space-y-6">
            {/* Vault Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Total Unlocks</p>
                <span className="text-3xl font-bold text-[#00ff88]">
                  {vaultStats?.totalUnlocks.toLocaleString() || 0}
                </span>
              </GlassBrick>
              
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Recent Unlocks</p>
                <span className="text-3xl font-bold text-white">
                  {vaultStats?.recentUnlocks.toLocaleString() || 0}
                </span>
                <p className="text-xs text-[#555555] mt-1">Last {period} days</p>
              </GlassBrick>
              
              <GlassBrick className="p-5">
                <p className="text-xs font-bold uppercase text-[#888888] mb-2">Vault Items</p>
                <span className="text-3xl font-bold text-white">
                  {vaultStats?.itemCount || 0}
                </span>
              </GlassBrick>
            </div>
            
            {/* Unlocks Chart */}
            <GlassBrick className="p-6">
              <h3 className="font-bold text-white mb-4">Unlocks Over Time</h3>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[rgba(0,255,136,0.3)] border-t-[#00ff88] rounded-full animate-spin" />
                </div>
              ) : vaultStats?.chartData ? (
                <VaultUnlocksChart data={vaultStats.chartData} height={200} />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-[#888888]">
                  <p>No unlock data yet</p>
                </div>
              )}
            </GlassBrick>
            
            {/* Item Performance */}
            <GlassBrick className="p-6">
              <h3 className="font-bold text-white mb-4">Item Performance</h3>
              <div className="space-y-3">
                {vaultStats?.itemStats.length ? (
                  vaultStats.itemStats.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-lg">
                        {item.icon || "🔒"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{item.title}</p>
                        <p className="text-xs text-[#888888]">
                          {item.recentUnlocks} unlocks this period
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#00ff88]">{item.totalUnlocks}</p>
                        <p className="text-xs text-[#888888]">total</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#888888]">
                    <div className="text-3xl mb-2 opacity-40">🔒</div>
                    <p>No vault items yet</p>
                    <p className="text-sm mt-1">Create vault items in your dashboard</p>
                  </div>
                )}
              </div>
            </GlassBrick>
          </div>
        )}
      </main>
    </div>
  )
}

