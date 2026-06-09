"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { resolveUserPlan } from "@/lib/plans"
import { ImageCropper } from "@/components/ui/image-cropper"
import { PaywallModal } from "@/components/ui/paywall-modal"
import { toast } from "sonner"
import { Check, ChevronDown, Upload, Sparkles } from "lucide-react"
import { AiBioWriter } from "@/components/ui/ai-bio-writer"
import { getButtonCardStyles } from "@/components/ui/block-renderer"

interface Profile {
  id: string
  name: string | null
  username: string
  bio: string | null
  image: string | null
  theme?: string | null
  primaryColor?: string | null
  backgroundColor?: string | null
  buttonStyle?: string | null
  fontFamily?: string | null
  backgroundStyle?: string | null
  backgroundImageUrl?: string | null
  accentColor?: string | null
  textColor?: string | null
  socialIconPosition?: string | null
  heroStyle?: string | null
  heroImage?: string | null
  cornerRadius?: string | null
  subscriptionStatus?: string | null
  pageStatus?: string | null
}

interface LinkType {
  id: string
  title: string
  url: string
  enabled: boolean
  order: number
  icon?: string | null
  style?: string | null
}

interface SocialLink {
  id: string
  platform: string
  url: string
  enabled: boolean
  order: number
}

interface StudioEditorProps {
  initialProfile: Profile
  initialLinks: LinkType[]
  initialSocialLinks: SocialLink[]
  checkoutSuccess?: boolean
}

// ── Button style mini-preview ──────────────────────────────────────────────────
// Uses the exact same styles applied to live cards so what creators see here
// matches the public profile pixel-for-pixel.

