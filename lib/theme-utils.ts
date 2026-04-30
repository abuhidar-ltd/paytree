// Theme utilities - can be used in both server and client components

// Light themes that need dark text
export const LIGHT_THEMES = ['light', 'snow', 'cream', 'peach', 'mint']

export function isLightTheme(theme: string): boolean {
  return LIGHT_THEMES.includes(theme)
}

// Theme-based gradients
export const THEME_GRADIENTS: Record<string, string> = {
  dark: "from-slate-950 via-blue-950 to-slate-900",
  midnight: "from-indigo-950 via-purple-950 to-pink-950",
  ocean: "from-cyan-950 via-blue-950 to-indigo-950",
  forest: "from-emerald-950 via-teal-950 to-green-950",
  crimson: "from-rose-950 via-red-950 to-pink-950",
  light: "from-gray-50 via-blue-50 to-purple-50",
  snow: "from-slate-50 via-gray-100 to-blue-50",
  cream: "from-amber-50 via-orange-50 to-yellow-50",
  peach: "from-rose-50 via-pink-50 to-orange-50",
  mint: "from-emerald-50 via-teal-50 to-cyan-50",
  sunset: "from-orange-600 via-pink-600 to-purple-600",
  aurora: "from-cyan-500 via-purple-500 to-pink-500",
  cosmos: "from-violet-600 via-purple-600 to-indigo-600",
  neon: "from-fuchsia-600 via-cyan-500 to-blue-500",
  holographic: "from-pink-400 via-purple-400 to-indigo-400",
}

export function getThemeGradient(theme: string): string {
  return THEME_GRADIENTS[theme] || THEME_GRADIENTS.dark
}
