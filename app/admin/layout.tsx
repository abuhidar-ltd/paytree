import { unstable_noStore as noStore } from "next/cache"
import Link from "next/link"
import { requireAdmin } from "@/lib/admin"

// Admin pages are dynamic and must never be cached (fresh data + no PII at edge).
export const dynamic = "force-dynamic"

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/affiliates", label: "Affiliates" },
  { href: "/admin/promo-codes", label: "Promo codes" },
  { href: "/admin/funnel", label: "Funnel" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/abuse", label: "Abuse" },
  { href: "/admin/health", label: "Health" },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  noStore()
  // 404s anyone who is not a signed-in, allowlisted admin.
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-5 h-12 bg-[#080808] border-b border-white/[0.06]"
        style={{ boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[#00ff88] font-mono font-bold text-lg">
            Paytree
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#f59e0b] border border-[#f59e0b]/30 rounded px-1.5 py-0.5">
            Admin
          </span>
        </div>
        <span className="text-[#b8b8b8] font-mono text-xs truncate max-w-[180px]">
          {admin.email}
        </span>
      </header>

      {/* Nav */}
      <nav className="flex gap-1 overflow-x-auto px-3 py-2 bg-[#060606] border-b border-white/[0.06]">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-xs font-mono text-[#c9c9d1] hover:text-white hover:bg-white/[0.04] rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Content */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  )
}
