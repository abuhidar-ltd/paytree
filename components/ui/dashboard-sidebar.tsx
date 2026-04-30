"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Paintbrush,
  BarChart2,
  Settings,
  ExternalLink,
  Menu,
  X,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Design", href: "/dashboard/studio", icon: Paintbrush },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings },
]

interface SidebarUser {
  username: string
  image: string | null
  name: string | null
}

interface SidebarContentProps {
  user: SidebarUser
  pathname: string
  onClose?: () => void
}

function SidebarContent({ user, pathname, onClose }: SidebarContentProps) {
  return (
    <div className="w-[220px] h-full bg-[#080808] border-r border-white/[0.06] flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-6 h-6 rounded-md bg-[#00ff88] flex-shrink-0" />
          <span className="font-mono font-semibold text-[#f0f0f0] text-sm">Paytree</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#444] hover:text-[#888] transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 pt-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono transition-all ${
                isActive
                  ? "bg-white/[0.05] text-[#e0e0e0]"
                  : "text-[#444] hover:text-[#888] hover:bg-white/[0.03]"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: user + view live */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-1">
        <div className="flex items-center gap-3 px-4 py-2">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center text-xs text-[#888]">
              {(user.name || user.username)?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <span className="text-[#444] text-xs font-mono truncate">@{user.username}</span>
        </div>
        <Link
          href={`/${user.username}`}
          target="_blank"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-mono text-[#444] hover:text-[#888] hover:bg-white/[0.03] transition-all"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          View Live
        </Link>
      </div>
    </div>
  )
}

interface DashboardSidebarProps {
  user: SidebarUser
  children: React.ReactNode
}

export function DashboardSidebar({ user, children }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#080808]">
      {/* Desktop fixed sidebar */}
      <div className="hidden lg:block w-[220px] flex-shrink-0 fixed top-0 left-0 bottom-0 z-40">
        <SidebarContent user={user} pathname={pathname} />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 lg:hidden transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent user={user} pathname={pathname} onClose={() => setOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 lg:ml-[220px] h-screen overflow-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-white/[0.06] bg-[#080808]">
          <button
            onClick={() => setOpen(true)}
            className="text-[#444] hover:text-[#888] transition-colors p-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-mono font-semibold text-[#f0f0f0] text-sm">Paytree</span>
        </div>

        {children}
      </div>
    </div>
  )
}
