"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { ACCENT_COLORS, useAccentColor } from "@/contexts/accent-color-context";

interface ColorSwatchSelectorProps {
  className?: string;
  showLabels?: boolean;
}

export function ColorSwatchSelector({ className = "", showLabels = false }: ColorSwatchSelectorProps) {
  const { accentColor, setAccentColor, saveAccentColor, isSaving } = useAccentColor();
  const [savingColor, setSavingColor] = useState<string | null>(null);

  const handleColorClick = async (hex: string) => {
    // Immediately update for preview
    setAccentColor(hex);
    
    // Save to database
    setSavingColor(hex);
    try {
      await saveAccentColor(hex);
    } catch (error) {
      console.error("Failed to save color:", error);
    } finally {
      setSavingColor(null);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {showLabels && (
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Accent Color
        </label>
      )}
      <div className="flex items-center gap-4">
        {ACCENT_COLORS.map(({ name, hex }) => {
          const isActive = accentColor === hex;
          const isCurrentlySaving = savingColor === hex;

          return (
            <motion.button
              key={hex}
              type="button"
              onClick={() => handleColorClick(hex)}
              className={`color-swatch ${isActive ? "active" : ""}`}
              style={{
                background: hex,
                ["--swatch-color" as string]: hex,
                boxShadow: isActive ? `0 0 25px ${hex}` : `0 0 10px ${hex}40`,
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Set accent color to ${name}`}
              disabled={isSaving}
            >
              {isCurrentlySaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-black/50 m-auto" />
              ) : isActive ? (
                <Check className="w-4 h-4 text-black/70 m-auto" />
              ) : null}
            </motion.button>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex items-center gap-4">
          {ACCENT_COLORS.map(({ name, hex }) => (
            <span
              key={hex}
              className="w-10 text-center text-[10px] text-gray-500 truncate"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Standalone swatch without context (for use in non-dashboard contexts)
interface StandaloneSwatchProps {
  colors?: Array<{ name: string; hex: string }>;
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

export function StandaloneSwatch({
  colors = ACCENT_COLORS as unknown as Array<{ name: string; hex: string }>,
  value,
  onChange,
  className = "",
}: StandaloneSwatchProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {colors.map(({ name, hex }) => {
        const isActive = value === hex;

        return (
          <motion.button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            className={`color-swatch ${isActive ? "active" : ""}`}
            style={{
              background: hex,
              ["--swatch-color" as string]: hex,
              boxShadow: isActive ? `0 0 25px ${hex}` : `0 0 10px ${hex}40`,
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Set color to ${name}`}
          >
            {isActive && (
              <Check className="w-4 h-4 text-black/70 m-auto" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export default ColorSwatchSelector;
