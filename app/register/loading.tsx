// Route-specific loading skeleton for /start. The root loading.tsx ("green
// square + Loading...") added ~1s of perceived latency between hero CTA click
// and the form appearing — that's the conversion-critical moment for TikTok
// traffic, so we mirror the SignUpScreen shell here instead.
export default function StartLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-white relative bg-[#030303]">
      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f0f0f0]">Paytree</h1>
          <p className="text-sm font-light text-[#00ff88]">
            Create your free page, No Credit card required.
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            padding: 24,
          }}
          className="flex flex-col gap-3"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                height: 48,
              }}
              className="animate-pulse"
            />
          ))}
          <div
            style={{ background: "rgba(0,255,136,0.5)", borderRadius: 12, height: 52 }}
            className="animate-pulse mt-1"
          />
        </div>
      </div>
    </div>
  )
}
