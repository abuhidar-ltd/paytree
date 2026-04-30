"use client"

export function DecorativeElements() {
  return (
    <>
      {/* Floating icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5">
        {/* Payment icons floating around */}
        <div className="absolute top-[20%] left-[10%] text-6xl opacity-10 animate-float" style={{ animationDuration: '15s' }}>
          💳
        </div>
        <div className="absolute top-[60%] right-[15%] text-5xl opacity-10 animate-float" style={{ animationDuration: '18s', animationDelay: '3s' }}>
          💰
        </div>
        <div className="absolute bottom-[25%] left-[20%] text-7xl opacity-10 animate-float" style={{ animationDuration: '20s', animationDelay: '6s' }}>
          ⚡
        </div>
        <div className="absolute top-[40%] right-[25%] text-5xl opacity-10 animate-float" style={{ animationDuration: '17s', animationDelay: '9s' }}>
          🎯
        </div>
        <div className="absolute top-[70%] left-[40%] text-6xl opacity-10 animate-float" style={{ animationDuration: '19s', animationDelay: '12s' }}>
          ✨
        </div>
        <div className="absolute top-[30%] right-[40%] text-5xl opacity-10 animate-float" style={{ animationDuration: '16s', animationDelay: '4s' }}>
          🚀
        </div>
      </div>

      {/* Geometric shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-5">
        {/* Rotating squares */}
        <div className="absolute top-[15%] right-[10%] w-32 h-32 border-2 border-blue-500/20 rounded-lg animate-rotate-slow" />
        <div className="absolute bottom-[20%] left-[15%] w-40 h-40 border-2 border-emerald-500/20 rounded-lg animate-rotate-slow" style={{ animationDelay: '5s', animationDirection: 'reverse' }} />
        
        {/* Pulsing circles */}
        <div className="absolute top-[50%] left-[5%] w-24 h-24 border-2 border-pink-500/20 rounded-full animate-pulse" />
        <div className="absolute top-[25%] right-[20%] w-20 h-20 border-2 border-cyan-500/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Shine effect */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-5">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-shimmer" />
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-shimmer" style={{ animationDelay: '3s' }} />
        <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent animate-shimmer" style={{ animationDelay: '6s' }} />
      </div>
    </>
  )
}