function ButtonStylePreview({ style, accent }: { style: string; accent: string }) {
  const { base } = getButtonCardStyles(style, accent)
  return (
    <div
      style={{
        ...base,
        width: "100%",
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontFamily: "monospace",
        fontWeight: 500,
        borderRadius: 10,
      }}
    >
      Link card
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function StudioEditor({ initialProfile, initialLinks, initialSocialLinks, checkoutSuccess }: StudioEditorProps) {
  const router = useRouter()

  // ── state (unchanged) ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [links, setLinks] = useState<LinkType[]>(initialLinks)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialSocialLinks)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [cropImage, setCropImage] = useState<{ url: string } | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [publishedLink, setPublishedLink] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState(checkoutSuccess || false)
  const [cornerRadius, setCornerRadius] = useState(initialProfile.cornerRadius || "xl")
  const [aiBioOpen, setAiBioOpen] = useState(false)

  const userPlan = resolveUserPlan(profile as any)
  const isPro = userPlan !== "free"
  const isPublished = profile.pageStatus === "published"
  const accent = profile.accentColor || "#00ff88"

  // ── fetch fresh data (unchanged) ───────────────────────────────────────────
  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        const [linksRes, socialRes] = await Promise.all([fetch("/api/links"), fetch("/api/social-links")])
        if (linksRes.ok) { const d = await linksRes.json(); setLinks(d.links || d || []) }
        if (socialRes.ok) { const d = await socialRes.json(); setSocialLinks(d.socialLinks || d || []) }
      } catch (e) {
        console.error("Failed to fetch fresh preview data", e)
      }
    }
    fetchFreshData()
  }, [])

  // ── payment polling (unchanged) ────────────────────────────────────────────
  useEffect(() => {
    if (!checkoutSuccess) return
    let pollCount = 0
    const maxPolls = 20
    const pollSubscription = async () => {
      try {
        const res = await fetch("/api/profile")
        const data = await res.json()
        if (data.subscriptionStatus === "active" || data.subscriptionStatus === "trial" || data.subscriptionStatus === "canceling") {
          if (data.pageStatus === "published") {
            setProfile(data); setProcessingPayment(false)
            toast.success("🎉 Your page is now live!")
            setPublishedLink(`${window.location.origin}/${data.username}`)
            router.replace("/dashboard/studio")
          } else {
            const publishRes = await fetch("/api/publish", { method: "POST" })
            if (publishRes.ok) {
              setProfile({ ...data, pageStatus: "published" }); setProcessingPayment(false)
              toast.success("🎉 Your page is now live!")
              setPublishedLink(`${window.location.origin}/${data.username}`)
              router.replace("/dashboard/studio")
            }
          }
          return true
        }
        return false
      } catch { return false }
    }
    pollSubscription().then(done => {
      if (!done) {
        const interval = setInterval(async () => {
          pollCount++
          const done = await pollSubscription()
          if (done || pollCount >= maxPolls) {
            clearInterval(interval)
            if (pollCount >= maxPolls) {
              setProcessingPayment(false)
              toast.error("Payment processing taking longer than expected. Please refresh.")
            }
          }
        }, 1000)
        return () => clearInterval(interval)
      }
    })
  }, [checkoutSuccess, router])

  // ── autosave debounce (unchanged) ──────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(profile) !== JSON.stringify(initialProfile)) saveProfile()
    }, 1500)
    return () => clearTimeout(timer)
  }, [profile])

  // ── handlers (unchanged) ───────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true)
    try {
      const { id, email, username, subscriptionStatus, pageStatus, publishedAt, clerkId, ...editableFields } = profile as any
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableFields),
      })
      if (res.ok) { setLastSaved(new Date()); toast.success("Changes saved!") }
      else { const e = await res.json(); toast.error(e.error || "Failed to save") }
    } catch { toast.error("Save failed") }
    finally { setSaving(false) }
  }

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return }
    setCropImage({ url: URL.createObjectURL(file) })
    e.target.value = ""
  }

  const handleCroppedImageUpload = async (blob: Blob) => {
    const formData = new FormData()
    formData.append("file", blob, "profile-image.jpg")
    const toastId = toast.loading("Uploading profile image...")
    try {
      const res = await fetch("/api/upload/profile-image", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok) {
        setProfile({ ...profile, image: data.url })
        toast.success("Profile image uploaded!", { id: toastId })
        setCropImage(null)
        await saveProfile()
      } else { toast.error(data.error || "Upload failed", { id: toastId }) }
    } catch { toast.error("Upload failed", { id: toastId }) }
  }

  const handlePublish = async () => {
    await saveProfile()
    const toastId = toast.loading("Publishing your page...")
    try {
      const res = await fetch("/api/publish", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success("Your page is live!", { id: toastId })
        setProfile({ ...profile, pageStatus: "published" })
        setPublishedLink(`${window.location.origin}/${profile.username}`)
      } else {
        if (data.code === "UPGRADE_REQUIRED") setShowPaywall(true)
        toast.error(data.message || "Failed to publish", { id: toastId })
      }
    } catch { toast.error("Failed to publish", { id: toastId }) }
  }

  // ── data ───────────────────────────────────────────────────────────────────
  const ACCENT_COLORS = ["#00ff88", "#9146ff", "#ff5555", "#378add", "#ff9500", "#ff2d78"]

  const BUTTON_STYLES = [
    { value: "glass", label: "Glass" },
    { value: "gradient", label: "Gradient" },
    { value: "glow", label: "Glow" },
    { value: "neon", label: "Neon" },
  ]

  const RADIUS_OPTIONS = [
    { value: "none", label: "None", tw: "rounded-none" },
    { value: "md", label: "Small", tw: "rounded-md" },
    { value: "xl", label: "Medium", tw: "rounded-xl" },
    { value: "full", label: "Full", tw: "rounded-full" },
  ]

  const FONTS = [
    { value: "inter", label: "Inter" },
    { value: "space-mono", label: "Space Mono" },
    { value: "syne", label: "Syne" },
    { value: "outfit", label: "Outfit" },
    { value: "cal-sans", label: "Cal Sans" },
  ]

  const BACKGROUNDS = [
    { value: "none", label: "None" },
    { value: "mesh", label: "Mesh" },
    { value: "particles", label: "Particles" },
    { value: "gradient", label: "Gradient" },
  ]

  // ── section label (simple, no sticky) ─────────────────────────────────────
  const SL = ({ children }: { children: string }) => (
    <h2 className="text-sm font-mono uppercase tracking-widest text-white/30 mb-4">{children}</h2>
  )

  // ── section wrapper class ──────────────────────────────────────────────────
  const sectionCls = "pb-8 mb-8 border-b border-white/[0.06]"

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#080808] text-white overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="h-14 flex-shrink-0 flex items-center justify-between px-3 sm:px-5 border-b border-white/[0.07] bg-[#080808]/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-sm font-mono text-[#e0e0e0]">Design</span>
          {saving && <span className="text-[#00ff88]/50 text-xs font-mono animate-pulse">● Saving...</span>}
          {lastSaved && !saving && <span className="text-[#00ff88]/40 text-xs font-mono">✓ Saved</span>}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => window.open(`/preview/${profile.username}`, "_blank")}
            className="hidden sm:inline-flex bg-white/[0.03] border border-white/[0.08] text-[#888] font-mono rounded-xl px-3 py-1.5 text-xs hover:border-white/20 hover:text-[#e0e0e0] transition-colors"
          >
            Preview
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/preview/${profile.username}`); toast.success("Preview link copied!") }}
            className="hidden sm:inline-flex bg-white/[0.03] border border-white/[0.08] text-[#888] font-mono rounded-xl px-3 py-1.5 text-xs hover:border-white/20 hover:text-[#e0e0e0] transition-colors"
          >
            Copy link
          </button>
          {processingPayment ? (
            <button disabled className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-1.5 text-xs opacity-70">
              Processing...
            </button>
          ) : isPublished ? (
            <button
              onClick={() => setPublishedLink(`${window.location.origin}/${profile.username}`)}
              className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-1.5 text-xs hover:opacity-90 transition-opacity"
            >
              ✓ Published
            </button>
          ) : (
            <button
              onClick={isPro ? handlePublish : () => setShowPaywall(true)}
              className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-4 py-1.5 text-xs hover:opacity-90 transition-opacity"
            >
              🚀 Publish
            </button>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: scrollable settings + fixed save footer ─────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/[0.05]">

          {/* Scroll area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 max-w-[540px] mx-auto w-full">

              {/* ── Section 1: Profile ──────────────────────────────────────── */}
              <div className={sectionCls}>
                <SL>Profile</SL>

                {/* Avatar upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group mb-2.5">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-white/[0.06] border-2 border-white/[0.10] group-hover:border-[#00ff88]/50 transition-all">
                      {profile.image ? (
                        <img src={profile.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                          style={{ background: `${accent}22`, color: accent }}>
                          {profile.name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="studio-profile-img"
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border-2 border-[#080808] hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: accent }}
                    >
                      <Upload size={11} className="text-black" />
                    </label>
                    <input id="studio-profile-img" type="file" accept="image/*" className="hidden" onChange={handleProfileImageSelect} />
                  </div>
                  <p className="text-[11px] font-mono text-[#444]">JPG, PNG or GIF · max 5MB</p>
                </div>

                {/* Name + bio */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono text-[#555] uppercase tracking-widest mb-1.5 block">Display name</label>
                    <input
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#e0e0e0] text-sm font-mono focus:border-[#00ff88]/30 outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-mono text-[#555] uppercase tracking-widest block">Bio</label>
                      <button
                        type="button"
                        onClick={() => setAiBioOpen(true)}
                        className="inline-flex items-center gap-1 text-[#00ff88] text-xs font-mono px-2 py-1 rounded-lg transition-colors"
                        style={{
                          background: "transparent",
                          border: "0.5px solid rgba(0,255,136,0.2)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,255,136,0.06)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                      >
                        <Sparkles size={11} />
                        Write with AI
                      </button>
                    </div>
                    <textarea
                      value={profile.bio || ""}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell your story..."
                      rows={3}
                      maxLength={160}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#e0e0e0] text-sm font-mono focus:border-[#00ff88]/30 outline-none resize-none"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-mono text-[#444]">@{profile.username}</span>
                      <span className="text-[11px] font-mono text-[#333]">{(profile.bio || "").length}/160</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Header style ──────────────────────────────────── */}
              <div className={sectionCls}>
                <SL>Header</SL>
                <div className="grid grid-cols-2 gap-3">

                  {/* Classic */}
                  <button
                    onClick={() => setProfile({ ...profile, heroStyle: "classic" })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      (profile.heroStyle ?? "classic") === "classic"
                        ? "border-[#00ff88]/[0.3] bg-[#00ff88]/[0.02]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]"
                    }`}
                  >
                    <div className="h-[60px] bg-black/30 rounded-lg mb-2.5 flex flex-col items-center justify-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-white/[0.1] border border-white/[0.15]" />
                      <div className="w-12 h-1.5 bg-white/[0.07] rounded" />
                      <div className="w-8 h-1 bg-white/[0.04] rounded" />
                    </div>
                    <div className={`text-[12px] font-mono font-medium ${(profile.heroStyle ?? "classic") === "classic" ? "text-[#00ff88]" : "text-[#888]"}`}>
                      Classic
                    </div>
                    <div className="text-[10px] text-[#444] mt-0.5">Circular avatar</div>
                  </button>

                  {/* Cinematic */}
                  <button
                    onClick={() => setProfile({ ...profile, heroStyle: "cinematic" })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      profile.heroStyle === "cinematic"
                        ? "border-[#00ff88]/[0.3] bg-[#00ff88]/[0.02]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]"
                    }`}
                  >
                    <div className="h-[60px] bg-black/30 rounded-lg mb-2.5 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="w-12 h-1.5 bg-white/25 rounded mb-1" />
                        <div className="w-8 h-1 bg-white/10 rounded" />
                      </div>
                    </div>
                    <div className={`text-[12px] font-mono font-medium ${profile.heroStyle === "cinematic" ? "text-[#00ff88]" : "text-[#888]"}`}>
                      Cinematic
                    </div>
                    <div className="text-[10px] text-[#444] mt-0.5">Full photo blend</div>
                  </button>
                </div>

                {/* Hero image URL — only when cinematic is selected */}
                {profile.heroStyle === "cinematic" && (
                  <div className="mt-4">
                    <label className="text-[11px] font-mono text-[#555] uppercase tracking-widest mb-1.5 block">
                      Hero image or video URL
                    </label>
                    <input
                      value={profile.heroImage || ""}
                      onChange={(e) => setProfile({ ...profile, heroImage: e.target.value || null })}
                      placeholder="https://... (image or video URL)"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#e0e0e0] text-sm font-mono focus:border-[#00ff88]/30 outline-none"
                    />
                    <p className="text-[10px] text-[#444] font-mono mt-1.5 leading-relaxed">
                      Use a landscape image (16:9) for best results. Supports: jpg, png, gif, webp, mp4
                    </p>
                  </div>
                )}
              </div>

              {/* ── Section 3: Accent color ──────────────────────────────────── */}
              <div className={sectionCls}>
                <SL>Accent color</SL>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setProfile({ ...profile, accentColor: color })}
                      className={`w-9 h-9 rounded-full flex-shrink-0 transition-all hover:scale-110 ${
                        (profile.accentColor || "#00ff88") === color
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#080808]"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 hover:border-white/[0.14] transition-colors w-fit">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                  <input
                    type="text"
                    value={accent}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^#[0-9a-fA-F]{0,6}$/.test(val)) setProfile({ ...profile, accentColor: val })
                    }}
                    className="w-24 bg-transparent text-[#e0e0e0] text-sm font-mono outline-none"
                    placeholder="#00ff88"
                  />
                </div>
              </div>

              {/* ── Section 4: Background ────────────────────────────────────── */}
              <div className={sectionCls}>
                <SL>Background</SL>
                <div className="grid grid-cols-3 gap-3">
                  {BACKGROUNDS.map(({ value, label }) => {
                    const active = (profile.backgroundStyle ?? "none") === value
                    return (
                      <button
                        key={value}
                        onClick={() => setProfile({ ...profile, backgroundStyle: value })}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          active ? "border-[#00ff88]/[0.3]" : "border-white/[0.07] hover:border-white/[0.14]"
                        }`}
                      >
                        <div className="h-16 relative overflow-hidden bg-[#030303]">
                          {value === "mesh" && (
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-transparent to-emerald-900/30" />
                          )}
                          {value === "particles" && (
                            <div className="absolute inset-0" style={{
                              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
                              backgroundSize: "10px 10px",
                            }} />
                          )}
                          {active && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: accent }}>
                              <Check size={9} className="text-black" />
                            </div>
                          )}
                        </div>
                        <div className={`text-[11px] font-mono py-2 bg-white/[0.02] ${active ? "text-[#00ff88]" : "text-[#666]"}`}>
                          {label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Section 5: Buttons ───────────────────────────────────────── */}
              <div className={sectionCls}>
                <SL>Buttons</SL>

                {/* Style */}
                <div className="text-[11px] font-mono text-[#444] uppercase tracking-widest mb-2.5">Style</div>
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {BUTTON_STYLES.map(({ value, label }) => {
                    const active = (profile.buttonStyle ?? "glass") === value
                    return (
                      <button
                        key={value}
                        onClick={() => setProfile({ ...profile, buttonStyle: value })}
                        className={`rounded-xl border p-3 flex flex-col gap-2.5 transition-all ${
                          active
                            ? "border-[#00ff88]/[0.3] bg-[#00ff88]/[0.03]"
                            : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14]"
                        }`}
                      >
                        <ButtonStylePreview style={value} accent={accent} />
                        <span className={`text-[11px] font-mono text-left ${active ? "text-[#00ff88]" : "text-[#888]"}`}>{label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Corner radius */}
                <div className="text-[11px] font-mono text-[#444] uppercase tracking-widest mb-2.5">Corner radius</div>
                <div className="flex gap-2">
                  {RADIUS_OPTIONS.map(({ value, label, tw }) => {
                    const active = cornerRadius === value
                    return (
                      <button
                        key={value}
                        onClick={() => { setCornerRadius(value); setProfile({ ...profile, cornerRadius: value }) }}
                        className={`flex-1 rounded-lg border p-2.5 flex flex-col items-center gap-2 transition-all ${
                          active
                            ? "border-[#00ff88]/[0.3] bg-[#00ff88]/[0.03]"
                            : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14]"
                        }`}
                      >
                        <div className={`w-8 h-4 bg-white/[0.1] border border-white/[0.15] ${tw}`} />
                        <span className={`text-[10px] font-mono ${active ? "text-[#00ff88]" : "text-[#555]"}`}>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Section 6: Font ──────────────────────────────────────────── */}
              <div className={sectionCls}>
                <SL>Font</SL>
                <div className="relative">
                  <select
                    value={profile.fontFamily || "inter"}
                    onChange={(e) => setProfile({ ...profile, fontFamily: e.target.value })}
                    className="w-full appearance-none bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#e0e0e0] text-sm font-mono focus:border-[#00ff88]/30 outline-none pr-10 cursor-pointer"
                  >
                    {FONTS.map(({ value, label }) => (
                      <option key={value} value={value} className="bg-[#111]">{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
                </div>
              </div>

              {/* ── Section 7: Social icons ──────────────────────────────────── */}
              <div className="pb-8 mb-2">
                <SL>Social icons</SL>
                <div className="text-[11px] font-mono text-[#444] mb-3">Position</div>
                <div className="flex gap-2">
                  {["top", "bottom"].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setProfile({ ...profile, socialIconPosition: pos })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-mono capitalize transition-all ${
                        (profile.socialIconPosition ?? "bottom") === pos
                          ? "bg-[#00ff88]/[0.1] border border-[#00ff88]/[0.3] text-[#00ff88]"
                          : "bg-white/[0.03] border border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Save footer (always visible) ──────────────────────────────── */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.07] bg-[#080808]">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl py-3.5 text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><span className="animate-pulse">●</span> Saving...</>
              ) : lastSaved ? (
                <><Check size={14} /> Saved</>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>

        {/* ── RIGHT: phone preview ─────────────────────────────────────────── */}
        <div className="hidden lg:flex w-[320px] flex-shrink-0 bg-[#080808] flex-col">

          {/* Label row */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.04] flex-shrink-0">
            <span className="text-[11px] font-mono uppercase tracking-widest text-white/25">Preview</span>
            <button
              onClick={() => window.open(`/preview/${profile.username}`, "_blank")}
              className="text-[11px] font-mono text-[#00ff88] hover:underline"
            >
              Open →
            </button>
          </div>

          {/* Phone */}
          <div className="flex-1 flex items-center justify-center px-5 pb-5 overflow-hidden">
            <div className="relative">

              {/* Shell */}
              <div
                className="bg-[#0a0a0a] rounded-[38px] p-[10px] border border-white/[0.1]"
                style={{
                  width: 256,
                  height: 548,
                  boxShadow: `0 28px 64px rgba(0,0,0,0.85), 0 0 0 1px ${accent}18`,
                }}
              >
                {/* Overflow clips the 375px iframe scaled to fit the 236px inner screen */}
                <div className="w-full h-full rounded-[30px] overflow-hidden relative bg-[#030303]">
                  {/* Reload only after a confirmed save so preview reflects real DB state */}
                  <iframe
                    key={lastSaved?.getTime() ?? "initial"}
                    src={`/preview/${profile.username}`}
                    width={375}
                    height={812}
                    style={{
                      border: "none",
                      transform: "scale(0.629)",
                      transformOrigin: "top left",
                    }}
                    title="Profile preview"
                  />
                </div>
              </div>

              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-2xl z-20" />
            </div>
          </div>
        </div>

      </div>

      {/* ── Modals (unchanged) ──────────────────────────────────────────────── */}

      {cropImage && (
        <ImageCropper
          imageUrl={cropImage.url}
          onCropComplete={(blob) => handleCroppedImageUpload(blob)}
          onCancel={() => { URL.revokeObjectURL(cropImage.url); setCropImage(null) }}
          aspectRatio={1}
          circularCrop={true}
        />
      )}

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} username={profile.username} />

      <AiBioWriter
        open={aiBioOpen}
        onClose={() => setAiBioOpen(false)}
        currentBio={profile.bio || ""}
        name={profile.name || ""}
        username={profile.username}
        onSelect={(bio) => setProfile({ ...profile, bio })}
      />

      {publishedLink && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPublishedLink(null)} />
          <div className="relative bg-[#0a0a0a] rounded-2xl max-w-md w-full p-8 border border-white/[0.07]">
            <button onClick={() => setPublishedLink(null)} className="absolute top-4 right-4 text-[#444] hover:text-[#888] transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
              <Check size={28} className="text-[#00ff88]" />
            </div>
            <div className="text-center mb-5">
              <h2 className="text-lg font-mono font-semibold text-[#e0e0e0] mb-2">🎉 Your link is live!</h2>
              <p className="text-[#444] text-sm font-mono">Share this with your audience</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 mb-5 border border-white/[0.07] flex items-center gap-3">
              <div className="flex-1 font-mono text-sm text-[#00ff88] truncate">{publishedLink}</div>
              <button
                onClick={() => { navigator.clipboard.writeText(publishedLink!); toast.success("Link copied!") }}
                className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] hover:border-white/20 rounded-lg text-xs font-mono text-[#e0e0e0] transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => window.open(publishedLink!, "_blank")}
                className="w-full h-11 bg-[#00ff88] text-black font-mono font-semibold rounded-xl hover:opacity-90"
              >
                View your page →
              </Button>
              <Button
                onClick={() => setPublishedLink(null)}
                variant="ghost"
                className="w-full h-11 text-[#444] hover:text-[#888] font-mono"
              >
                Continue editing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
