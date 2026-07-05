// Shared support pill for the auth screens (sign-up + sign-in). A signup/login
// failure is the worst place for a user to hit a dead end — this gives them a
// live human channel instead of just an error message.
const X_HANDLE = "PaytreeSass"

export function XSupportPill() {
  return (
    <div className="mt-6 flex justify-center">
      <a
        href={`https://x.com/${X_HANDLE}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2.5 rounded-full pl-3 pr-4 py-2 transition-transform active:scale-[0.97]"
        style={{
          background: "rgba(0,255,136,0.08)",
          border: "0.5px solid rgba(0,255,136,0.3)",
          boxShadow: "inset 0 1px 0 rgba(0,255,136,0.15), 0 0 20px rgba(0,255,136,0.15)",
        }}
      >
        <span
          className="grid place-items-center w-6 h-6 rounded-full shrink-0"
          style={{ background: "rgba(0,255,136,0.15)" }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="#00ff88"
            aria-hidden="true"
            style={{ filter: "drop-shadow(0 0 4px rgba(0,255,136,0.7))" }}
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </span>
        <span className="text-xs font-mono text-white/90 group-hover:text-white transition-colors">
          Trouble signing up? <span className="text-[#00ff88] font-semibold">Contact us on X</span>
        </span>
      </a>
    </div>
  )
}
