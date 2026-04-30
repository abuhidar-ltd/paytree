export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303]">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#00ff88] to-[rgba(0,255,136,0.5)] rounded-2xl mx-auto mb-4 animate-pulse shadow-[0_0_20px_rgba(0,255,136,0.3)]"></div>
        <p className="text-[#888888] animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

