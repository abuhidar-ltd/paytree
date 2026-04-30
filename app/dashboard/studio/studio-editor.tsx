"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LinkCard3D } from "@/components/ui/link-card-3d"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { SocialIcon } from "@/components/social-icon"
import { ImageCropper } from "@/components/ui/image-cropper"
import { PaywallModal } from "@/components/ui/paywall-modal"
import { toast } from "sonner"
import { User, Clapperboard } from "lucide-react"
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

export function StudioEditor({ initialProfile, initialLinks, initialSocialLinks, checkoutSuccess }: StudioEditorProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [links, setLinks] = useState<LinkType[]>(initialLinks)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialSocialLinks)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    const fetchFreshData = async () => {
      try {
        const [linksRes, socialRes] = await Promise.all([
          fetch('/api/links'),
          fetch('/api/social-links')
        ])
        if (linksRes.ok) {
          const data = await linksRes.json()
          setLinks(data.links || data || [])
        }
        if (socialRes.ok) {
          const data = await socialRes.json()
          setSocialLinks(data.socialLinks || data || [])
        }
      } catch (e) {
        console.error('Failed to fetch fresh preview data', e)
      }
    }
    fetchFreshData()
  }, [])

  // Image cropping state
  const [cropImage, setCropImage] = useState<{ url: string } | null>(null)
  
  // Paywall modal state
  const [showPaywall, setShowPaywall] = useState(false)
  
  // Published link modal state
  const [publishedLink, setPublishedLink] = useState<string | null>(null)
  
  // Processing payment state
  const [processingPayment, setProcessingPayment] = useState(checkoutSuccess || false)

  // Users who are canceling still have Pro access until billing period ends
  const isPro = profile.subscriptionStatus === 'active' || profile.subscriptionStatus === 'trial' || profile.subscriptionStatus === 'canceling'
  const isPublished = profile.pageStatus === 'published'

  // Handle checkout success - poll for subscription update
  useEffect(() => {
    if (!checkoutSuccess) return
    
    let pollCount = 0
    const maxPolls = 20 // Poll for up to 20 seconds
    
    const pollSubscription = async () => {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        
        if (data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trial' || data.subscriptionStatus === 'canceling') {
          // Subscription confirmed! Check if page is published
          if (data.pageStatus === 'published') {
            // Page was published by webhook
            setProfile(data)
            setProcessingPayment(false)
            toast.success("🎉 Your page is now live!")
            const baseUrl = window.location.origin
            setPublishedLink(`${baseUrl}/${data.username}`)
            router.replace('/dashboard/studio')
          } else {
            // Subscription active but page not published - publish it now
            const publishRes = await fetch('/api/publish', { method: 'POST' })
            if (publishRes.ok) {
              setProfile({ ...data, pageStatus: 'published' })
              setProcessingPayment(false)
              toast.success("🎉 Your page is now live!")
              const baseUrl = window.location.origin
              setPublishedLink(`${baseUrl}/${data.username}`)
              router.replace('/dashboard/studio')
            }
          }
          return true // Stop polling
        }
        
        return false // Continue polling
      } catch (error) {
        console.error("Poll error:", error)
        return false
      }
    }
    
    // Initial check
    pollSubscription().then(done => {
      if (!done) {
        // Start polling
        const interval = setInterval(async () => {
          pollCount++
          const done = await pollSubscription()
          if (done || pollCount >= maxPolls) {
            clearInterval(interval)
            if (pollCount >= maxPolls) {
              setProcessingPayment(false)
              toast.error("Payment processing taking longer than expected. Please refresh the page.")
            }
          }
        }, 1000)
        
        return () => clearInterval(interval)
      }
    })
  }, [checkoutSuccess, router])

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(profile) !== JSON.stringify(initialProfile)) {
        saveProfile()
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [profile])

  const saveProfile = async () => {
    setSaving(true)
    try {
      // Filter out ALL non-editable fields before sending
      const { 
        id, email, username, subscriptionStatus, pageStatus, 
        publishedAt, clerkId, ...editableFields 
      } = profile as any
      
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableFields),
      })
      
      if (res.ok) {
        setLastSaved(new Date())
        toast.success("Changes saved!")
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to save")
      }
    } catch (error) {
      console.error("Save failed:", error)
      toast.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    // Create URL for cropping
    const imageUrl = URL.createObjectURL(file)
    setCropImage({ url: imageUrl })
    
    // Reset input
    e.target.value = ''
  }

  const handleCroppedImageUpload = async (blob: Blob) => {
    const formData = new FormData()
    formData.append("file", blob, "profile-image.jpg")

    const toastId = toast.loading("Uploading profile image...")
    
    try {
      const res = await fetch('/api/upload/profile-image', {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setProfile({...profile, image: data.url})
        toast.success("Profile image uploaded!", { id: toastId })
        setCropImage(null)
        // Force save immediately
        await saveProfile()
      } else {
        toast.error(data.error || "Upload failed", { id: toastId })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Upload failed", { id: toastId })
    }
  }

  const buttonStyles = [
    { name: "3D", value: "3d" },
    { name: "Gradient", value: "gradient" },
    { name: "Glass", value: "glass" },
    { name: "Glow", value: "glow" },
    { name: "Neon", value: "neon" },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#080808]/80 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-mono text-[#e0e0e0]">Customize Design</h1>
            {saving && <span className="text-[#00ff88]/50 text-xs font-mono animate-pulse">● Saving...</span>}
            {lastSaved && !saving && (
              <span className="text-[#00ff88]/50 text-xs font-mono">✓ Saved {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* View Live Button - opens preview in new tab */}
            <Button
              onClick={() => window.open(`/preview/${profile.username}`, '_blank')}
              variant="ghost"
              size="sm"
              className="bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] font-mono rounded-xl hover:border-white/20 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Live
            </Button>
            
            {/* Copy Preview Link Button */}
            <Button
              onClick={() => {
                const previewUrl = `${window.location.origin}/preview/${profile.username}`
                navigator.clipboard.writeText(previewUrl)
                toast.success("Preview link copied! Share it to show others your page.")
              }}
              variant="ghost"
              size="sm"
              className="bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] font-mono rounded-xl hover:border-white/20 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Link
            </Button>
            {/* Publish/Status Button */}
            {processingPayment ? (
              <Button 
                size="sm" 
                disabled
                className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl"
              >
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </Button>
            ) : isPublished ? (
              <Button
                onClick={() => {
                  const baseUrl = window.location.origin
                  setPublishedLink(`${baseUrl}/${profile.username}`)
                }}
                size="sm"
                className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                ✓ Published
              </Button>
            ) : !isPro ? (
              <Button 
                size="sm" 
                className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl hover:opacity-90 transition-opacity"
                onClick={() => setShowPaywall(true)}
              >
                🚀 Publish
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  // First save any pending changes
                  await saveProfile()
                  
                  // Then publish via API (backend enforcement)
                  const toastId = toast.loading("Publishing your page...")
                  try {
                    const res = await fetch('/api/publish', { method: 'POST' })
                    const data = await res.json()
                    
                    if (res.ok) {
                      toast.success("Your page is live!", { id: toastId })
                      setProfile({ ...profile, pageStatus: 'published' })
                      const baseUrl = window.location.origin
                      setPublishedLink(`${baseUrl}/${profile.username}`)
                    } else {
                      // Handle upgrade required (shouldn't happen for Pro users)
                      if (data.code === 'UPGRADE_REQUIRED') {
                        setShowPaywall(true)
                      }
                      toast.error(data.message || "Failed to publish", { id: toastId })
                    }
                  } catch (error) {
                    console.error("Publish error:", error)
                    toast.error("Failed to publish", { id: toastId })
                  }
                }}
                size="sm"
                className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                🚀 Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="grid grid-cols-[400px_1fr_400px] gap-6" style={{ height: 'calc(100vh - 120px)' }}>
          
          {/* Left Panel - Profile & Themes */}
          <div className="space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
            
            {/* Profile Section */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-3">Profile</h2>
              
              {/* Profile Image */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 flex-shrink-0 border-2 border-white/20 group-hover:border-[#00ff88]/40 transition-all">
                    {profile.image ? (
                      <img src={profile.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-[#00ff88]/20">
                        {profile.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    id="profile-img"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageSelect}
                  />
                  <Button
                    onClick={() => document.getElementById('profile-img')?.click()}
                    size="sm"
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] font-mono rounded-xl hover:border-white/20 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Change Photo
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[#444] text-xs font-mono uppercase tracking-wider mb-1.5 block">Display Name</label>
                  <Input
                    value={profile.name || ""}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#e0e0e0] text-sm font-mono focus:border-[#00ff88]/30 outline-none w-full"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-[#444] text-xs font-mono uppercase tracking-wider mb-1.5 block">Bio</label>
                  <Textarea
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#e0e0e0] text-sm font-mono focus:border-[#00ff88]/30 outline-none w-full resize-none"
                    rows={3}
                    placeholder="Tell your story..."
                    maxLength={200}
                  />
                  <div className="text-[#444] text-xs font-mono mt-1 text-right">
                    {(profile.bio || '').length}/200
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Center - Phone Preview */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-[380px] h-[780px] bg-[#0a0a0a] rounded-[32px] p-4 border border-white/[0.08]">
                <div className="w-full h-full rounded-[24px] overflow-hidden relative bg-[#080808]">
                  
                  {/* Background */}
                  <PremiumBackground />
                  
                  {/* Content */}
                  <div className="relative z-10 h-full overflow-y-auto scrollbar-hide p-8 text-white">
                    
                    {/* Profile */}
                    {(profile.heroStyle ?? 'classic') === 'cinematic' ? (
                      <div className="relative mb-6 -mx-8 -mt-8">
                        <div
                          className="w-full h-32"
                          style={{ background: 'linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 60%, #080808 100%)' }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 px-4">
                          <h2 className="text-lg font-bold text-white text-center drop-shadow">{profile.name || profile.username}</h2>
                          {profile.bio && <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5 text-center">{profile.bio}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center mb-8">
                        <div className="w-24 h-24 rounded-full bg-white/10 mx-auto mb-4 overflow-hidden border-4 border-white/20">
                          {profile.image ? (
                            <img src={profile.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {profile.name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{profile.name || profile.username}</h2>
                        {profile.bio && (
                          <p className="text-sm text-gray-300 opacity-80 line-clamp-3">{profile.bio}</p>
                        )}

                        {/* Social Icons Top */}
                        {profile.socialIconPosition === "top" && (
                          <div className="flex justify-center gap-2 mt-4">
                            {socialLinks.filter(s => s.enabled).length > 0
                              ? socialLinks.filter(s => s.enabled).slice(0, 5).map((social) => (
                                  <SocialIcon
                                    key={social.id}
                                    platform={social.platform}
                                    url={social.url}
                                    size={36}
                                  />
                                ))
                              : ['🔗', '▶', '🎵'].map((icon) => (
                                  <div key={icon} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm opacity-40">
                                    {icon}
                                  </div>
                                ))
                            }
                          </div>
                        )}
                      </div>
                    )}

                    {/* Links */}
                    <div className="space-y-3">
                      {links.filter(l => l.enabled).slice(0, 4).map((link) => (
                        <LinkCard3D
                          key={link.id}
                          title={link.title}
                          icon={link.icon}
                          variant={(profile.buttonStyle as any) || "3d"}
                          className="text-sm"
                        />
                      ))}
                      {links.filter(l => l.enabled).length === 0 && (
                        <div className="flex flex-col gap-2 w-full px-2">
                          {['My first link', 'Another link', 'Click here'].map((title) => (
                            <LinkCard3D
                              key={title}
                              title={title}
                              icon="🔗"
                              variant={(profile.buttonStyle as any) || '3d'}
                              className="text-sm opacity-40"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                      {/* Social Icons Bottom */}
                      {profile.socialIconPosition === "bottom" && (
                        <div className="flex justify-center gap-2 mt-8">
                          {socialLinks.filter(s => s.enabled).length > 0
                            ? socialLinks.filter(s => s.enabled).slice(0, 5).map((social) => (
                                <SocialIcon
                                  key={social.id}
                                  platform={social.platform}
                                  url={social.url}
                                  size={36}
                                />
                              ))
                            : ['🔗', '▶', '🎵'].map((icon) => (
                                <div key={icon} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm opacity-40">
                                  {icon}
                                </div>
                              ))
                          }
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-3xl z-20" />
            </div>
          </div>

          {/* Right Panel - Button Styles & Effects */}
          <div className="space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
            
            {/* Hero Style */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-3">Hero Style</h2>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'classic', label: 'Classic', sub: 'Circular avatar with card', Icon: User },
                  { value: 'cinematic', label: 'Cinematic', sub: 'Full photo, name overlay', Icon: Clapperboard },
                ] as const).map(({ value, label, sub, Icon }) => {
                  const active = (profile.heroStyle ?? 'classic') === value
                  return (
                    <button
                      key={value}
                      onClick={() => setProfile({ ...profile, heroStyle: value })}
                      className={`p-3 rounded-xl text-left font-mono transition-all ${
                        active
                          ? 'bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]'
                          : 'bg-white/[0.03] border border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-2 ${active ? 'text-[#00ff88]' : 'text-[#444]'}`} />
                      <div className="text-sm leading-tight">{label}</div>
                      <div className={`text-[10px] leading-tight mt-0.5 ${active ? 'text-[#00ff88]/60' : 'text-[#333]'}`}>{sub}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Button Styles */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-3">Button Style</h2>
              <div className="grid grid-cols-2 gap-2">
                {buttonStyles.map(style => (
                  <button
                    key={style.value}
                    onClick={() => setProfile({...profile, buttonStyle: style.value})}
                    className={`p-3 rounded-xl text-sm font-mono transition-all ${
                      profile.buttonStyle === style.value
                        ? 'bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]'
                        : 'bg-white/[0.03] border border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Social Position */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-3">Social Icons</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setProfile({...profile, socialIconPosition: "top"})}
                  className={`p-3 rounded-xl text-sm font-mono transition-all ${
                    profile.socialIconPosition === "top"
                      ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]"
                      : "bg-white/[0.03] border border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"
                  }`}
                >
                  Top
                </button>
                <button
                  onClick={() => setProfile({...profile, socialIconPosition: "bottom"})}
                  className={`p-3 rounded-xl text-sm font-mono transition-all ${
                    profile.socialIconPosition === "bottom"
                      ? "bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]"
                      : "bg-white/[0.03] border border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"
                  }`}
                >
                  Bottom
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-3">Stats</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#444] text-xs font-mono">Plan</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                    isPro
                      ? "bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88]"
                      : "bg-white/5 border border-white/10 text-[#888]"
                  }`}>
                    {isPro ? "PRO" : "FREE"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#444] text-xs font-mono">Links</span>
                  <span className="text-[#e0e0e0] text-sm font-mono">{links.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#444] text-xs font-mono">Social</span>
                  <span className="text-[#e0e0e0] text-sm font-mono">{socialLinks.length}</span>
                </div>
              </div>
            </div>

            {/* Manual Save Button */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="w-full bg-[#00ff88] text-black font-mono font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

          </div>

        </div>
      </div>

      {/* Image Cropper Modal */}
      {cropImage && (
        <ImageCropper
          imageUrl={cropImage.url}
          onCropComplete={(blob) => handleCroppedImageUpload(blob)}
          onCancel={() => {
            URL.revokeObjectURL(cropImage.url)
            setCropImage(null)
          }}
          aspectRatio={1}
          circularCrop={true}
        />
      )}

      {/* Paywall Modal */}
      <PaywallModal 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        username={profile.username}
      />

      {/* Published Link Modal */}
      {publishedLink && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setPublishedLink(null)}
          />
          
          <div className="relative bg-[#0a0a0a] rounded-2xl max-w-md w-full p-8 border border-white/[0.07] animate-scale-in">
            {/* Close button */}
            <button
              onClick={() => setPublishedLink(null)}
              className="absolute top-4 right-4 text-[#444] hover:text-[#888] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-mono font-semibold text-[#e0e0e0] mb-3">
                🎉 Your Link is Live!
              </h2>
              <p className="text-[#444] text-sm font-mono">
                Share this link with your audience to start receiving payments
              </p>
            </div>

            {/* Link Display */}
            <div className="bg-white/[0.03] rounded-xl p-4 mb-6 border border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="flex-1 font-mono text-sm text-[#00ff88] truncate">
                  {publishedLink}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publishedLink)
                    toast.success("Link copied!")
                  }}
                  className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] hover:border-white/20 rounded-xl text-sm font-mono text-[#e0e0e0] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => window.open(publishedLink, '_blank')}
                className="w-full h-12 bg-[#00ff88] text-black font-mono font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                View Your Page →
              </Button>
              <Button
                onClick={() => setPublishedLink(null)}
                variant="ghost"
                className="w-full h-12 text-[#444] hover:text-[#888] font-mono transition-colors"
              >
                Continue Editing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
