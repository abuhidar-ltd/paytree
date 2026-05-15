"use client"

import { useEffect, useState, useRef } from "react"
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip as ChartTooltip, ResponsiveContainer, Cell,
} from "recharts"
import dynamic from "next/dynamic"

const AudienceTable = dynamic(
  () => import("@/components/ui/audience-table").then((m) => m.AudienceTable),
  { ssr: false },
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewStats {
  totalViews: number
  viewsTrend: number
  uniqueViews: number
  uniqueViewsLast7Days: number
  totalViewsLast7Days: number
  totalClicks: number
  clicksTrend: number
  ctr: number
  totalAudience: number
  vaultUnlocks: number
  vaultConversionRate: number
}

interface ViewData { date: string; views: number; unique: number }

interface GeoPoint { lat: number; lng: number; country: string | null; city: string | null }
interface GeoData {
  topCountries: { country: string; count: number }[]
  points: GeoPoint[]
}

interface LinkStat {
  id: string
  title: string
  icon: string | null
  totalClicks: number
  isFolder: boolean
  isVaultItem: boolean
}
interface ClickData {
  totalClicks: number
  linkStats: LinkStat[]
  chartData: { date: string; clicks: number }[]
}

interface Product {
  id: string
  title: string
  price: number
  totalRevenue: number
  salesCount: number
}

interface RenderedDot {
  px: number; py: number; count: number; country: string; city: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COUNTRY_CODES: Record<string, string> = {
  "United States": "US", "United Kingdom": "GB", "Germany": "DE",
  "France": "FR", "Canada": "CA", "Australia": "AU", "Brazil": "BR",
  "India": "IN", "Japan": "JP", "China": "CN", "Russia": "RU",
  "Mexico": "MX", "Spain": "ES", "Italy": "IT", "Netherlands": "NL",
  "South Korea": "KR", "Indonesia": "ID", "Saudi Arabia": "SA",
  "Turkey": "TR", "Poland": "PL", "Argentina": "AR", "Nigeria": "NG",
  "South Africa": "ZA", "Egypt": "EG", "Pakistan": "PK",
  "Philippines": "PH", "Thailand": "TH", "Vietnam": "VN",
  "Malaysia": "MY", "Singapore": "SG", "Sweden": "SE", "Norway": "NO",
  "Denmark": "DK", "Finland": "FI", "Switzerland": "CH", "Austria": "AT",
  "Belgium": "BE", "Portugal": "PT", "Greece": "GR", "Ukraine": "UA",
  "United Arab Emirates": "AE", "Israel": "IL", "Chile": "CL",
  "Colombia": "CO", "New Zealand": "NZ", "Ireland": "IE", "Taiwan": "TW",
  "Hong Kong": "HK", "Bangladesh": "BD", "Kenya": "KE", "Ghana": "GH",
  "Peru": "PE", "Venezuela": "VE", "Czech Republic": "CZ", "Romania": "RO",
}

function countryFlag(name: string): string {
  const code = COUNTRY_CODES[name]
  if (!code) return "🌍"
  return [...code].map((c) => String.fromCodePoint(0x1f1e0 + c.charCodeAt(0) - 65)).join("")
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function fmtRevenue(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function Spinner() {
  return (
    <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#00ff88] animate-spin" />
  )
}

// Simplified continent outlines as [lat, lng] polygon arrays
const CONTINENTS: [number, number][][] = [
  // North America
  [[70,-141],[60,-147],[54,-130],[48,-124],[37,-122],[22,-106],[14,-90],[8,-77],
   [22,-87],[25,-90],[29,-89],[25,-81],[35,-76],[41,-70],[44,-66],[47,-52],
   [52,-56],[60,-64],[62,-78],[66,-86],[70,-90],[75,-95],[70,-141]],
  // South America
  [[12,-72],[8,-62],[5,-52],[-5,-35],[-15,-38],[-23,-43],[-33,-52],
   [-40,-62],[-54,-68],[-52,-75],[-38,-73],[-18,-70],[-5,-80],[0,-78],[5,-77],[8,-77],[12,-72]],
  // Europe
  [[36,-8],[42,-8],[44,-1],[50,2],[54,8],[58,6],[68,14],[70,28],[60,28],[59,24],
   [55,21],[54,18],[50,14],[47,22],[44,28],[42,28],[40,22],[38,22],[40,18],[44,14],
   [44,12],[38,16],[38,13],[37,12],[38,10],[44,8],[44,4],[42,4],[37,0],[36,-5],[36,-8]],
  // Africa
  [[35,-5],[36,10],[33,13],[30,20],[22,30],[12,43],[2,45],[-10,40],[-20,35],[-26,32],
   [-34,26],[-34,18],[-28,15],[-18,12],[-5,12],[4,8],[5,2],[5,-6],[5,-8],[8,-14],
   [12,-17],[20,-17],[28,-12],[35,-5]],
  // Asia
  [[42,27],[36,28],[36,36],[32,35],[28,34],[22,38],[18,42],[12,44],[12,52],
   [22,60],[24,62],[20,72],[14,74],[8,78],[12,80],[20,86],[20,90],[22,92],
   [16,98],[4,100],[1,104],[4,110],[16,108],[22,114],[32,122],[38,122],[42,130],
   [48,140],[54,140],[60,150],[52,158],[56,162],[64,172],
   [70,140],[73,120],[73,80],[70,68],[62,62],[54,55],[50,52],[44,52],[40,48],
   [36,54],[36,58],[38,65],[32,62],[25,63],[24,57],[26,56],[28,48],[30,48],
   [33,44],[36,38],[37,36],[38,28],[42,27]],
  // Australia
  [[-14,127],[-12,136],[-14,140],[-12,142],[-18,148],[-28,154],[-34,151],
   [-38,148],[-38,140],[-34,136],[-32,130],[-26,114],[-22,114],[-18,122],[-14,127]],
]

// ─── Globe (canvas) ───────────────────────────────────────────────────────────

function GlobeCanvas({ points }: { points: GeoPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef(0)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const dotsRef = useRef<RenderedDot[]>([])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rawCtx = canvas.getContext("2d")
    if (!rawCtx) return
    const ctx: CanvasRenderingContext2D = rawCtx

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const cx = W / 2
    const cy = H / 2
    const r = Math.min(W, H) / 2 - 18

    function project(lat: number, lng: number): [number, number, number] {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)
      const x0 = Math.sin(phi) * Math.cos(theta)
      const y0 = Math.cos(phi)
      const z0 = Math.sin(phi) * Math.sin(theta)
      const rot = rotRef.current
      const c = Math.cos(rot)
      const s = Math.sin(rot)
      const xr = x0 * c - z0 * s
      const yr = y0
      const zr = x0 * s + z0 * c
      return [cx + xr * r, cy - yr * r, zr]
    }

    function drawGridSegment(coords: [number, number][]) {
      let started = false
      for (const [lat, lng] of coords) {
        const [px, py, z] = project(lat, lng)
        if (z >= -0.02) {
          if (!started) { ctx.beginPath(); ctx.moveTo(px, py); started = true }
          else ctx.lineTo(px, py)
        } else if (started) {
          ctx.stroke()
          started = false
        }
      }
      if (started) ctx.stroke()
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // Sphere gradient
      const bg = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 0, cx, cy, r)
      bg.addColorStop(0, "#121212")
      bg.addColorStop(1, "#030303")
      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()

      // Clip grid to sphere
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.strokeStyle = "rgba(0,255,136,0.08)"
      ctx.lineWidth = 0.6

      // Latitude lines
      for (const lat of [-60, -30, 0, 30, 60]) {
        const coords: [number, number][] = []
        for (let lng = -180; lng <= 180; lng += 4) coords.push([lat, lng])
        drawGridSegment(coords)
      }
      // Longitude lines
      for (let lng = -180; lng < 180; lng += 30) {
        const coords: [number, number][] = []
        for (let lat = -90; lat <= 90; lat += 4) coords.push([lat, lng])
        drawGridSegment(coords)
      }
      ctx.restore()

      // Draw continent outlines
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.strokeStyle = "rgba(0,255,136,0.15)"
      ctx.lineWidth = 0.8
      for (const poly of CONTINENTS) {
        ctx.beginPath()
        let penDown = false
        for (const [lat, lng] of poly) {
          const [px, py, z] = project(lat, lng)
          if (z > 0) {
            if (!penDown) { ctx.moveTo(px, py); penDown = true }
            else ctx.lineTo(px, py)
          } else if (penDown) {
            ctx.stroke()
            ctx.beginPath()
            penDown = false
          }
        }
        if (penDown) ctx.stroke()
      }
      ctx.restore()

      // Aggregate geo dots by bucketed location
      const dotMap = new Map<string, RenderedDot>()
      for (const pt of points) {
        const [px, py, z] = project(pt.lat, pt.lng)
        if (z < 0) continue
        const key = `${Math.round(pt.lat * 3)},${Math.round(pt.lng * 3)}`
        const ex = dotMap.get(key)
        if (ex) { ex.count++; ex.px = px; ex.py = py }
        else dotMap.set(key, { px, py, count: 1, country: pt.country ?? "", city: pt.city ?? "" })
      }
      dotsRef.current = [...dotMap.values()]

      for (const d of dotsRef.current) {
        const sz = Math.max(2.5, Math.min(1.5 + d.count * 0.7, 7.5))
        const glow = ctx.createRadialGradient(d.px, d.py, 0, d.px, d.py, sz * 4.5)
        glow.addColorStop(0, `rgba(0,255,136,${Math.min(0.6, 0.22 + d.count * 0.08)})`)
        glow.addColorStop(1, "rgba(0,255,136,0)")
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(d.px, d.py, sz * 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#00ff88"
        ctx.beginPath()
        ctx.arc(d.px, d.py, sz, 0, Math.PI * 2)
        ctx.fill()
      }

      // Atmosphere rim glow
      const atm = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.06)
      atm.addColorStop(0, "rgba(0,255,136,0)")
      atm.addColorStop(1, "rgba(0,255,136,0.1)")
      ctx.fillStyle = atm
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.06, 0, Math.PI * 2)
      ctx.fill()
    }

    let animId: number
    function tick() {
      if (!dragging.current) rotRef.current += 0.004
      draw()
      animId = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(animId)
  }, [points])

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    lastX.current = e.clientX
  }
  function onMouseMove(e: React.MouseEvent) {
    if (dragging.current) {
      rotRef.current += (e.clientX - lastX.current) * 0.006
      lastX.current = e.clientX
    }
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    for (const d of dotsRef.current) {
      if (Math.hypot(mx - d.px, my - d.py) < 14) {
        const place = d.city ? `${d.city}, ${d.country}` : d.country
        setTooltip({ x: mx, y: my - 48, text: `${place} · ${d.count} ${d.count === 1 ? "visit" : "visits"}` })
        return
      }
    }
    setTooltip(null)
  }
  function onMouseUp() { dragging.current = false }

  function onTouchStart(e: React.TouchEvent) { lastX.current = e.touches[0].clientX }
  function onTouchMove(e: React.TouchEvent) {
    rotRef.current += (e.touches[0].clientX - lastX.current) * 0.006
    lastX.current = e.touches[0].clientX
  }

  return (
    <div className="relative w-full h-[300px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
      />
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-[#e0e0e0] whitespace-nowrap shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, trend, accent = false,
}: {
  label: string
  value: string
  sub?: string
  trend?: number
  accent?: boolean
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">{label}</div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-2xl sm:text-3xl font-bold font-mono ${accent ? "text-[#00ff88]" : "text-white"}`}>
          {value}
        </span>
        {trend !== undefined && (
          <span className={`text-xs font-mono font-semibold ${trend >= 0 ? "text-[#00ff88]" : "text-red-400"}`}>
            {trend >= 0 ? "↑" : "↓"}{Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <div className="text-[11px] font-mono text-[#444]">{sub}</div>}
    </div>
  )
}

// ─── Custom recharts tooltip ───────────────────────────────────────────────────

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-[#555] mb-0.5">{label}</div>
      <div className="text-[#00ff88]">{payload[0].value} views</div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [viewsData, setViewsData] = useState<ViewData[]>([])
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [clickData, setClickData] = useState<ClickData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      fetch("/api/analytics/overview"),
      fetch(`/api/analytics/views?period=${period}`),
      fetch("/api/analytics/views?geo=true"),
      fetch(`/api/analytics/clicks?period=${period}`),
      fetch("/api/products"),
    ]).then(async (results) => {
      const [ovR, viewsR, geoR, clicksR, prodsR] = results
      if (ovR.status === "fulfilled" && ovR.value.ok) setOverview(await ovR.value.json())
      if (viewsR.status === "fulfilled" && viewsR.value.ok) setViewsData(await viewsR.value.json())
      if (geoR.status === "fulfilled" && geoR.value.ok) setGeoData(await geoR.value.json())
      if (clicksR.status === "fulfilled" && clicksR.value.ok) setClickData(await clicksR.value.json())
      if (prodsR.status === "fulfilled" && prodsR.value.ok) {
        const data = await prodsR.value.json()
        setProducts(Array.isArray(data) ? data : [])
      }
      setLoading(false)
    })
  }, [period])

  const totalRevenue = products.reduce((s, p) => s + (p.totalRevenue || 0), 0)
  const totalSales = products.reduce((s, p) => s + (p.salesCount || 0), 0)

  const funnelSteps = [
    { label: "Visited", value: overview?.totalViews ?? 0 },
    { label: "Clicked link", value: overview?.totalClicks ?? 0 },
    { label: "Email captured", value: overview?.totalAudience ?? 0 },
    { label: "Purchased", value: totalSales },
  ]
  const funnelMax = funnelSteps[0].value || 1

  const topCountries = geoData?.topCountries.slice(0, 7) ?? []
  const countryMax = topCountries[0]?.count || 1
  const topLinks = clickData?.linkStats.slice(0, 5) ?? []

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-7 pb-5">
        <h1 className="text-base font-bold text-white">Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input-obsidian text-sm py-1.5 px-3 w-auto"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="px-6 pb-12 space-y-5">

        {/* ── Section 1: Stats row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Page Views"
            value={loading ? "—" : fmt(overview?.totalViews ?? 0)}
            trend={overview?.viewsTrend}
            sub={`${fmt(overview?.totalViewsLast7Days ?? 0)} this week`}
          />
          <StatCard
            label="Unique Visitors"
            value={loading ? "—" : fmt(overview?.uniqueViews ?? 0)}
            sub={`${fmt(overview?.uniqueViewsLast7Days ?? 0)} this week`}
          />
          <StatCard
            label="Emails Captured"
            value={loading ? "—" : fmt(overview?.totalAudience ?? 0)}
            sub={`${overview?.vaultConversionRate ?? 0}% conversion`}
            accent
          />
          <StatCard
            label="Revenue"
            value={loading ? "—" : fmtRevenue(totalRevenue)}
            sub={`${totalSales} ${totalSales === 1 ? "sale" : "sales"}`}
          />
        </div>

        {/* ── Section 2: Main layout ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[3fr,2fr] gap-5 items-start">

          {/* Left column */}
          <div className="space-y-5">

            {/* Globe */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                  Visitor locations
                </span>
                <span className="text-xs font-mono text-[#00ff88]">
                  {geoData ? `${geoData.topCountries.length} countries` : "—"}
                </span>
              </div>
              <GlobeCanvas points={geoData?.points ?? []} />
            </div>

            {/* Daily views bar chart */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                  Daily views
                </span>
                <span className="text-[10px] font-mono text-[#444]">{period} days</span>
              </div>
              {loading ? (
                <div className="h-[180px] flex items-center justify-center">
                  <Spinner />
                </div>
              ) : viewsData.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-[#444] text-sm font-mono">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={viewsData} barGap={2} barCategoryGap="25%">
                    <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: "#444", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <ChartTooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="views" radius={[3, 3, 0, 0]} maxBarSize={18}>
                      {viewsData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === viewsData.length - 1 ? "#00ff88" : "rgba(0,255,136,0.35)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Top countries */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-4">
                Top countries
              </div>
              {loading ? (
                <div className="h-32 flex items-center justify-center"><Spinner /></div>
              ) : topCountries.length === 0 ? (
                <div className="text-center py-6 text-[#444] text-xs font-mono">
                  No geo data yet — views will populate once visitors arrive
                </div>
              ) : (
                <div className="space-y-3">
                  {topCountries.map(({ country, count }, i) => (
                    <div key={country} className="flex items-center gap-3">
                      <span className="w-7 text-center text-base flex-shrink-0 leading-none">
                        {countryFlag(country)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-[#e0e0e0] truncate">{country}</span>
                          <span className="text-xs font-mono text-[#888] ml-2 flex-shrink-0">{count}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.05]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(count / countryMax) * 100}%`,
                              background: "#00ff88",
                              opacity: Math.max(0.35, 1 - i * 0.1),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversion funnel */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-4">
                Conversion funnel
              </div>
              <div className="space-y-3">
                {funnelSteps.map((step, i) => {
                  const pct = Math.round((step.value / funnelMax) * 100)
                  return (
                    <div key={step.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-[#888]">{step.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#e0e0e0]">{fmt(step.value)}</span>
                          {i > 0 && (
                            <span className="text-[10px] font-mono text-[#555]">{pct}%</span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.04]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `rgba(0,255,136,${0.95 - i * 0.18})`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top performing blocks */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-4">
                Top blocks
              </div>
              {loading ? (
                <div className="h-24 flex items-center justify-center"><Spinner /></div>
              ) : topLinks.length === 0 ? (
                <div className="text-center py-4 text-[#444] text-xs font-mono">No clicks yet</div>
              ) : (
                <div className="space-y-1">
                  {topLinks.map((link, i) => (
                    <div key={link.id} className="flex items-center gap-2.5 py-1.5">
                      <span className="text-[#333] font-mono text-[10px] w-4 flex-shrink-0 text-right">
                        {i + 1}
                      </span>
                      <span className="text-base flex-shrink-0 leading-none">{link.icon || "🔗"}</span>
                      <span className="flex-1 text-xs font-mono text-[#e0e0e0] truncate">{link.title}</span>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 ${
                          link.isVaultItem
                            ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20"
                            : link.isFolder
                            ? "bg-white/[0.05] text-[#555] border border-white/[0.07]"
                            : "bg-white/[0.04] text-[#444] border border-white/[0.06]"
                        }`}
                      >
                        {link.isVaultItem ? "Vault" : link.isFolder ? "Portal" : "Link"}
                      </span>
                      <span className="text-xs font-mono text-[#00ff88] w-10 text-right flex-shrink-0">
                        {fmt(link.totalClicks)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Audience CRM ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">
              Audience CRM
            </div>
            <a
              href="/api/audience/export"
              download
              className="text-xs font-mono text-[#00ff88] hover:opacity-75 transition-opacity"
            >
              Export CSV →
            </a>
          </div>
          <AudienceTable />
        </div>

      </div>
    </div>
  )
}
