"use client"

import { useEffect, useRef } from "react"

const DOTS: [number, number][] = [
  [40.7, -74.0],   // New York
  [51.5, -0.1],    // London
  [35.7, 139.7],   // Tokyo
  [-33.9, 151.2],  // Sydney
]

export function MiniGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rawCtx = canvas.getContext("2d")
    if (!rawCtx) return
    const ctx = rawCtx

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const cx = W / 2
    const cy = H / 2
    const r = Math.min(W, H) / 2 - 8

    function project(lat: number, lng: number): [number, number, number] {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)
      const x0 = Math.sin(phi) * Math.cos(theta)
      const y0 = Math.cos(phi)
      const z0 = Math.sin(phi) * Math.sin(theta)
      const rot = rotRef.current
      const c = Math.cos(rot)
      const s = Math.sin(rot)
      const xr = x0 * c - z0 * s
      const yr = y0
      const zr = x0 * s + z0 * c
      return [cx + xr * r, cy - yr * r, zr]
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // Sphere background
      const bg = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 0, cx, cy, r)
      bg.addColorStop(0, "#121212")
      bg.addColorStop(1, "#030303")
      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()

      // Grid lines (clipped to sphere)
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.strokeStyle = "rgba(0,255,136,0.08)"
      ctx.lineWidth = 0.5

      for (const lat of [-60, -30, 0, 30, 60]) {
        ctx.beginPath()
        let started = false
        for (let lng = -180; lng <= 180; lng += 6) {
          const [px, py, z] = project(lat, lng)
          if (z >= -0.02) {
            if (!started) { ctx.moveTo(px, py); started = true }
            else ctx.lineTo(px, py)
          } else if (started) {
            ctx.stroke()
            ctx.beginPath()
            started = false
          }
        }
        if (started) ctx.stroke()
      }

      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath()
        let started = false
        for (let lat = -90; lat <= 90; lat += 6) {
          const [px, py, z] = project(lat, lng)
          if (z >= -0.02) {
            if (!started) { ctx.moveTo(px, py); started = true }
            else ctx.lineTo(px, py)
          } else if (started) {
            ctx.stroke()
            ctx.beginPath()
            started = false
          }
        }
        if (started) ctx.stroke()
      }
      ctx.restore()

      // Dots
      for (const [lat, lng] of DOTS) {
        const [px, py, z] = project(lat, lng)
        if (z < 0) continue

        const glow = ctx.createRadialGradient(px, py, 0, px, py, 12)
        glow.addColorStop(0, "rgba(0,255,136,0.4)")
        glow.addColorStop(1, "rgba(0,255,136,0)")
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(px, py, 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#00ff88"
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Atmosphere rim
      const atm = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.05)
      atm.addColorStop(0, "rgba(0,255,136,0)")
      atm.addColorStop(1, "rgba(0,255,136,0.08)")
      ctx.fillStyle = atm
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2)
      ctx.fill()
    }

    let animId: number
    function tick() {
      rotRef.current += 0.006
      draw()
      animId = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-[180px] h-[120px]"
      style={{ width: 180, height: 120 }}
    />
  )
}
