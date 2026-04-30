"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

// Preset accent colors
export const ACCENT_COLORS = [
  { name: "Mint", hex: "#00ff88" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Orange", hex: "#f97316" },
  { name: "Pink", hex: "#ec4899" },
] as const;

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface AccentColorContextType {
  accentColor: string;
  accentGlow: string;
  setAccentColor: (color: string) => void;
  saveAccentColor: (color: string) => Promise<void>;
  isSaving: boolean;
}

const AccentColorContext = createContext<AccentColorContextType | undefined>(undefined);

interface AccentColorProviderProps {
  children: ReactNode;
  initialColor?: string;
}

export function AccentColorProvider({ children, initialColor = "#00ff88" }: AccentColorProviderProps) {
  const [accentColor, setAccentColorState] = useState(initialColor);
  const [isSaving, setIsSaving] = useState(false);

  // Compute glow color from accent
  const accentGlow = hexToRgba(accentColor, 0.4);

  // Update CSS variables when accent changes
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", accentColor);
    document.documentElement.style.setProperty("--accent-glow", accentGlow);
    document.documentElement.style.setProperty("--accent-dim", hexToRgba(accentColor, 0.5));
    document.documentElement.style.setProperty("--accent-subtle", hexToRgba(accentColor, 0.1));
  }, [accentColor, accentGlow]);

  // Set accent color locally (for preview)
  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
  }, []);

  // Save accent color to database
  const saveAccentColor = useCallback(async (color: string) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/accent-color", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accentColor: color }),
      });

      if (!response.ok) {
        throw new Error("Failed to save accent color");
      }

      setAccentColorState(color);
    } catch (error) {
      console.error("Error saving accent color:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <AccentColorContext.Provider
      value={{
        accentColor,
        accentGlow,
        setAccentColor,
        saveAccentColor,
        isSaving,
      }}
    >
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const context = useContext(AccentColorContext);
  if (context === undefined) {
    throw new Error("useAccentColor must be used within an AccentColorProvider");
  }
  return context;
}

// Hook for applying accent color from user data (read-only, for public profiles)
export function useApplyAccentColor(color: string | null | undefined) {
  useEffect(() => {
    if (color) {
      document.documentElement.style.setProperty("--accent-color", color);
      document.documentElement.style.setProperty("--accent-glow", hexToRgba(color, 0.4));
      document.documentElement.style.setProperty("--accent-dim", hexToRgba(color, 0.5));
      document.documentElement.style.setProperty("--accent-subtle", hexToRgba(color, 0.1));
    }
  }, [color]);
}
