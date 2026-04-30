"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface BentoStatCardProps {
  value: string | number
  label: string
  icon?: ReactNode
  className?: string
  accentColor?: boolean
}

export function BentoStatCard({
  value,
  label,
  icon,
  className = "",
  accentColor = false
}: BentoStatCardProps) {
  return (
    <motion.div
      className={`glass-brick ${className}`}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {icon && (
        <div className="mb-3 text-2xl opacity-60">
          {icon}
        </div>
      )}
      <div className={`text-3xl font-bold ${accentColor ? "text-[#00ff88]" : "text-white"}`}>
        {value}
      </div>
      <div className="label mt-2">
        {label}
      </div>
    </motion.div>
  )
}

// Stats grid for profile page
interface BentoStatsGridProps {
  students: number
  winRate: number
  followers: number
  labels?: {
    students?: string
    winRate?: string
    followers?: string
  }
  className?: string
}

export function BentoStatsGrid({
  students,
  winRate,
  followers,
  labels = {},
  className = ""
}: BentoStatsGridProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }
  
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <BentoStatCard
        value={formatNumber(students)}
        label={labels.students || "Students"}
      />
      <BentoStatCard
        value={`${winRate}%`}
        label={labels.winRate || "Win Rate"}
        accentColor={winRate >= 90}
      />
      <BentoStatCard
        value={formatNumber(followers)}
        label={labels.followers || "Followers"}
        className="span-2"
      />
    </div>
  )
}

// Dashboard editor for stats
interface StatsLabels {
  students: string
  winRate: string
  followers: string
}

interface StatsEditorProps {
  students: number
  winRate: number
  followers: number
  labels: StatsLabels
  onUpdate: (stats: {
    students?: number
    winRate?: number
    followers?: number
    labels?: StatsLabels
  }) => void
}

export function StatsEditor({
  students,
  winRate,
  followers,
  labels,
  onUpdate
}: StatsEditorProps) {
  return (
    <div className="obsidian-card-static p-5 space-y-5">
      <div>
        <h3 className="font-bold text-white mb-1">Authority Stats</h3>
        <p className="text-sm text-[#888888]">
          Display your achievements and social proof
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Students */}
        <div className="space-y-2">
          <label className="text-xs text-[#888888] uppercase tracking-wider">
            {labels.students}
          </label>
          <input
            type="number"
            value={students}
            onChange={(e) => onUpdate({ students: parseInt(e.target.value) || 0 })}
            className="input-obsidian w-full"
            min={0}
          />
          <input
            type="text"
            value={labels.students}
            onChange={(e) => onUpdate({ labels: { ...labels, students: e.target.value } })}
            className="input-obsidian w-full text-sm"
            placeholder="Label"
          />
        </div>
        
        {/* Win Rate */}
        <div className="space-y-2">
          <label className="text-xs text-[#888888] uppercase tracking-wider">
            {labels.winRate}
          </label>
          <input
            type="number"
            value={winRate}
            onChange={(e) => onUpdate({ winRate: parseFloat(e.target.value) || 0 })}
            className="input-obsidian w-full"
            min={0}
            max={100}
            step={0.1}
          />
          <input
            type="text"
            value={labels.winRate}
            onChange={(e) => onUpdate({ labels: { ...labels, winRate: e.target.value } })}
            className="input-obsidian w-full text-sm"
            placeholder="Label"
          />
        </div>
        
        {/* Followers */}
        <div className="space-y-2 col-span-2">
          <label className="text-xs text-[#888888] uppercase tracking-wider">
            {labels.followers}
          </label>
          <input
            type="number"
            value={followers}
            onChange={(e) => onUpdate({ followers: parseInt(e.target.value) || 0 })}
            className="input-obsidian w-full"
            min={0}
          />
          <input
            type="text"
            value={labels.followers}
            onChange={(e) => onUpdate({ labels: { ...labels, followers: e.target.value } })}
            className="input-obsidian w-full text-sm"
            placeholder="Label"
          />
        </div>
      </div>
    </div>
  )
}

