"use client"

import { useState } from "react"

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  presets?: string[]
  className?: string
}

const defaultPresets = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#ef4444", // red
  "#f97316", // orange
  "#84cc16", // lime
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#a855f7", // violet
  "#f43f5e", // rose
  "#eab308", // yellow
  "#22c55e", // green
  "#0ea5e9", // sky
  "#d946ef", // fuchsia
  "#fb923c", // orange-400
  "#94a3b8", // slate
  "#ffffff", // white
]

export function ColorPicker({ 
  label, 
  value, 
  onChange, 
  presets = defaultPresets,
  className = "" 
}: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      
      <div className="space-y-3">
        {/* Current Color & Picker */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="w-20 h-12 rounded-lg border-2 border-white/20 shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-12 bg-white/5 border border-white/10 text-white rounded-lg px-4 font-mono text-sm"
            placeholder="#000000"
          />
        </div>

        {/* Preset Colors */}
        {showPicker && (
          <div className="glass rounded-xl p-4 animate-scale-in">
            <div className="text-xs text-gray-400 mb-3">Quick Colors</div>
            <div className="grid grid-cols-10 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    onChange(preset)
                    setShowPicker(false)
                  }}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    value === preset 
                      ? 'border-white ring-2 ring-white/50' 
                      : 'border-white/20'
                  }`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
