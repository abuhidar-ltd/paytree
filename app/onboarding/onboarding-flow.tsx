"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { StandaloneSwatch } from "@/components/ui/color-swatch-selector"
import { detectLinkType } from "@/lib/link-type"

// ─── Constants ────────────────────────────────────────────────────────────────

const ONBOARDING_COLORS = [
  { name: "Mint",   hex: "#00ff88" },
  { name: "Purple", hex: "#9146ff" },
  { name: "Red",    hex: "#ff5555" },
  { name: "Blue",   hex: "#378add" },
  { name: "Orange", hex: "#ff9500" },
  { name: "Pink",   hex: "#ff2d78" },
]

const CATEGORIES = [
  { id: "trader",    icon: "📈", label: "Trader / Investor" },
  { id: "creator",   icon: "🎥", label: "Content Creator" },
  { id: "educator",  icon: "🎓", label: "Educator / Coach" },
  { id: "musician",  icon: "🎵", label: "Musician / Artist" },
  { id: "developer", icon: "💻", label: "Developer / Builder" },
  { id: "other",     icon: "✦",  label: "Other" },
]

const CATEGORY_PREVIEWS: Record<string, { title: string; icon: string }[]> = {
  trader:    [{ title: "Stats · Win Rate 87%", icon: "📊" }, { title: "Next Drop →", icon: "🎬" }],
  creator:   [{ title: "Latest YouTube Video", icon: "📺" }, { title: "Exclusive Vault", icon: "🔒" }],
  educator:  [{ title: "My Course",             icon: "🎓" }, { title: "Free Resources", icon: "🔒" }],
  musician:  [{ title: "New Album on Spotify",  icon: "🎵" }, { title: "Booking & Merch", icon: "🔗" }],
  developer: [{ title: "My Portfolio",          icon: "💻" }, { title: "GitHub →",        icon: "🐙" }],
  other:     [{ title: "My Website",            icon: "🌐" }, { title: "Contact Me",      icon: "📬" }],
}

const PLATFORMS = [
  { id: "youtube",   icon: "📺", label: "YouTube",     prefix: "https://youtube.com/@" },
  { id: "instagram", icon: "📸", label: "Instagram",   prefix: "https://instagram.com/" },
  { id: "twitter",   icon: "𝕏",  label: "Twitter/X",  prefix: "https://x.com/" },
  { id: "tiktok",    icon: "🎬", label: "TikTok",      prefix: "https://tiktok.com/@" },
  { id: "spotify",   icon: "🎵", label: "Spotify",     prefix: "https://open.spotify.com/" },
  { id: "other",     icon: "🔗", label: "Other",       prefix: "https://" },
]

const LINK_TYPE_ICONS: Record<string, string> = {
  youtube:   "📺",
  instagram: "📸",
  twitter:   "𝕏",
  tiktok:    "🎬",
  spotify:   "🎵",
  twitch:    "🎮",
  generic:   "🔗",
}

const LINK_TYPE_TITLES: Record<string, string> = {
  youtube:   "My YouTube Channel",
  instagram: "Follow on Instagram",
  twitter:   "Follow on Twitter/X",
  tiktok:    "Follow on TikTok",
  spotify:   "Listen on Spotify",
  twitch:    "Watch on Twitch",
  generic:   "My Link",
}

// ─── Framer variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 280 : -280, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 280 : -280,
    opacity: 0,
    transition: { duration: 0.15 },
  }),
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UserData {
  username: string
  name: string | null
  image: string | null
}

// ─── Main component ────────────────────────────────────────────────────────────

