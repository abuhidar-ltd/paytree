"use client"

import { useEffect, useState, useRef, type ReactNode } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { useRouter } from "next/navigation"
import {
  Eye, Users, MousePointerClick, TrendingUp, ChevronRight, Sparkles, Lock,
  Smartphone, Monitor, Tablet, Link as LinkIcon, Globe, ArrowLeft,
} from "lucide-react"
import { glass, glassReflection } from "@/lib/glass"
import { resolveUserPlan } from "@/lib/plans"
import { trackEvent } from "@/lib/analytics"

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
  deviceBreakdown?: { device: string; count: number }[]
  referrerBreakdown?: { source: string; count: number }[]
}
interface ViewData { date: string; views: number; unique: number }
interface GeoPoint { lat: number; lng: number; country: string | null; city: string | null }
interface GeoData { topCountries: { country: string; count: number }[]; points: GeoPoint[] }
interface LinkStat {
  id: string; title: string; icon: string | null
  totalClicks: number; isFolder: boolean; isVaultItem: boolean
}
interface ClickData { totalClicks: number; linkStats: LinkStat[]; chartData: { date: string; clicks: number }[] }
interface Product { id: string; title: string; price: number; totalRevenue: number; salesCount: number }
interface RenderedDot { px: number; py: number; count: number; country: string; city: string }
interface ProfileData {
  subscriptionStatus?: string | null
  subscriptionPlan?: string | null
  trialEndsAt?: string | null
  subscriptionEndsAt?: string | null
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

// Count-up hook — eases from 0 → target on mount/value change
function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) { setValue(0); return }
    let start: number | null = null
    let frame: number
    const tick = (t: number) => {
      if (start === null) start = t
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

// Continent polygons used by the canvas globe
const CONTINENTS: [number, number][][] = [
  [[70,-141],[60,-147],[54,-130],[48,-124],[37,-122],[22,-106],[14,-90],[8,-77],
   [22,-87],[25,-90],[29,-89],[25,-81],[35,-76],[41,-70],[44,-66],[47,-52],
   [52,-56],[60,-64],[62,-78],[66,-86],[70,-90],[75,-95],[70,-141]],
  [[12,-72],[8,-62],[5,-52],[-5,-35],[-15,-38],[-23,-43],[-33,-52],
   [-40,-62],[-54,-68],[-52,-75],[-38,-73],[-18,-70],[-5,-80],[0,-78],[5,-77],[8,-77],[12,-72]],
  [[36,-8],[42,-8],[44,-1],[50,2],[54,8],[58,6],[68,14],[70,28],[60,28],[59,24],
   [55,21],[54,18],[50,14],[47,22],[44,28],[42,28],[40,22],[38,22],[40,18],[44,14],
   [44,12],[38,16],[38,13],[37,12],[38,10],[44,8],[44,4],[42,4],[37,0],[36,-5],[36,-8]],
  [[35,-5],[36,10],[33,13],[30,20],[22,30],[12,43],[2,45],[-10,40],[-20,35],[-26,32],
   [-34,26],[-34,18],[-28,15],[-18,12],[-5,12],[4,8],[5,2],[5,-6],[5,-8],[8,-14],
   [12,-17],[20,-17],[28,-12],[35,-5]],
  [[42,27],[36,28],[36,36],[32,35],[28,34],[22,38],[18,42],[12,44],[12,52],
   [22,60],[24,62],[20,72],[14,74],[8,78],[12,80],[20,86],[20,90],[22,92],
   [16,98],[4,100],[1,104],[4,110],[16,108],[22,114],[32,122],[38,122],[42,130],
   [48,140],[54,140],[60,150],[52,158],[56,162],[64,172],
   [70,140],[73,120],[73,80],[70,68],[62,62],[54,55],[50,52],[44,52],[40,48],
   [36,54],[36,58],[38,65],[32,62],[25,63],[24,57],[26,56],[28,48],[30,48],
   [33,44],[36,38],[37,36],[38,28],[42,27]],
  [[-14,127],[-12,136],[-14,140],[-12,142],[-18,148],[-28,154],[-34,151],
   [-38,148],[-38,140],[-34,136],[-32,130],[-26,114],[-22,114],[-18,122],[-14,127]],
]

// Demo dots when there is no real geo data yet
const DEMO_POINTS: GeoPoint[] = [
  { lat: 40.7, lng: -74.0, country: "United States", city: "New York" },
  { lat: 51.5, lng: -0.1, country: "United Kingdom", city: "London" },
  { lat: 35.7, lng: 139.7, country: "Japan", city: "Tokyo" },
  { lat: -33.9, lng: 151.2, country: "Australia", city: "Sydney" },
  { lat: 31.95, lng: 35.93, country: "Jordan", city: "Amman" },
  { lat: 25.2, lng: 55.3, country: "United Arab Emirates", city: "Dubai" },
]

// ─── Glass primitives ────────────────────────────────────────────────────────

function GlassCard({ children, className = "", padding = "p-5" }: {
  children: ReactNode; className?: string; padding?: string
}) {
  return (
    <div className={`relative overflow-hidden ${padding} ${className}`} style={glass.card}>
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: glassReflection }} />
      {children}
    </div>
  )
}

