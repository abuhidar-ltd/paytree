"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Search, Download, Loader2, Check, AlertCircle,
  Mail, Sparkles, ArrowRight, Trash2, ChevronUp,
} from "lucide-react"
import { GlassBrick } from "./obsidian-card"
import type { PlanId } from "@/lib/plans"

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
  userPlan?: PlanId
}

type ExportState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string }

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

export function AudienceTable({ className = "", userPlan = "free" }: AudienceTableProps) {
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
  const [exportState, setExportState] = useState<ExportState>({ kind: "idle" })
  const exportTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canExport = userPlan !== "free"

  const fetchAudience = useCallback(async () => {
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
  }, [pagination.page, pagination.limit, sortBy, sortOrder, search, sourceFilter])

  useEffect(() => {
    fetchAudience()
  }, [pagination.page, sortBy, sortOrder, sourceFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((p) => ({ ...p, page: 1 }))
      fetchAudience()
    }, 300)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (exportTimer.current) clearTimeout(exportTimer.current) }, [])

  // Clear selection when the visible page changes
  useEffect(() => { setSelectedIds(new Set()) }, [pagination.page])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/audience/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")

      setAudience((prev) => prev.filter((a) => a.id !== id))
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
      setSelectedIds((prev) => {
        const next = new Set(prev); next.delete(id); return next
      })
      toast.success("Email removed")
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleting(null)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = async (ids?: string[]) => {
    if (!canExport) return
    if (exportTimer.current) clearTimeout(exportTimer.current)
    setExportState({ kind: "loading" })
    try {
      const qs = ids && ids.length > 0 ? `?ids=${encodeURIComponent(ids.join(","))}` : ""
      const res = await fetch(`/api/audience/export${qs}`)
      if (!res.ok) {
        let message = "Export failed"
        try {
          const body = await res.json()
          if (body?.error) message = body.error
        } catch { /* non-JSON */ }
        throw new Error(message)
      }
      const blob = await res.blob()
      const today = new Date().toISOString().split("T")[0]
      const suffix = ids && ids.length > 0 ? "-selected" : ""
      downloadBlob(blob, `paytree-audience${suffix}-${today}.csv`)

      setExportState({ kind: "success" })
      exportTimer.current = setTimeout(() => setExportState({ kind: "idle" }), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed"
      setExportState({ kind: "error", message })
      exportTimer.current = setTimeout(() => setExportState({ kind: "idle" }), 3000)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === audience.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(audience.map((a) => a.id)))
  }

  const handleSort = (column: string) => {
    if (sortBy === column) setSortOrder((p) => (p === "asc" ? "desc" : "asc"))
    else { setSortBy(column); setSortOrder("desc") }
  }

  const totalContacts = pagination.total
  const selectedCount = selectedIds.size
  const showEmptyState =
    !loading && totalContacts === 0 && !search && !sourceFilter

  // ── Empty state ─────────────────────────────────────────────────
  if (showEmptyState) {
    return (
      <div className={className}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="flex flex-col items-center justify-center text-center py-12 px-6"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{
              background: "rgba(0,255,136,0.08)",
              border: "1px solid rgba(0,255,136,0.18)",
            }}
          >
            <Mail size={22} className="text-[#00ff88]" />
          </div>
          <p className="text-sm font-medium text-white mb-1.5">
            No emails captured yet
          </p>
          <p className="text-xs font-mono text-[#666] max-w-[320px] mb-5 leading-relaxed">
            Add a vault card to your page to start capturing emails from visitors.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-2 text-xs hover:opacity-90 transition-opacity"
          >
            Add vault card <ArrowRight size={12} />
          </a>
        </motion.div>
      </div>
    )
  }

  // ── Export button styling ───────────────────────────────────────
  const exportLabel = (() => {
    if (!canExport) return "Export CSV"
    if (selectedCount > 0 && exportState.kind === "idle") {
      return `Export selected (${selectedCount})`
    }
    switch (exportState.kind) {
      case "loading": return "Exporting…"
      case "success": return "Downloaded"
      case "error":   return "Export failed"
      default:        return "Export CSV"
    }
  })()

  const exportColor =
    exportState.kind === "success" ? "#00ff88"
    : exportState.kind === "error" ? "#ff5555"
    : canExport ? "#d8d8d8" : "#555"

  const exportDisabled =
    !canExport || exportState.kind === "loading" || exportState.kind === "success"

  return (
    <div className={className}>
      {/* ── Header row: count + controls ──────────────────────────── */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-[#888] tabular-nums">
            {totalContacts.toLocaleString()}{" "}
            {totalContacts === 1 ? "contact" : "contacts"} captured
          </span>

          {/* Export button (stateful) */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => handleExport(selectedCount > 0 ? Array.from(selectedIds) : undefined)}
              disabled={exportDisabled}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl transition-all disabled:cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                color: exportColor,
                opacity: !canExport ? 0.55 : 1,
              }}
            >
              {exportState.kind === "loading" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : exportState.kind === "success" ? (
                <Check size={12} />
              ) : exportState.kind === "error" ? (
                <AlertCircle size={12} />
              ) : (
                <Download size={12} />
              )}
              <span>{exportLabel}</span>
            </button>

            {!canExport && (
              <div
                className="pointer-events-none absolute right-0 top-full mt-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-[#d8d8d8] shadow-xl"
                style={{
                  background: "#0f0f0f",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                }}
              >
                <Sparkles size={10} className="inline mr-1 text-[#00ff88]" />
                Upgrade to Starter to export emails
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emails…"
              className="input-obsidian w-full pl-9 text-sm"
            />
          </div>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="input-obsidian min-w-[140px] text-sm"
          >
            <option value="">All sources</option>
            <option value="vault">Vault</option>
            <option value="form">Form</option>
            <option value="purchase">Purchase</option>
            <option value="manual">Manual</option>
            <option value="newsletter">Newsletter</option>
          </select>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
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
                    aria-label="Select all rows on this page"
                  />
                </th>
                <th
                  className="text-left p-4 text-[10px] font-mono uppercase tracking-widest text-[#888] cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("email")}
                >
                  <span className="flex items-center gap-1.5">
                    Email
                    {sortBy === "email" && (
                      <ChevronUp
                        size={12}
                        className={`transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                      />
                    )}
                  </span>
                </th>
                <th className="text-left p-4 text-[10px] font-mono uppercase tracking-widest text-[#888]">
                  Source
                </th>
                <th className="text-left p-4 text-[10px] font-mono uppercase tracking-widest text-[#888]">
                  Vault item
                </th>
                <th
                  className="text-left p-4 text-[10px] font-mono uppercase tracking-widest text-[#888] cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("capturedAt")}
                >
                  <span className="flex items-center gap-1.5">
                    Captured
                    {sortBy === "capturedAt" && (
                      <ChevronUp
                        size={12}
                        className={`transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                      />
                    )}
                  </span>
                </th>
                <th className="w-10 p-4"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {loading ? (
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
                      <p className="text-sm text-[#888]">No emails match your filters</p>
                      <p className="text-xs font-mono text-[#555] mt-1">
                        Try clearing your search or source filter
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
                            const next = new Set(selectedIds)
                            if (next.has(member.id)) next.delete(member.id)
                            else next.add(member.id)
                            setSelectedIds(next)
                          }}
                          className="w-4 h-4 rounded border-[rgba(255,255,255,0.2)] bg-transparent"
                          aria-label={`Select ${member.email}`}
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-white text-sm">{member.email}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider ${
                            member.source === "vault"
                              ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88]"
                              : "bg-[rgba(255,255,255,0.05)] text-[#888]"
                          }`}
                        >
                          {member.source || "unknown"}
                        </span>
                      </td>
                      <td className="p-4">
                        {member.vaultItem ? (
                          <span className="flex items-center gap-2 text-sm text-[#888]">
                            <span>{member.vaultItem.icon || "🔒"}</span>
                            <span className="truncate max-w-[120px]">{member.vaultItem.title}</span>
                          </span>
                        ) : (
                          <span className="text-[#555]">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-mono text-[#888]">
                        {formatDate(member.capturedAt)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDelete(member.id)}
                          disabled={deleting === member.id}
                          className="p-2 text-[#666] hover:text-red-500 transition-colors disabled:opacity-50"
                          aria-label="Delete contact"
                        >
                          {deleting === member.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
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
            <p className="text-xs font-mono text-[#888] tabular-nums">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-obsidian px-3 py-1.5 text-xs font-mono disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn-obsidian px-3 py-1.5 text-xs font-mono disabled:opacity-40"
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
