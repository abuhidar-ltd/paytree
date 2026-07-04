"use client"

// Chart primitives for the Admin Dashboard — the only client components in
// /admin. Thin recharts wrappers styled to the Obsidian Terminal tokens;
// all data is aggregated server-side and passed down as plain props.

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const AXIS_TICK = { fill: "#555", fontSize: 10, fontFamily: "monospace" }
const TOOLTIP_STYLE = {
  background: "#080808",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 11,
  fontFamily: "monospace",
  color: "#f0f0f0",
} as const

export function BarsChart({
  data,
  color = "#00ff88",
  height = 180,
}: {
  data: { label: string; count: number }[]
  color?: string
  height?: number
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} interval="preserveStartEnd" />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#888" }} itemStyle={{ color }} />
          {/* No entry animation: throttled rAF in background tabs leaves
              animated charts stuck at frame 0 (invisible). */}
          <Bar dataKey="count" fill={color} fillOpacity={0.75} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutChart({
  data,
  height = 200,
}: {
  data: { name: string; value: number; color: string }[]
  height?: number
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div style={{ width: 200, height }} className="flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} fillOpacity={0.85} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#f0f0f0" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5 text-xs font-mono">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="text-[#d0d0d0]">{d.name}</span>
            <span className="text-[#555]">
              {d.value.toLocaleString("en-US")}
              {total > 0 ? ` · ${((d.value / total) * 100).toFixed(1)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