function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#444]">{children}</span>
      {right}
    </div>
  )
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, trend, sub, icon: Icon, accent = false,
}: {
  label: string
  value: number
  trend?: number
  sub?: string
  icon: typeof Eye
  accent?: boolean
}) {
  const animated = useCountUp(value)
  return (
    <GlassCard padding="p-6">
      <Icon size={16} className="absolute top-6 right-6 text-[#333]" />
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className={`text-[32px] leading-none font-bold tabular-nums ${accent ? "text-[#00ff88]" : "text-white"}`}>
          {fmt(animated)}
        </span>
        {trend !== undefined && Number.isFinite(trend) && trend !== 0 && (
          <span
            className={`text-xs font-mono font-semibold ${trend >= 0 ? "text-[#00ff88]" : "text-red-400"}`}
            aria-label={trend >= 0 ? "Up" : "Down"}
          >
            {trend >= 0 ? "↑" : "↓"}{Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <div className="text-[11px] font-mono text-[#555] mt-1.5">{sub}</div>}
    </GlassCard>
  )
}

// ─── Funnel strip ────────────────────────────────────────────────────────────

function FunnelStrip({ steps }: { steps: { label: string; value: number }[] }) {
  return (
    <GlassCard padding="px-5 py-3">
      <div className="flex items-center justify-between gap-3 overflow-x-auto">
        {steps.map((step, i) => {
          const prev = i > 0 ? steps[i - 1].value || 1 : 1
          const pct = i === 0 ? 100 : Math.round((step.value / prev) * 100)
          return (
            <div key={step.label} className="flex items-center gap-3 flex-shrink-0">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#444] truncate">
                  {step.label}
                </span>
                <span className="text-base font-bold font-mono text-white tabular-nums leading-none">
                  {fmt(step.value)}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex items-center gap-1 text-[#444] px-2">
                  <span className="text-[10px] font-mono">{pct}%</span>
                  <ChevronRight size={12} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

// ─── Views chart (AreaChart) ─────────────────────────────────────────────────

function AreaTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const formattedLabel = label
    ? new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : ""
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs font-mono shadow-2xl"
      style={{
        background: "#0f0f0f",
        border: "0.5px solid rgba(255,255,255,0.1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div className="text-[#555] mb-0.5">{formattedLabel}</div>
      <div className="text-[#00ff88]">{payload[0].value} views</div>
    </div>
  )
}

function ViewsAreaChart({ data, period, loading }: { data: ViewData[]; period: string; loading: boolean }) {
  return (
    <GlassCard className="h-full" padding="p-5">
      <SectionLabel right={<span className="text-[10px] font-mono text-[#555]">{period} days</span>}>
        Views · {period} days
      </SectionLabel>
      {loading ? (
        <div className="h-[200px] flex items-center justify-center text-[#444] text-xs font-mono">Loading…</div>
      ) : data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-[#444] text-xs font-mono">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="viewsAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#333", fontSize: 10, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
              tickFormatter={(v: string) =>
                new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }
            />
            <YAxis hide />
            <ChartTooltip content={<AreaTooltip />} cursor={{ stroke: "rgba(0,255,136,0.3)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#00ff88"
              strokeWidth={1.5}
              fill="url(#viewsAreaFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#00ff88", stroke: "#030303", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  )
}

// ─── Top blocks list ─────────────────────────────────────────────────────────

function TopBlocksList({ links, loading }: { links: LinkStat[]; loading: boolean }) {
  const max = links[0]?.totalClicks || 1
  return (
    <GlassCard className="h-full" padding="p-5">
      <SectionLabel>Top cards</SectionLabel>
      {loading ? (
        <div className="h-32 flex items-center justify-center text-[#444] text-xs font-mono">Loading…</div>
      ) : links.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-[#444] text-xs font-mono">No clicks yet</div>
      ) : (
        <div>
          {links.map((link, i) => {
            const pct = Math.round((link.totalClicks / max) * 100)
            return (
              <div key={link.id} className={`flex items-center gap-3 py-3 ${i === links.length - 1 ? "" : "border-b border-white/[0.04]"}`}>
                <span className="text-base flex-shrink-0 leading-none">{link.icon || "🔗"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#d8d8d8] truncate">{link.title}</p>
                  <div className="h-[3px] mt-1.5 rounded-full" style={{ background: "rgba(0,255,136,0.12)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "rgba(0,255,136,0.6)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.05 }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono text-[#00ff88] tabular-nums flex-shrink-0">{fmt(link.totalClicks)}</span>
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}

// ─── Globe canvas (responsive, aspect 1:1) ───────────────────────────────────

function GlobeCanvas({ points }: { points: GeoPoint[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef(0)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const dotsRef = useRef<RenderedDot[]>([])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const [size, setSize] = useState(0)

  // Track wrapper size — keeps the canvas square at any container width
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const update = () => setSize(wrap.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size <= 0) return
    const rawCtx = canvas.getContext("2d")
    if (!rawCtx) return
    const ctx = rawCtx
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const W = size, H = size
    const cx = W / 2, cy = H / 2
    const r = Math.min(W, H) / 2 - 14

    const project = (lat: number, lng: number): [number, number, number] => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)
      const x0 = Math.sin(phi) * Math.cos(theta)
      const y0 = Math.cos(phi)
      const z0 = Math.sin(phi) * Math.sin(theta)
      const rot = rotRef.current
      const c = Math.cos(rot), s = Math.sin(rot)
      return [cx + (x0 * c - z0 * s) * r, cy - y0 * r, x0 * s + z0 * c]
    }

    const drawGridSegment = (coords: [number, number][]) => {
      let started = false
      for (const [lat, lng] of coords) {
        const [px, py, z] = project(lat, lng)
        if (z >= -0.02) {
          if (!started) { ctx.beginPath(); ctx.moveTo(px, py); started = true }
          else ctx.lineTo(px, py)
        } else if (started) { ctx.stroke(); started = false }
      }
      if (started) ctx.stroke()
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      // Sphere body
      const bg = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 0, cx, cy, r)
      bg.addColorStop(0, "#121212")
      bg.addColorStop(1, "#050505")
      ctx.fillStyle = bg
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()

      // Grid + continents inside the sphere
      ctx.save()
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
      ctx.strokeStyle = "rgba(255,255,255,0.04)"
      ctx.lineWidth = 0.5
      for (const lat of [-60, -30, 0, 30, 60]) {
        const coords: [number, number][] = []
        for (let lng = -180; lng <= 180; lng += 4) coords.push([lat, lng])
        drawGridSegment(coords)
      }
      for (let lng = -180; lng < 180; lng += 30) {
        const coords: [number, number][] = []
        for (let lat = -90; lat <= 90; lat += 4) coords.push([lat, lng])
        drawGridSegment(coords)
      }
      ctx.strokeStyle = "rgba(255,255,255,0.08)"
      ctx.lineWidth = 0.7
      for (const poly of CONTINENTS) {
        ctx.beginPath()
        let penDown = false
        for (const [lat, lng] of poly) {
          const [px, py, z] = project(lat, lng)
          if (z > 0) {
            if (!penDown) { ctx.moveTo(px, py); penDown = true }
            else ctx.lineTo(px, py)
          } else if (penDown) { ctx.stroke(); ctx.beginPath(); penDown = false }
        }
        if (penDown) ctx.stroke()
      }
      ctx.restore()

      // Visitor dots (clustered)
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
        const sz = Math.max(2.5, Math.min(1.5 + d.count * 0.7, 7))
        const glow = ctx.createRadialGradient(d.px, d.py, 0, d.px, d.py, sz * 4.5)
        glow.addColorStop(0, `rgba(0,255,136,${Math.min(0.6, 0.22 + d.count * 0.08)})`)
        glow.addColorStop(1, "rgba(0,255,136,0)")
        ctx.fillStyle = glow
        ctx.beginPath(); ctx.arc(d.px, d.py, sz * 4.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = "#00ff88"
        ctx.beginPath(); ctx.arc(d.px, d.py, sz, 0, Math.PI * 2); ctx.fill()
      }

      // Edge atmosphere
      const atm = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.06)
      atm.addColorStop(0, "rgba(0,255,136,0)")
      atm.addColorStop(1, "rgba(0,255,136,0.05)")
      ctx.fillStyle = atm
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.06, 0, Math.PI * 2); ctx.fill()
    }

    let animId: number
    const tick = () => {
      if (!dragging.current) rotRef.current += 0.0035
      draw()
      animId = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(animId)
  }, [size, points])

  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; lastX.current = e.clientX }
  const onMouseUp = () => { dragging.current = false }
  const onMouseMove = (e: React.MouseEvent) => {
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
        setTooltip({ x: mx, y: my - 40, text: `${place} · ${d.count} ${d.count === 1 ? "visit" : "visits"}` })
        return
      }
    }
    setTooltip(null)
  }
  const onTouchStart = (e: React.TouchEvent) => { lastX.current = e.touches[0].clientX }
  const onTouchMove = (e: React.TouchEvent) => {
    rotRef.current += (e.touches[0].clientX - lastX.current) * 0.006
    lastX.current = e.touches[0].clientX
  }

  return (
    <div ref={wrapRef} className="relative w-full mx-auto" style={{ aspectRatio: "1 / 1", maxWidth: 420 }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
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
          className="absolute z-10 pointer-events-none rounded-lg px-3 py-1.5 text-xs font-mono text-[#e0e0e0] whitespace-nowrap shadow-xl"
          style={{
            left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)",
            background: "#0f0f0f", border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

function AudienceGlobePanel({ points, isUltra, countryCount }: {
  points: GeoPoint[]; isUltra: boolean; countryCount: number
}) {
  const hasReal = points.length > 0
  const displayPoints = hasReal ? points : DEMO_POINTS
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), 500); return () => clearTimeout(t) }, [])

  return (
    <GlassCard className="h-full" padding="p-5">
      <SectionLabel right={
        <span className="text-[10px] font-mono text-[#00ff88]">
          {isUltra ? `${countryCount} ${countryCount === 1 ? "country" : "countries"}` : "ULTRA"}
        </span>
      }>
        Audience globe · ultra
      </SectionLabel>
      <div className="relative flex items-center justify-center" style={{ minHeight: 480 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
          style={{ filter: isUltra ? "none" : "blur(6px) brightness(0.55)" }}
        >
          <GlobeCanvas points={displayPoints} />
        </motion.div>

        {!isUltra && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ background: "var(--accent-soft, #00ff881a)", border: "1px solid #00ff8833" }}>
              <Lock size={16} className="text-[#00ff88]" />
            </div>
            <p className="text-sm font-medium text-white mb-1">See where your audience is</p>
            <p className="text-xs font-mono text-[#666] mb-4 max-w-[260px]">
              Upgrade to Ultra to unlock the audience globe and country-level insights.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-1.5 bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-2 text-xs hover:opacity-90 transition-opacity"
            >
              <Sparkles size={12} /> Upgrade to Ultra
            </a>
          </div>
        )}

        {isUltra && !hasReal && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[#444]">
            No visits yet — showing sample locations
          </div>
        )}
      </div>
    </GlassCard>
  )
}

// ─── Audience breakdown (countries) ──────────────────────────────────────────

function AudiencePanel({ topCountries, loading }: {
  topCountries: { country: string; count: number }[]; loading: boolean
}) {
  const max = topCountries[0]?.count || 1
  const total = topCountries.reduce((s, c) => s + c.count, 0)

  return (
    <GlassCard className="h-full" padding="p-5">
      <SectionLabel right={<span className="text-[10px] font-mono text-[#555]">{fmt(total)} visits</span>}>
        Audience
      </SectionLabel>

      <p className="text-[10px] font-mono uppercase tracking-widest text-[#555] mb-3">Top countries</p>
      {loading ? (
        <div className="h-24 flex items-center justify-center text-[#444] text-xs font-mono">Loading…</div>
      ) : topCountries.length === 0 ? (
        <div className="text-[#444] text-xs font-mono py-3">No geo data yet</div>
      ) : (
        <div className="space-y-3">
          {topCountries.slice(0, 7).map((c, i) => (
            <div key={c.country} className="flex items-center gap-3">
              <span className="w-5 text-center text-base flex-shrink-0 leading-none">{countryFlag(c.country)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-[#d8d8d8] truncate">{c.country}</span>
                  <span className="text-xs font-mono text-[#888] ml-2 tabular-nums flex-shrink-0">{c.count}</span>
                </div>
                <div className="h-[3px] rounded-full" style={{ background: "rgba(0,255,136,0.12)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "rgba(0,255,136,0.6)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.count / max) * 100}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.05 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

// ─── Devices panel ────────────────────────────────────────────────────────────

const DEVICE_META: Record<string, { label: string; color: string; Icon: typeof Smartphone }> = {
  mobile:  { label: "Mobile",  color: "#00ff88", Icon: Smartphone },
  desktop: { label: "Desktop", color: "#378add", Icon: Monitor },
  tablet:  { label: "Tablet",  color: "#9146ff", Icon: Tablet },
  unknown: { label: "Other",   color: "#666",    Icon: Monitor },
}

function DevicesPanel({
  breakdown, loading,
}: { breakdown: { device: string; count: number }[]; loading: boolean }) {
  const total = breakdown.reduce((s, d) => s + d.count, 0)

  // Always render Mobile + Desktop. Include Tablet only if it has any data.
  const rows = ["mobile", "desktop", ...(breakdown.some((b) => b.device === "tablet") ? ["tablet"] : [])]
    .map((device) => {
      const found = breakdown.find((b) => b.device === device)
      return { device, count: found?.count ?? 0 }
    })

  return (
    <GlassCard className="h-full" padding="p-5">
      <SectionLabel right={<span className="text-[10px] font-mono text-[#555]">{fmt(total)} views</span>}>
        Devices
      </SectionLabel>
      {loading ? (
        <div className="h-24 flex items-center justify-center text-[#444] text-xs font-mono">Loading…</div>
      ) : total === 0 ? (
        <div className="text-[#444] text-xs font-mono py-3">No device data yet</div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ device, count }, i) => {
            const meta = DEVICE_META[device] ?? DEVICE_META.unknown
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const Icon = meta.Icon
            return (
              <div key={device}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-[13px] text-[#d8d8d8]">
                    <Icon size={13} style={{ color: meta.color }} />
                    {meta.label}
                  </span>
                  <span className="text-xs font-mono tabular-nums" style={{ color: meta.color }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-[6px] rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.06 }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[#555] mt-1 tabular-nums">
                  {fmt(count)} {count === 1 ? "view" : "views"}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}

// ─── Sources panel ────────────────────────────────────────────────────────────

const SOURCE_META: Record<string, { label: string; color: string; Icon: typeof Globe }> = {
  direct:    { label: "Direct",    color: "#888",     Icon: LinkIcon },
  instagram: { label: "Instagram", color: "#e1306c",  Icon: Globe },
  tiktok:    { label: "TikTok",    color: "#f0f0f0",  Icon: Globe },
  twitter:   { label: "Twitter",   color: "#e8e8e8",  Icon: Globe },
  youtube:   { label: "YouTube",   color: "#ff0033",  Icon: Globe },
  facebook:  { label: "Facebook",  color: "#1877f2",  Icon: Globe },
  google:    { label: "Google",    color: "#378add",  Icon: Globe },
  linkedin:  { label: "LinkedIn",  color: "#0a66c2",  Icon: Globe },
  other:     { label: "Other",     color: "#666",     Icon: Globe },
}
const SOURCE_ORDER = ["direct", "instagram", "tiktok", "twitter", "youtube", "facebook", "google", "linkedin", "other"]

function SourcesPanel({
  breakdown, loading,
}: { breakdown: { source: string; count: number }[]; loading: boolean }) {
  const total = breakdown.reduce((s, r) => s + r.count, 0)
  const max = Math.max(1, ...breakdown.map((b) => b.count))

  // Merge into known sources, sort by count desc, keep zeros out except Direct
  const merged = SOURCE_ORDER
    .map((source) => {
      const found = breakdown.find((b) => b.source === source)
      return { source, count: found?.count ?? 0 }
    })
    .filter((r) => r.count > 0 || r.source === "direct")
    .sort((a, b) => b.count - a.count)

  return (
    <GlassCard className="h-full" padding="p-5">
      <SectionLabel right={<span className="text-[10px] font-mono text-[#555]">{fmt(total)} views</span>}>
        Traffic sources
      </SectionLabel>
      {loading ? (
        <div className="h-24 flex items-center justify-center text-[#444] text-xs font-mono">Loading…</div>
      ) : total === 0 ? (
        <div className="text-[#444] text-xs font-mono py-3">No referrer data yet</div>
      ) : (
        <div className="space-y-3">
          {merged.map((row, i) => {
            const meta = SOURCE_META[row.source] ?? SOURCE_META.other
            const pct = Math.round((row.count / max) * 100)
            const Icon = meta.Icon
            return (
              <div key={row.source} className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${meta.color}1a`, border: `0.5px solid ${meta.color}33` }}
                >
                  <Icon size={12} style={{ color: meta.color }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-[#d8d8d8] truncate">{meta.label}</span>
                    <span className="text-xs font-mono text-[#888] ml-2 tabular-nums flex-shrink-0">
                      {fmt(row.count)}
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full" style={{ background: `${meta.color}1f` }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: meta.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.04 }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export default function AnalyticsDashboard() {
  const router = useRouter()
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [viewsData, setViewsData] = useState<ViewData[]>([])
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [clickData, setClickData] = useState<ClickData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  // Mount telemetry — one-shot, decoupled from the period-driven loader
  // below so changing the date range doesn't refire the event.
  useEffect(() => {
    trackEvent("analytics_page_viewed")
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      fetch("/api/analytics/overview"),
      fetch(`/api/analytics/views?period=${period}`),
      fetch("/api/analytics/views?geo=true"),
      fetch(`/api/analytics/clicks?period=${period}`),
      fetch("/api/products"),
      fetch("/api/profile"),
    ]).then(async (results) => {
      const [ovR, viewsR, geoR, clicksR, prodsR, profR] = results
      if (ovR.status === "fulfilled" && ovR.value.ok) setOverview(await ovR.value.json())
      if (viewsR.status === "fulfilled" && viewsR.value.ok) setViewsData(await viewsR.value.json())
      if (geoR.status === "fulfilled" && geoR.value.ok) setGeoData(await geoR.value.json())
      if (clicksR.status === "fulfilled" && clicksR.value.ok) setClickData(await clicksR.value.json())
      if (prodsR.status === "fulfilled" && prodsR.value.ok) {
        const data = await prodsR.value.json()
        setProducts(Array.isArray(data) ? data : [])
      }
      if (profR.status === "fulfilled" && profR.value.ok) setProfile(await profR.value.json())
      setLoading(false)
    })
  }, [period])

  const totalSales = products.reduce((s, p) => s + (p.salesCount || 0), 0)
  const userPlan = profile ? resolveUserPlan({
    subscriptionStatus: profile.subscriptionStatus,
    subscriptionPlan: profile.subscriptionPlan,
    trialEndsAt: profile.trialEndsAt ? new Date(profile.trialEndsAt) : null,
    subscriptionEndsAt: profile.subscriptionEndsAt ? new Date(profile.subscriptionEndsAt) : null,
  }) : "free"
  const isUltra = userPlan === "ultra"

  const funnelSteps = [
    { label: "Visited", value: overview?.totalViews ?? 0 },
    { label: "Clicked", value: overview?.totalClicks ?? 0 },
    { label: "Email", value: overview?.totalAudience ?? 0 },
    { label: "Purchased", value: totalSales },
  ]

  const topCountries = geoData?.topCountries ?? []
  const topLinks = clickData?.linkStats.slice(0, 5) ?? []
  const ctr = overview?.ctr ?? 0

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#555] hover:text-[#e0e0e0] hover:border-white/20 transition-colors flex-shrink-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-xs font-mono text-[#555] mt-1">Your audience, in numbers.</p>
            </div>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm font-mono py-2 px-3 rounded-xl outline-none focus:border-[#00ff88]/30"
            style={glass.input}
          >
            <option value="7" className="bg-[#111]">Last 7 days</option>
            <option value="30" className="bg-[#111]">Last 30 days</option>
            <option value="90" className="bg-[#111]">Last 90 days</option>
          </select>
        </motion.div>

        {/* ── Funnel strip ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 280, damping: 24 }}
          className="mb-5"
        >
          <FunnelStrip steps={funnelSteps} />
        </motion.div>

        {/* ── Metric cards ──────────────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5"
        >
          <motion.div variants={cardVariants}>
            <MetricCard label="Total views" value={overview?.totalViews ?? 0} trend={overview?.viewsTrend} icon={Eye} sub={`${fmt(overview?.totalViewsLast7Days ?? 0)} this week`} />
          </motion.div>
          <motion.div variants={cardVariants}>
            <MetricCard label="Unique visitors" value={overview?.uniqueViews ?? 0} icon={Users} sub={`${fmt(overview?.uniqueViewsLast7Days ?? 0)} this week`} />
          </motion.div>
          <motion.div variants={cardVariants}>
            <MetricCard label="Link clicks" value={overview?.totalClicks ?? 0} trend={overview?.clicksTrend} icon={MousePointerClick} sub={`${fmt(clickData?.totalClicks ?? 0)} in window`} />
          </motion.div>
          <motion.div variants={cardVariants}>
            <ConversionRateCard ctr={ctr} icon={TrendingUp} />
          </motion.div>
        </motion.div>

        {/* ── Row 2: Views chart 60% + Top blocks 40% ────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mb-5"
        >
          <motion.div variants={cardVariants}>
            <ViewsAreaChart data={viewsData} period={period} loading={loading} />
          </motion.div>
          <motion.div variants={cardVariants}>
            <TopBlocksList links={topLinks} loading={loading} />
          </motion.div>
        </motion.div>

        {/* ── Row 3: Globe 50% + Audience 50% ────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5"
        >
          <motion.div variants={cardVariants}>
            <AudienceGlobePanel
              points={geoData?.points ?? []}
              isUltra={isUltra}
              countryCount={topCountries.length}
            />
          </motion.div>
          <motion.div variants={cardVariants}>
            <AudiencePanel topCountries={topCountries} loading={loading} />
          </motion.div>
        </motion.div>

        {/* ── Row 4: Devices + Sources ───────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5"
        >
          <motion.div variants={cardVariants}>
            <DevicesPanel breakdown={overview?.deviceBreakdown ?? []} loading={loading} />
          </motion.div>
          <motion.div variants={cardVariants}>
            <SourcesPanel breakdown={overview?.referrerBreakdown ?? []} loading={loading} />
          </motion.div>
        </motion.div>

        {/* ── Row 5: Audience CRM ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 280, damping: 24 }}
        >
          <GlassCard padding="p-5">
            <SectionLabel>Audience CRM</SectionLabel>
            <AudienceTable userPlan={userPlan} />
          </GlassCard>
        </motion.div>

      </div>
    </div>
  )
}

// CTR uses a decimal so we render it differently (no count-up via fmt())
function ConversionRateCard({ ctr, icon: Icon }: { ctr: number; icon: typeof Eye }) {
  const animated = useCountUp(Math.round(ctr * 10), 1100) / 10
  return (
    <GlassCard padding="p-6">
      <Icon size={16} className="absolute top-6 right-6 text-[#333]" />
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#444] mb-2">Conversion rate</div>
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] leading-none font-bold tabular-nums text-[#00ff88]">
          {animated.toFixed(1)}%
        </span>
      </div>
      <div className="text-[11px] font-mono text-[#555] mt-1.5">clicks ÷ views</div>
    </GlassCard>
  )
}
