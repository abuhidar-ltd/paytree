"use client"

import { useState, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassBrick } from "./obsidian-card"

interface PortalLink {
  id: string
  title: string
  url?: string
  icon?: string
  isFolder: boolean
  children?: PortalLink[]
}

interface DeepPortalProps {
  links: PortalLink[]
  onLinkClick?: (linkId: string, url: string) => void
  className?: string
}

export function DeepPortal({ links, onLinkClick, className = "" }: DeepPortalProps) {
  const [openPortal, setOpenPortal] = useState<string | null>(null)
  const [portalHistory, setPortalHistory] = useState<PortalLink[]>([])
  
  const handlePortalClick = (link: PortalLink) => {
    if (link.isFolder && link.children) {
      setPortalHistory([...portalHistory, link])
      setOpenPortal(link.id)
    } else if (link.url) {
      if (onLinkClick) {
        onLinkClick(link.id, link.url)
      }
      window.open(link.url, '_blank')
    }
  }
  
  const handleBack = () => {
    if (portalHistory.length > 0) {
      const newHistory = [...portalHistory]
      newHistory.pop()
      setPortalHistory(newHistory)
      setOpenPortal(newHistory.length > 0 ? newHistory[newHistory.length - 1].id : null)
    }
  }
  
  const currentLinks = openPortal
    ? portalHistory[portalHistory.length - 1]?.children || []
    : links.filter(l => !l.isFolder || (l.isFolder && l.children && l.children.length > 0))
  
  const topLevelLinks = links.filter(l => !l.isFolder)
  const topLevelFolders = links.filter(l => l.isFolder)
  
  return (
    <div className={`space-y-4 ${className}`}>
      <AnimatePresence mode="wait">
        {openPortal ? (
          <motion.div
            key={openPortal}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-4"
          >
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="back-btn flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              BACK TO {portalHistory.length > 1 ? portalHistory[portalHistory.length - 2].title.toUpperCase() : "DASHBOARD"}
            </button>
            
            {/* Portal Header */}
            <div className="text-center py-2">
              <h3 className="text-xl font-bold text-white">
                {portalHistory[portalHistory.length - 1]?.title}
              </h3>
            </div>
            
            {/* Nested Links */}
            <div className="bento-grid">
              {currentLinks.map((link, index) => (
                <PortalItem
                  key={link.id}
                  link={link}
                  index={index}
                  onClick={() => handlePortalClick(link)}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bento-grid"
          >
            {/* Folders First */}
            {topLevelFolders.map((link, index) => (
              <PortalItem
                key={link.id}
                link={link}
                index={index}
                onClick={() => handlePortalClick(link)}
                span={2}
              />
            ))}
            
            {/* Regular Links */}
            {topLevelLinks.map((link, index) => (
              <PortalItem
                key={link.id}
                link={link}
                index={index + topLevelFolders.length}
                onClick={() => handlePortalClick(link)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface PortalItemProps {
  link: PortalLink
  index: number
  onClick: () => void
  span?: 1 | 2
}

function PortalItem({ link, index, onClick, span = 1 }: PortalItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: index * 0.05 
      }}
      className={span === 2 ? "span-2" : ""}
    >
      <GlassBrick onClick={onClick} span={span}>
        <div className="label">
          {link.isFolder ? "Portal" : "Link"}
        </div>
        <div className="title flex items-center gap-2">
          {link.icon && <span>{link.icon}</span>}
          {link.title}
        </div>
        {link.isFolder && link.children && (
          <div className="mt-2 text-sm text-[#888888]">
            {link.children.length} items inside
          </div>
        )}
        {link.isFolder && (
          <div className="absolute bottom-4 right-4 text-[#00ff88]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </GlassBrick>
    </motion.div>
  )
}

// Folder/Portal creation for dashboard
interface PortalBuilderProps {
  onCreateFolder: (title: string, icon?: string) => void
  onCreateLink: (title: string, url: string, icon?: string, parentId?: string) => void
  folders: PortalLink[]
}

export function PortalBuilder({
  onCreateFolder,
  onCreateLink,
  folders
}: PortalBuilderProps) {
  const [mode, setMode] = useState<"link" | "folder">("link")
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [icon, setIcon] = useState("")
  const [parentId, setParentId] = useState<string>("")
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === "folder") {
      onCreateFolder(title, icon || undefined)
    } else {
      onCreateLink(title, url, icon || undefined, parentId || undefined)
    }
    
    // Reset form
    setTitle("")
    setUrl("")
    setIcon("")
    setParentId("")
  }
  
  return (
    <div className="obsidian-card-static p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Add New</h3>
        
        {/* Mode Toggle */}
        <div className="flex bg-[rgba(255,255,255,0.05)] rounded-full p-1">
          <button
            onClick={() => setMode("link")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === "link" 
                ? "bg-[rgba(0,255,136,0.2)] text-[#00ff88]" 
                : "text-[#888888]"
            }`}
          >
            Link
          </button>
          <button
            onClick={() => setMode("folder")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === "folder" 
                ? "bg-[rgba(0,255,136,0.2)] text-[#00ff88]" 
                : "text-[#888888]"
            }`}
          >
            Portal
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[1fr_80px] gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === "folder" ? "Portal name" : "Link title"}
            className="input-obsidian"
            required
          />
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📚"
            className="input-obsidian text-center"
          />
        </div>
        
        {mode === "link" && (
          <>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="input-obsidian w-full"
              required
            />
            
            {folders.length > 0 && (
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="input-obsidian w-full"
              >
                <option value="">No folder (top level)</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.icon} {folder.title}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
        
        <button
          type="submit"
          className="btn-accent-solid w-full"
        >
          {mode === "folder" ? "Create Portal" : "Add Link"}
        </button>
      </form>
    </div>
  )
}

