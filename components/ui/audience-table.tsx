"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { GlassBrick } from "./obsidian-card"

interface AudienceMember {
  id: string
  email: string
  source: string | null
  capturedAt: string
  vaultItem?: {
    id: string
    title: string
    icon: string | null
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AudienceTableProps {
  className?: string
}

export function AudienceTable({ className = "" }: AudienceTableProps) {
  const [audience, setAudience] = useState<AudienceMember[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [sortBy, setSortBy] = useState("capturedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Fetch audience data
  const fetchAudience = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })
      
      if (search) params.set("search", search)
      if (sourceFilter) params.set("source", sourceFilter)
      
      const res = await fetch(`/api/audience?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      
      const data = await res.json()
      setAudience(data.audience)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Failed to load audience")
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchAudience()
  }, [pagination.page, sortBy, sortOrder, sourceFilter])
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(p => ({ ...p, page: 1 }))
      fetchAudience()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])
  
  // Handle delete
  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/audience/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      
      setAudience(prev => prev.filter(a => a.id !== id))
      setPagination(prev => ({ ...prev, total: prev.total - 1 }))
      toast.success("Email removed")
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleting(null)
    }
  }
  
  // Handle CSV export
  const handleExport = async () => {
    try {
      const res = await fetch("/api/audience/export")
      if (!res.ok) throw new Error("Failed to export")
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `paytree-audience-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("Exported to CSV!")
    } catch {
      toast.error("Export failed")
    }
  }
  
  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.size === audience.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(audience.map(a => a.id)))
    }
  }
  
  // Toggle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }
  
  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  
  return (
    <div className={className}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emails..."
            className="input-obsidian w-full pl-11"
          />
        </div>
        
        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="input-obsidian min-w-[140px]"
        >
          <option value="">All Sources</option>
          <option value="vault">Vault</option>
          <option value="manual">Manual</option>
          <option value="newsletter">Newsletter</option>
        </select>
        
        {/* Export Button */}
        <button onClick={handleExport} className="btn-accent flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>
      
      {/* Table */}
      <GlassBrick className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.1)]">
                <th className="w-10 p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === audience.length && audience.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-transparent"
                  />
                </th>
                <th 
                  className="text-left p-4 text-xs font-bold uppercase text-[#888888] cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <span className="flex items-center gap-2">
                    Email
                    {sortBy === "email" && (
                      <svg className={`w-3 h-3 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </th>
                <th className="text-left p-4 text-xs font-bold uppercase text-[#888888]">
                  Source
                </th>
                <th className="text-left p-4 text-xs font-bold uppercase text-[#888888]">
                  Vault Item
                </th>
                <th 
                  className="text-left p-4 text-xs font-bold uppercase text-[#888888] cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("capturedAt")}
                >
                  <span className="flex items-center gap-2">
                    Captured
                    {sortBy === "capturedAt" && (
                      <svg className={`w-3 h-3 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </th>
                <th className="w-10 p-4"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-[rgba(255,255,255,0.05)]">
                      <td className="p-4"><div className="w-4 h-4 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                      <td className="p-4"><div className="w-48 h-4 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                      <td className="p-4"><div className="w-20 h-4 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                      <td className="p-4"><div className="w-24 h-4 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                      <td className="p-4"><div className="w-32 h-4 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" /></td>
                      <td className="p-4"></td>
                    </tr>
                  ))
                ) : audience.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="text-3xl mb-2 opacity-40">📧</div>
                      <p className="text-[#888888]">No emails captured yet</p>
                      <p className="text-sm text-[#555555] mt-1">
                        Add vault items to start collecting emails
                      </p>
                    </td>
                  </tr>
                ) : (
                  audience.map((member) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(member.id)}
                          onChange={() => {
                            const newSet = new Set(selectedIds)
                            if (newSet.has(member.id)) {
                              newSet.delete(member.id)
                            } else {
                              newSet.add(member.id)
                            }
                            setSelectedIds(newSet)
                          }}
                          className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-transparent"
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-white">{member.email}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          member.source === "vault" 
                            ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88]"
                            : "bg-[rgba(255,255,255,0.05)] text-[#888888]"
                        }`}>
                          {member.source || "unknown"}
                        </span>
                      </td>
                      <td className="p-4">
                        {member.vaultItem ? (
                          <span className="flex items-center gap-2 text-sm text-[#888888]">
                            <span>{member.vaultItem.icon || "🔒"}</span>
                            <span className="truncate max-w-[120px]">{member.vaultItem.title}</span>
                          </span>
                        ) : (
                          <span className="text-[#555555]">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[#888888]">
                        {formatDate(member.capturedAt)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDelete(member.id)}
                          disabled={deleting === member.id}
                          className="p-2 text-[#888888] hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {deleting === member.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[rgba(255,255,255,0.1)]">
            <p className="text-sm text-[#888888]">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-obsidian px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-obsidian px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </GlassBrick>
    </div>
  )
}