export function OnboardingFlow({ user }: { user: UserData }) {
  const router = useRouter()

  // Navigation
  const [step, setStep] = useState(-1)
  const [direction, setDirection] = useState(1)

  // Step 0 — Identity
  const [name, setName] = useState(user.name ?? "")
  const [username, setUsername] = useState(user.username)
  const [bio, setBio] = useState("")
  const [image, setImage] = useState<string | null>(user.image)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 1 — Accent color
  const [accentColor, setAccentColor] = useState("#00ff88")
  const [customHex, setCustomHex] = useState("")

  // Step 2 — Category
  const [category, setCategory] = useState<string | null>(null)

  // Step 3 — First link
  const [firstLinkUrl, setFirstLinkUrl] = useState("")
  const [firstLinkTitle, setFirstLinkTitle] = useState("")
  const [firstLinkIcon, setFirstLinkIcon] = useState("🔗")

  // Step 4 — Done
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const saveCalledRef = useRef(false)

  // ─── Username auto-suggest from display name ─────────────────────────────────

  useEffect(() => {
    if (!name) return
    const suggested = name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 30)
    if (suggested) setUsername(suggested)
  }, [name])

  // ─── Username availability debounce ─────────────────────────────────────────

  useEffect(() => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current)

    if (!username || username === user.username) {
      setUsernameAvailable(null)
      return
    }

    if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
      setUsernameAvailable(false)
      return
    }

    setIsCheckingUsername(true)
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/check-username?username=${encodeURIComponent(username)}`
        )
        const data = await res.json()
        setUsernameAvailable(data.available ?? false)
      } catch {
        setUsernameAvailable(null)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 400)

    return () => {
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current)
    }
  }, [username, user.username])

  // ─── Link type auto-detect ────────────────────────────────────────────────────

  useEffect(() => {
    if (!firstLinkUrl) return
    try {
      const type = detectLinkType(firstLinkUrl)
      setFirstLinkIcon(LINK_TYPE_ICONS[type] ?? "🔗")
      if (!firstLinkTitle) {
        setFirstLinkTitle(LINK_TYPE_TITLES[type] ?? "My Link")
      }
    } catch {
      // Ignore parse errors for partial URLs
    }
  }, [firstLinkUrl])

  // ─── Save all on step 4 mount ─────────────────────────────────────────────────

  useEffect(() => {
    if (step === 4 && !saveCalledRef.current) {
      saveCalledRef.current = true
      saveAll()
    }
  }, [step])

  const saveAll = async () => {
    setIsSaving(true)
    try {
      const profileBody: Record<string, unknown> = {
        accentColor,
        ...(name && { name }),
        ...(bio && { bio }),
        ...(image && { image }),
        ...(username !== user.username && { username }),
      }

      const calls: Promise<unknown>[] = [
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileBody),
        }),
      ]

      if (firstLinkUrl) {
        calls.push(
          fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: firstLinkTitle || "My Link",
              url: firstLinkUrl,
              icon: firstLinkIcon,
            }),
          })
        )
      }

      await Promise.all(calls)

      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarded: true }),
      })

      // Record referral if user arrived via a ref link
      const refCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("paytree_ref="))
        ?.split("=")[1]
      if (refCookie) {
        fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: decodeURIComponent(refCookie) }),
        }).catch(() => {})
        document.cookie = "paytree_ref=; path=/; max-age=0"
      }

      setIsSaved(true)
      router.push("/dashboard")
    } catch (err) {
      console.error("Onboarding save failed:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Navigation helpers ───────────────────────────────────────────────────────

  const advance = useCallback(() => {
    setDirection(1)
    setStep((s) => s + 1)
  }, [])

  const retreat = useCallback(() => {
    setDirection(-1)
    setStep((s) => s - 1)
  }, [])

  const skip = useCallback(() => advance(), [advance])

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        const { url } = await res.json()
        setImage(url)
      } else {
        toast.error("Image upload failed. Please try again.")
      }
    } catch {
      toast.error("Image upload failed. Please try again.")
    }
  }

  const handleCustomHex = (val: string) => {
    setCustomHex(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setAccentColor(val)
    }
  }

  const handleCopyUrl = async () => {
    const url = `https://paytree.to/${username}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy link")
    }
  }

  const handlePublish = async () => {
    try {
      const res = await fetch("/api/publish", { method: "POST" })
      if (res.ok) {
        router.push("/dashboard")
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.status === 403) {
          toast.error(data.error ?? "Upgrade to Starter or Pro to publish your page.")
          router.push("/pricing")
        } else {
          toast.error(data.error ?? "Something went wrong.")
          router.push("/dashboard")
        }
      }
    } catch {
      toast.error("Something went wrong.")
      router.push("/dashboard")
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderWelcome = () => (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 mb-8 mx-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)] shadow-[0_0_20px_rgba(0,255,136,0.4)]" />
          </div>

          <div className="text-[#00ff88] font-mono text-sm uppercase tracking-[0.3em] mb-4">
            PAYTREE
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Your whole online presence.{" "}
            <span className="text-[#00ff88]">One link.</span>
          </h1>

          <p className="text-[#888] text-lg mb-10">
            Let&apos;s build your page in under 2 minutes.
          </p>

          <button
            onClick={advance}
            className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-6 py-4 text-base hover:opacity-90 transition-opacity mb-4"
          >
            Let&apos;s go →
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="text-[#444] text-sm font-mono hover:text-[#888] transition-colors"
          >
            Already set up? Go to dashboard →
          </button>
        </motion.div>
      </div>
    </div>
  )

  const renderStep0 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Set up your identity</h2>
        <p className="text-[#888] text-sm">This is what visitors see first.</p>
      </div>

      {/* Photo upload */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-white/20 hover:border-[#00ff88]/40 transition-colors flex-shrink-0 group"
        >
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.03] gap-1">
              <span className="text-xl">📷</span>
              <span className="text-[10px] font-mono text-[#444] group-hover:text-[#888] transition-colors">
                PHOTO
              </span>
            </div>
          )}
          {image && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs font-mono text-white">Change</span>
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImageUpload}
        />
        <div className="text-sm text-[#555]">
          <div className="text-[#e0e0e0] font-medium mb-0.5">Profile photo</div>
          <div>Click to upload. JPG, PNG, WebP. Max 5MB.</div>
        </div>
      </div>

      {/* Display name */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1.5">
          Display name <span className="text-red-400">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-obsidian w-full"
          placeholder="Your name"
          autoComplete="off"
        />
      </div>

      {/* Username */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1.5">
          Username
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-sm font-mono text-[#555] select-none">
            paytree.to/
          </span>
          <input
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
            }
            className="input-obsidian w-full pl-[calc(16px+84px)]"
            placeholder="username"
            autoComplete="off"
          />
          {isCheckingUsername && (
            <span className="absolute right-4 text-[#888] text-xs font-mono">...</span>
          )}
          {!isCheckingUsername && usernameAvailable === true && (
            <span className="absolute right-4 text-[#00ff88] text-sm">✓</span>
          )}
          {!isCheckingUsername && usernameAvailable === false && (
            <span className="absolute right-4 text-red-400 text-sm">✗</span>
          )}
        </div>
        {usernameAvailable === false && (
          <p className="text-xs text-red-400 font-mono mt-1">Username is already taken.</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1.5">
          Bio
        </label>
        <div className="relative">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            rows={3}
            className="input-obsidian w-full resize-none"
            placeholder="What do you do? (optional)"
          />
          <span className="absolute bottom-3 right-4 text-[10px] font-mono text-[#444]">
            {bio.length}/160
          </span>
        </div>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Pick your accent color</h2>
        <p className="text-[#888] text-sm">Sets the glow and highlight across your entire page.</p>
      </div>

      <StandaloneSwatch
        colors={ONBOARDING_COLORS}
        value={accentColor}
        onChange={(hex) => {
          setAccentColor(hex)
          setCustomHex(hex)
        }}
        className="flex-wrap gap-4"
      />

      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1.5">
          Custom hex
        </label>
        <input
          value={customHex}
          onChange={(e) => handleCustomHex(e.target.value)}
          className="input-obsidian w-full font-mono"
          placeholder="#00ff88"
          maxLength={7}
          spellCheck={false}
        />
      </div>

      {/* Color preview strip */}
      <div
        className="h-12 rounded-xl transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)`,
          border: `1px solid ${accentColor}44`,
          boxShadow: `0 0 20px ${accentColor}22`,
        }}
      />
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">What best describes you?</h2>
        <p className="text-[#888] text-sm">
          We&apos;ll suggest the right blocks for your profile.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                active
                  ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]"
                  : "bg-white/[0.03] border-white/[0.07] text-[#888] hover:border-white/20 hover:text-[#e0e0e0]"
              }`}
              style={active ? { borderColor: `${accentColor}4d`, color: accentColor, background: `${accentColor}1a` } : undefined}
            >
              <span className="text-xl flex-shrink-0">{cat.icon}</span>
              <span className="text-sm font-mono font-medium leading-tight">{cat.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Add your first link</h2>
        <p className="text-[#888] text-sm">Paste any URL — we&apos;ll detect the platform.</p>
      </div>

      {/* Quick platform buttons */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setFirstLinkUrl(p.prefix)
              setFirstLinkIcon(LINK_TYPE_ICONS[p.id] ?? "🔗")
              setFirstLinkTitle(LINK_TYPE_TITLES[p.id] ?? "My Link")
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[#888] text-xs font-mono hover:border-white/20 hover:text-[#e0e0e0] transition-all"
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* URL input */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1.5">
          URL
        </label>
        <div className="relative flex items-center">
          {firstLinkIcon && (
            <span className="absolute left-4 text-lg">{firstLinkIcon}</span>
          )}
          <input
            value={firstLinkUrl}
            onChange={(e) => setFirstLinkUrl(e.target.value)}
            className="input-obsidian w-full pl-12"
            placeholder="https://..."
            autoComplete="off"
          />
        </div>
      </div>

      {/* Title input */}
      {firstLinkUrl && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#444] mb-1.5">
            Title
          </label>
          <input
            value={firstLinkTitle}
            onChange={(e) => setFirstLinkTitle(e.target.value)}
            className="input-obsidian w-full"
            placeholder="Link title"
          />
        </motion.div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-8 text-center">
      {/* Checkmark animation */}
      <div className="flex justify-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: `${accentColor}15`,
            border: `2px solid ${accentColor}40`,
            boxShadow: `0 0 40px ${accentColor}30`,
          }}
        >
          {isSaving ? (
            <motion.div
              className="w-8 h-8 rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${accentColor}40`, borderTopColor: accentColor }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <motion.path
                d="M5 13l4 4L19 7"
                stroke={accentColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Your page is ready.</h2>
        <p className="text-[#888] text-sm">
          {isSaving ? "Saving your profile…" : "Share your link with the world."}
        </p>
      </div>

      {/* URL pill */}
      <button
        onClick={handleCopyUrl}
        className="mx-auto flex items-center gap-3 px-5 py-3 rounded-full border transition-all group"
        style={{
          background: `${accentColor}0d`,
          borderColor: `${accentColor}33`,
        }}
      >
        <span className="font-mono text-sm text-[#e0e0e0]">
          paytree.to/{username}
        </span>
        <span
          className="text-xs font-mono transition-colors"
          style={{ color: copied ? accentColor : "#555" }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </span>
      </button>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={handlePublish}
          disabled={isSaving}
          className="w-full py-4 rounded-xl font-mono font-semibold text-black text-base transition-opacity disabled:opacity-50"
          style={{ background: accentColor }}
        >
          Publish & Share →
        </button>
        <button
          onClick={() => router.push("/dashboard/studio")}
          disabled={isSaving}
          className="w-full py-3 rounded-xl font-mono text-sm bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] hover:border-white/20 transition-colors disabled:opacity-50"
        >
          Customize more
        </button>
      </div>

      <p className="text-xs text-[#444] font-mono">
        Publishing requires a Starter or Pro plan.
      </p>
    </div>
  )

  // ─── Step content map ──────────────────────────────────────────────────────────

  const STEP_LABELS = [
    "Identity",
    "Color",
    "Category",
    "First link",
    "Done",
  ]

  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderStep0()
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return null
    }
  }

  const canContinue = () => {
    if (step === 0) return name.trim().length > 0
    return true
  }

  // ─── Welcome ──────────────────────────────────────────────────────────────────

  if (step === -1) return renderWelcome()

  // ─── Main layout (steps 0–4) ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* ── Left: form panel ── */}
        <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-14 py-8 max-w-2xl w-full mx-auto lg:mx-0">

          {/* Progress + skip */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              {STEP_LABELS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 24 : 8,
                    height: 8,
                    background:
                      i < step
                        ? accentColor
                        : i === step
                        ? accentColor
                        : "rgba(255,255,255,0.1)",
                    opacity: i === step ? 1 : i < step ? 0.7 : 1,
                  }}
                />
              ))}
              <span className="text-[#444] text-xs font-mono ml-2">
                {step + 1}/{STEP_LABELS.length}
              </span>
            </div>

            {step < 4 && (
              <button
                onClick={() => router.push("/dashboard")}
                className="text-[#444] text-sm font-mono hover:text-[#888] transition-colors"
              >
                skip →
              </button>
            )}
          </div>

          {/* Animated step content */}
          <div className="flex-1">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          {step < 4 && (
            <div className="mt-8 space-y-3">
              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    onClick={retreat}
                    className="px-5 py-3 rounded-xl font-mono text-sm bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] hover:border-white/20 transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={advance}
                  disabled={!canContinue()}
                  className="flex-1 py-3 rounded-xl font-mono font-semibold text-black text-sm transition-opacity disabled:opacity-40"
                  style={{ background: accentColor }}
                >
                  {step === 3 ? "Finish →" : "Continue →"}
                </button>
              </div>

              {step > 0 && step < 4 && (
                <button
                  onClick={skip}
                  className="w-full text-center text-[#444] text-sm font-mono hover:text-[#888] transition-colors py-1"
                >
                  Skip this step →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right: phone preview ── */}
        <div className="w-full lg:w-[380px] lg:sticky lg:top-0 lg:h-screen flex items-center justify-center p-8 bg-[#060606] border-t lg:border-t-0 lg:border-l border-white/[0.04]">
          <div className="text-center">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#333] mb-6">
              Live preview
            </div>
            <PhonePreview
              name={name}
              username={username}
              bio={bio}
              image={image}
              accentColor={accentColor}
              category={category}
              firstLinkUrl={firstLinkUrl}
              firstLinkTitle={firstLinkTitle}
              firstLinkIcon={firstLinkIcon}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Phone Preview ─────────────────────────────────────────────────────────────

interface PhonePreviewProps {
  name: string
  username: string
  bio: string
  image: string | null
  accentColor: string
  category: string | null
  firstLinkUrl: string
  firstLinkTitle: string
  firstLinkIcon: string
}

function PhonePreview({
  name,
  username,
  bio,
  image,
  accentColor,
  category,
  firstLinkUrl,
  firstLinkTitle,
  firstLinkIcon,
}: PhonePreviewProps) {
  const accent = accentColor || "#00ff88"
  const glow = `${accent}33`
  const displayName = name || "Your Name"
  const displayUsername = username || "username"

  const previewCards = category ? CATEGORY_PREVIEWS[category] : []
  const showDefaults = !firstLinkUrl && previewCards.length === 0

  return (
    <div
      style={{
        width: 240,
        height: 480,
        background: "#030303",
        borderRadius: 28,
        border: "6px solid #1a1a1a",
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        flexShrink: 0,
      }}
    >
      {/* Notch */}
      <div
        style={{
          width: 80,
          height: 4,
          background: "#1a1a1a",
          borderRadius: 2,
          margin: "8px auto 0",
        }}
      />

      <div
        style={{
          overflowY: "auto",
          height: "calc(100% - 18px)",
          padding: "16px 14px 20px",
        }}
      >
        {/* Avatar + name */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              margin: "0 auto 8px",
              border: `2px solid ${accent}`,
              boxShadow: `0 0 16px ${glow}`,
              overflow: "hidden",
              background: `linear-gradient(135deg, ${accent}22, #0a0a14)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
          >
            {image ? (
              <img
                src={image}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  color: accent,
                  fontWeight: 700,
                  fontSize: 22,
                  transition: "color 0.3s",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div
            style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 2 }}
          >
            {displayName}
          </div>
          <div style={{ fontSize: 10, color: "#666", marginBottom: bio ? 4 : 0 }}>
            @{displayUsername}
          </div>
          {bio && (
            <div
              style={{
                fontSize: 9,
                color: "#888",
                lineHeight: 1.4,
                maxHeight: 32,
                overflow: "hidden",
              }}
            >
              {bio}
            </div>
          )}
        </div>

        {/* Link cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* First link (user entered) */}
          {firstLinkUrl && (
            <div
              style={{
                padding: "9px 11px",
                borderRadius: 12,
                background: `${accent}0d`,
                border: `1px solid ${accent}2a`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "border-color 0.3s, background 0.3s",
              }}
            >
              <span style={{ fontSize: 13 }}>{firstLinkIcon}</span>
              <span
                style={{
                  fontSize: 10,
                  color: "#e0e0e0",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {firstLinkTitle || "My Link"}
              </span>
            </div>
          )}

          {/* Category placeholders */}
          {previewCards.map((card, i) => (
            <div
              key={i}
              style={{
                padding: "9px 11px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13 }}>{card.icon}</span>
              <span style={{ fontSize: 10, color: "#888" }}>{card.title}</span>
            </div>
          ))}

          {/* Default placeholders when nothing is set */}
          {showDefaults && (
            <>
              {[
                { icon: "🔗", title: "Add your first link" },
                { icon: "📸", title: "Connect social media" },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: "9px 11px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.01)",
                    border: "1px dashed rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, opacity: 0.3 }}>{c.icon}</span>
                  <span style={{ fontSize: 10, color: "#333" }}>{c.title}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Branding */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 8,
            color: "#333",
            fontFamily: "monospace",
          }}
        >
          Powered by PayTree
        </div>
      </div>
    </div>
  )
}
