"use client"

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />
      
      {/* Animated shapes */}
      <div className="bg-shape top-[10%] left-[10%] w-96 h-96 bg-blue-500/20" style={{ animationDelay: '0s', animationDuration: '25s' }} />
      <div className="bg-shape top-[60%] right-[15%] w-80 h-80 bg-emerald-500/20" style={{ animationDelay: '5s', animationDuration: '30s' }} />
      <div className="bg-shape bottom-[20%] left-[20%] w-72 h-72 bg-pink-500/20" style={{ animationDelay: '10s', animationDuration: '35s' }} />
      <div className="bg-shape top-[40%] right-[40%] w-64 h-64 bg-cyan-500/20" style={{ animationDelay: '15s', animationDuration: '28s' }} />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
    </div>
  )
}

