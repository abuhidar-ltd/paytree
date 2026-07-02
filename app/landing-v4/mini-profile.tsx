"use client"

import { useEffect, useState } from "react"
import {
  Play,
  FileText,
  Video,
  ShoppingCart,
  Lock,
  Bot,
  BadgeCheck,
  ArrowUpRight,
} from "lucide-react"
import type { MockCard, MockProfile } from "./mock-profiles"

/**
 * MiniProfile — scaled-down replica of what a live /[username] page looks
 * like. Uses the same visual language as components/ui/block-renderer.tsx:
 * glass shell with reflection line, accent-colored kickers, real drop
 * countdown cell grid, vault email-gate chip. Rendered inside a phone frame.
 */
export function MiniProfile({ profile }: { profile: MockProfile }) {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: 260,
        height: 520,
        borderRadius: 40,
        padding: 7,
        background:
          "linear-gradient(180deg, #1c1c1c 0%, #0a0a0a 40%, #000 100%)",
        boxShadow:
          "0 30px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px " +
          profile.accent +
          "18",
      }}
    >
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-20 h-4 w-16 rounded-full"
        style={{ background: "#000" }}
      />
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: 34,
          background:
            "radial-gradient(circle at 50% 8%, " +
            profile.accent +
            "12 0%, transparent 55%), #050505",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[8px] font-mono text-white/70">
          <span>9:41</span>
          <span>●●●</span>
        </div>

        {/* Head */}
        <div className="pt-3 px-3 flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold text-white"
            style={{
              border: `1.5px solid ${profile.accent}80`,
              background: `linear-gradient(135deg, ${profile.accent} 0%, #0a0a0a 100%)`,
              boxShadow: `0 0 0 3px ${profile.accent}20, 0 0 16px ${profile.accent}55`,
            }}
          >
            {profile.initial}
          </div>

          <div
            className="inline-flex items-center gap-1 mt-2 px-1.5 py-[2px] rounded-full"
            style={{
              background: `${profile.accent}18`,
              border: `0.5px solid ${profile.accent}55`,
            }}
          >
            <BadgeCheck
              size={8}
              strokeWidth={3}
              style={{ color: profile.accent }}
            />
            <span
              className="text-[7px] font-mono font-bold uppercase tracking-widest"
              style={{ color: profile.accent }}
            >
              verified
            </span>
          </div>

          <div className="text-white font-bold text-[13px] mt-1.5">
            {profile.name}
          </div>
          <div
            className="font-mono text-[9px] mt-0.5"
            style={{ color: profile.accent }}
          >
            @{profile.handle}
          </div>
          <div className="text-[9px] text-[#888] mt-1 text-center leading-tight px-3">
            {profile.bio}
          </div>
        </div>

        {/* Cards feed */}
        <div className="mt-3 px-3 flex flex-col gap-1.5">
          {profile.cards.map((c, i) => (
            <CardShell key={i} card={c} accent={profile.accent} />
          ))}
        </div>
      </div>
    </div>
  )
}

function CardShell({ card, accent }: { card: MockCard; accent: string }) {
  switch (card.kind) {
    case "product":
      return <ProductCard card={card} accent={accent} />
    case "drop":
      return <DropCard card={card} accent={accent} />
    case "vault":
      return <VaultCard card={card} />
    case "link":
      return <LinkCard card={card} accent={accent} />
    case "agent":
      return <AgentCard card={card} accent={accent} />
  }
}

function GlassBase({
  children,
  accent,
  emphasize,
}: {
  children: React.ReactNode
  accent?: string
  emphasize?: boolean
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        background: emphasize
          ? `${accent}0C`
          : "rgba(255,255,255,0.03)",
        border: emphasize
          ? `0.5px solid ${accent}55`
          : "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: emphasize
            ? `linear-gradient(90deg, transparent, ${accent}66, transparent)`
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
        }}
      />
      {children}
    </div>
  )
}

function ProductCard({
  card,
  accent,
}: {
  card: Extract<MockCard, { kind: "product" }>
  accent: string
}) {
  return (
    <GlassBase accent={accent}>
      <div className="flex items-center gap-2.5 px-2.5 py-2">
        <div
          className="shrink-0 w-7 h-7 rounded-lg grid place-items-center"
          style={{
            background: `linear-gradient(135deg, ${accent}25, ${accent}05)`,
            border: `0.5px solid ${accent}44`,
          }}
        >
          <ShoppingCart size={12} strokeWidth={2.25} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-[11px] font-semibold truncate">
            {card.title}
          </div>
          <div
            className="font-mono text-[9px] mt-0.5"
            style={{ color: accent }}
          >
            {card.price}
          </div>
        </div>
        <div
          className="shrink-0 text-[9px] font-mono font-bold px-2 py-1 rounded"
          style={{ background: accent, color: "#000" }}
        >
          {card.cta ?? "BUY"}
        </div>
      </div>
    </GlassBase>
  )
}

