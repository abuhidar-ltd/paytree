// Shared, presentational-only helpers for the read-only Admin Dashboard.
// Server component (no client hooks). Reuses the Paytree glass tokens.
import { glass, glassReflection } from "@/lib/glass"

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="relative overflow-hidden p-4" style={{ ...glass.card, borderRadius: 14 }}>
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: glassReflection, pointerEvents: "none" }}
      />
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub ? <div className="text-xs font-mono text-[#555] mt-1">{sub}</div> : null}
    </div>
  )
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden p-4 sm:p-5 mb-6" style={{ ...glass.card, borderRadius: 16 }}>
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: glassReflection, pointerEvents: "none" }}
      />
      {title ? <h2 className="text-sm font-mono uppercase tracking-widest text-[#888] mb-4">{title}</h2> : null}
      {children}
    </section>
  )
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      {subtitle ? <p className="text-xs font-mono text-[#555] mt-1">{subtitle}</p> : null}
    </div>
  )
}

export function nf(n: number): string {
  return n.toLocaleString("en-US")
}

export function pct(num: number, den: number): string {
  if (!den) return "—"
  return `${((num / den) * 100).toFixed(1)}%`
}

export function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

export function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "—"
}
