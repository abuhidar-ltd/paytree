"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Custom tooltip component
function CustomTooltip({ 
  active, 
  payload, 
  label,
  valueLabel = "Value"
}: { 
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
  valueLabel?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[rgba(3,3,3,0.95)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-[#888888] mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold text-white">
            {entry.name || valueLabel}: <span className="text-[#00ff88]">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Views Line Chart
interface ViewsChartData {
  date: string
  views: number
  unique: number
}

interface ViewsChartProps {
  data: ViewsChartData[]
  height?: number
}

export function ViewsChart({ data, height = 300 }: ViewsChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#888888" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#888888" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#888888"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#888888"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="views"
          name="Total Views"
          stroke="#00ff88"
          strokeWidth={2}
          fill="url(#viewsGradient)"
        />
        <Area
          type="monotone"
          dataKey="unique"
          name="Unique Views"
          stroke="#888888"
          strokeWidth={2}
          fill="url(#uniqueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Clicks Line Chart
interface ClicksChartData {
  date: string
  clicks: number
}

interface ClicksChartProps {
  data: ClicksChartData[]
  height?: number
}

export function ClicksChart({ data, height = 200 }: ClicksChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#888888"
          fontSize={11}
          tickLine={false}
        />
        <YAxis 
          stroke="#888888"
          fontSize={11}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip valueLabel="Clicks" />} />
        <Line
          type="monotone"
          dataKey="clicks"
          name="Clicks"
          stroke="#00ff88"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, fill: "#00ff88" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Referrals Bar Chart
interface ReferralData {
  name: string
  count: number
  percentage: number
  color: string
  [key: string]: string | number
}

interface ReferralsChartProps {
  data: ReferralData[]
  height?: number
}

export function ReferralsChart({ data, height = 200 }: ReferralsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart 
        data={data} 
        layout="vertical"
        margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis 
          type="number"
          stroke="#888888"
          fontSize={11}
          tickLine={false}
        />
        <YAxis 
          dataKey="name"
          type="category"
          stroke="#888888"
          fontSize={11}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip valueLabel="Visits" />} />
        <Bar dataKey="count" name="Visits" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Referrals Pie Chart
export function ReferralsPieChart({ data, height = 200 }: ReferralsChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data])
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload as ReferralData
              return (
                <div className="bg-[rgba(3,3,3,0.95)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 shadow-xl">
                  <p className="text-sm font-bold text-white">{data.name}</p>
                  <p className="text-xs text-[#888888]">
                    {data.count.toLocaleString()} visits ({data.percentage}%)
                  </p>
                </div>
              )
            }
            return null
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Vault Unlocks Chart
interface VaultChartData {
  date: string
  unlocks: number
}

interface VaultChartProps {
  data: VaultChartData[]
  height?: number
}

export function VaultUnlocksChart({ data, height = 200 }: VaultChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="unlocksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#888888"
          fontSize={11}
          tickLine={false}
        />
        <YAxis 
          stroke="#888888"
          fontSize={11}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip valueLabel="Unlocks" />} />
        <Area
          type="monotone"
          dataKey="unlocks"
          name="Unlocks"
          stroke="#00ff88"
          strokeWidth={2}
          fill="url(#unlocksGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Mini Sparkline for inline stats
interface SparklineProps {
  data: number[]
  color?: string
  height?: number
}

export function Sparkline({ data, color = "#00ff88", height = 40 }: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }))
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

