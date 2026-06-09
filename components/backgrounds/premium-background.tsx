"use client"

import { useEffect, useRef } from "react"

export type BackgroundVariant = "mesh" | "particles" | "gradient" | "minimal" | "nebula"

interface PremiumBackgroundProps {
  variant?: BackgroundVariant
}

// Single source of truth for every background. Fixed full-screen, behind everything,
// never intercepts clicks. Body bg is #030303 so the layer always sits on solid black.
export function PremiumBackground({ variant = "mesh" }: PremiumBackgroundProps) {
  const v: BackgroundVariant = variant === "nebula" ? "mesh" : variant

  if (v === "particles") return <ParticlesLayer />
  if (v === "gradient") return <GradientLayer />
  if (v === "minimal") return <MinimalLayer />
  return <MeshLayer />
}

// ── MESH ───────────────────────────────────────────────────────
// Three overlapping radial gradients shifted via background-position.
function MeshLayer() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: [
          "radial-gradient(ellipse at 20% 50%, rgba(0,255,136,0.07) 0%, transparent 60%)",
          "radial-gradient(ellipse at 80% 20%, rgba(0,100,255,0.05) 0%, transparent 60%)",
          "radial-gradient(ellipse at 50% 80%, rgba(150,0,255,0.05) 0%, transparent 60%)",
        ].join(", "),
        backgroundSize: "200% 200%",
        animation: "meshMove 10s ease infinite",
      }}
    />
  )
}

// ── GRADIENT ───────────────────────────────────────────────────
function GradientLayer() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: "linear-gradient(135deg, #030303 0%, rgba(0,20,10,1) 50%, #030303 100%)",
        backgroundSize: "400% 400%",
        animation: "gradientBg 15s ease infinite",
      }}
    />
  )
}

// ── MINIMAL ────────────────────────────────────────────────────
function MinimalLayer() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: "#030303",
      }}
    />
  )
}

// ── PARTICLES ──────────────────────────────────────────────────
// 30 small white dots rising slowly, recycled at top once they exit.
function ParticlesLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    function resize() {
      if (!canvas || !ctx) return
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    type Dot = { x: number; y: number; r: number; speed: number }
    const W = () => canvas.width / dpr
    const H = () => canvas.height / dpr

    const dots: Dot[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      r: Math.random() * 1 + 1,         // 1–2px
      speed: Math.random() * 0.3 + 0.15, // slow upward drift
    }))

    let raf = 0
    function frame() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, W(), H())
      ctx.fillStyle = "rgba(255,255,255,0.3)"
      for (const d of dots) {
        d.y -= d.speed
        if (d.y < -2) {
          d.y = H() + 2
          d.x = Math.random() * W()
        }
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  )
}

// Back-compat export
export function MinimalBackground() {
  return <MinimalLayer />
}
