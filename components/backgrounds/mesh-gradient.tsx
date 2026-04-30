"use client"

export function MeshGradient() {
  return (
    <>
      {/* Large animated orbs - now work as overlay on theme */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-float" style={{ animationDuration: '20s' }} />
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-float" style={{ animationDuration: '25s', animationDelay: '5s' }} />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-float" style={{ animationDuration: '30s', animationDelay: '10s' }} />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-[100px] animate-float" style={{ animationDuration: '22s', animationDelay: '3s' }} />
      
      {/* Smaller accent orbs */}
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-[80px] animate-float" style={{ animationDuration: '18s', animationDelay: '7s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-white/5 rounded-full blur-[80px] animate-float" style={{ animationDuration: '23s', animationDelay: '12s' }} />
      
      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      
      {/* Radial glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
      
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`
      }} />
    </>
  )
}
