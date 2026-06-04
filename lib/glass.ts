/**
 * Paytree Glass Design Tokens
 *
 * Centralized glass-morphism style objects used across the dashboard canvas
 * and the public profile cards. Applied as inline `style` objects so the same
 * visual language stays in lockstep everywhere.
 */

export const glass = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: "var(--block-radius, 16px)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  cardHover: {
    background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(255,255,255,0.14)",
    borderRadius: "var(--block-radius, 16px)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
  },
  cardSelected: {
    background: "rgba(0,255,136,0.03)",
    border: "0.5px solid rgba(0,255,136,0.25)",
    borderRadius: "var(--block-radius, 16px)",
    boxShadow: "inset 0 1px 0 rgba(0,255,136,0.1), 0 0 0 2px rgba(0,255,136,0.08)",
  },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
  },
  panel: {
    background: "#0a0a0a",
    border: "0.5px solid rgba(255,255,255,0.06)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  },
} as const

export const accent = "#00ff88"
export const bg = "#030303"
export const bgCard = "#080808"

/**
 * The top reflection line gradient shared by every glass card.
 * Render in an absolutely-positioned 1px-tall div at the top of the card.
 */
export const glassReflection =
  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)"