function DropCard({
  card,
  accent,
}: {
  card: Extract<MockCard, { kind: "drop" }>
  accent: string
}) {
  const [remaining, setRemaining] = useState(card.hoursUntil * 3600_000)
  useEffect(() => {
    const target = Date.now() + card.hoursUntil * 3600_000
    const id = setInterval(() => {
      setRemaining(Math.max(0, target - Date.now()))
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const t = Math.floor(remaining / 1000)
  const hh = String(Math.floor(t / 3600)).padStart(2, "0")
  const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0")
  const ss = String(t % 60).padStart(2, "0")

  return (
    <GlassBase accent={accent} emphasize>
      <div className="px-2.5 py-2">
        <div className="flex items-center justify-between mb-1">
          <div
            className="text-[7px] font-mono uppercase tracking-widest"
            style={{ color: accent, opacity: 0.8 }}
          >
            DROP · SCHEDULED
          </div>
          {card.spotsLeft !== undefined && (
            <div
              className="text-[7px] font-mono px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(245,158,11,0.12)",
                border: "0.5px solid rgba(245,158,11,0.35)",
                color: "#f59e0b",
              }}
            >
              {card.spotsLeft} left
            </div>
          )}
        </div>
        <div className="text-white text-[11px] font-semibold leading-tight">
          {card.title}
        </div>
        <div className="grid grid-cols-3 gap-1 mt-1.5">
          {[
            { l: "HRS", v: hh },
            { l: "MIN", v: mm },
            { l: "SEC", v: ss },
          ].map((u) => (
            <div
              key={u.l}
              className="rounded-md py-1 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="text-white font-mono font-bold text-[12px] tabular-nums leading-none">
                {u.v}
              </div>
              <div className="text-[6px] font-mono uppercase tracking-widest text-[#555] mt-0.5">
                {u.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassBase>
  )
}

function VaultCard({ card }: { card: Extract<MockCard, { kind: "vault" }> }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl flex items-center gap-2 px-2.5 py-2"
      style={{
        background: "rgba(245,158,11,0.05)",
        border: "0.5px solid rgba(245,158,11,0.3)",
      }}
    >
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)",
        }}
      />
      <div
        className="shrink-0 w-7 h-7 rounded-lg grid place-items-center"
        style={{
          background: "rgba(245,158,11,0.12)",
          border: "0.5px solid rgba(245,158,11,0.35)",
        }}
      >
        <Lock size={11} className="text-[#f59e0b]" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[7px] font-mono uppercase tracking-widest text-[#f59e0b]/80">
          VAULT · LOCKED
        </div>
        <div className="text-white text-[10px] font-semibold truncate">
          {card.title}
        </div>
      </div>
      <div
        className="shrink-0 text-[7px] font-mono px-1.5 py-0.5 rounded"
        style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
      >
        email
      </div>
    </div>
  )
}

function LinkCard({
  card,
  accent,
}: {
  card: Extract<MockCard, { kind: "link" }>
  accent: string
}) {
  const Icon =
    card.icon === "video"
      ? Video
      : card.icon === "file"
      ? FileText
      : card.icon === "cart"
      ? ShoppingCart
      : Play
  return (
    <GlassBase>
      <div className="flex items-center gap-2.5 px-2.5 py-2">
        <div
          className="shrink-0 w-7 h-7 rounded-lg grid place-items-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.06)",
          }}
        >
          <Icon size={11} className="text-white/85" strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0 text-white text-[11px] font-semibold truncate">
          {card.title}
        </div>
        <div
          className="shrink-0 w-5 h-5 rounded-full grid place-items-center"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <ArrowUpRight
            size={10}
            style={{ color: accent }}
            strokeWidth={2.5}
          />
        </div>
      </div>
    </GlassBase>
  )
}

function AgentCard({
  card,
  accent,
}: {
  card: Extract<MockCard, { kind: "agent" }>
  accent: string
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl flex items-center gap-2 px-2.5 py-2"
      style={{
        background: `linear-gradient(90deg, ${accent}0F, ${accent}05)`,
        border: `0.5px solid ${accent}55`,
      }}
    >
      <div
        className="shrink-0 w-7 h-7 rounded-lg grid place-items-center relative"
        style={{
          background: `${accent}18`,
          border: `0.5px solid ${accent}66`,
        }}
      >
        <Bot size={12} style={{ color: accent }} strokeWidth={2.5} />
        <span
          className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 5px ${accent}` }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[7px] font-mono uppercase tracking-widest"
          style={{ color: accent }}
        >
          AI AGENT · ONLINE
        </div>
        <div className="text-white text-[10px] font-semibold">
          {card.hint}
        </div>
      </div>
    </div>
  )
}
