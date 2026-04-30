"use client"

import { useEffect, useState } from "react"
import { useUser, SignOutButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { toast } from "sonner"

interface SubscriptionInfo {
  status: string
  endsAt?: string
  cancelAtPeriodEnd?: boolean
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login")
    } else if (isLoaded && user) {
      loadProfile()
    }
  }, [isLoaded, user, router])

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        setProfile(await res.json())
      }
    } catch (error) {
      console.error("Failed to load profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll keep access until the end of your billing period.")) {
      return
    }

    setCanceling(true)
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(`Subscription canceled. Access until: ${new Date(data.accessUntil).toLocaleDateString()}`)
        await loadProfile()
      } else {
        toast.error(data.error || "Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Error canceling subscription:", error)
      toast.error("Failed to cancel subscription")
    } finally {
      setCanceling(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setCanceling(true)
    try {
      const res = await fetch("/api/subscription/reactivate", {
        method: "POST",
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Subscription reactivated successfully!")
        await loadProfile()
      } else {
        toast.error(data.error || "Failed to reactivate subscription")
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error)
      toast.error("Failed to reactivate subscription")
    } finally {
      setCanceling(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm')
      return
    }

    setDeleting(true)
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Account deleted successfully. Redirecting...")
        setTimeout(() => {
          window.location.href = "/"
        }, 2000)
      } else {
        toast.error(data.error || "Failed to delete account")
        setDeleting(false)
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Failed to delete account")
      setDeleting(false)
    }
  }

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">
        <PremiumBackground />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-white/10 border-t-[#00ff88] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#444] text-sm">Loading settings...</p>
        </div>
      </div>
    )
  }

  // Users who are canceling still have Pro access until billing period ends
  const isPro = profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trial' || profile?.subscriptionStatus === 'canceling'
  const isCanceling = profile?.subscriptionStatus === 'canceling'
  const isCanceled = profile?.subscriptionStatus === 'canceled'

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <PremiumBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.07] bg-[#080808]/80 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-[#00ff88] to-[rgba(0,255,136,0.5)]" />
            <span className="text-[#e0e0e0] hidden sm:inline">Paytree</span>
          </Link>
          
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/dashboard" 
              className="text-[#444] hover:text-[#e0e0e0] transition-colors text-sm min-h-[44px] flex items-center"
            >
              Dashboard
            </Link>
            <Link 
              href="/settings" 
              className="text-[#e0e0e0] font-semibold text-sm min-h-[44px] flex items-center"
            >
              Settings
            </Link>
            <SignOutButton redirectUrl="/">
              <Button variant="ghost" size="sm" className="text-[#444] hover:text-red-400 min-h-[44px]">
                Logout
              </Button>
            </SignOutButton>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <h1 className="text-2xl font-semibold text-[#f0f0f0] tracking-tight mb-6">Account Settings</h1>

        <div className="space-y-4">
          {/* Account Information */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 sm:p-6">
            <h2 className="text-sm font-mono uppercase tracking-widest text-white/30 mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-[#444] text-xs font-mono uppercase tracking-wider">Username:</span>
                <span className="text-[#e0e0e0] text-sm font-mono">{profile?.username}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-[#444] text-xs font-mono uppercase tracking-wider">Email:</span>
                <span className="text-[#e0e0e0] text-sm font-mono break-all">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-[#444] text-xs font-mono uppercase tracking-wider">Subscription:</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                  isPro
                    ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]'
                    : isCanceling
                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                    : isCanceled
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-white/5 border-white/10 text-[#888]'
                }`}>
                  {isPro ? '⭐ Pro' : isCanceling ? '⏳ Canceling' : isCanceled ? '❌ Canceled' : '🆓 Free'}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Management */}
          {isPro && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 sm:p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-white/30 mb-4">Subscription Management</h2>
              
              {isCanceling ? (
                <div className="space-y-4">
                  <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4">
                    <p className="text-yellow-500/70 text-sm font-mono mb-2">⚠️ Subscription Set to Cancel</p>
                    <p className="text-sm text-[#e0e0e0]">
                      Your subscription is set to cancel at the end of your billing period.
                      {profile?.subscriptionEndsAt && (
                        <>
                          {" "}You'll keep access until{" "}
                          <span className="font-semibold text-[#e0e0e0]">
                            {new Date(profile.subscriptionEndsAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleReactivateSubscription}
                    disabled={canceling}
                    className="w-full min-h-[48px] bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-5 py-3 text-sm hover:opacity-90 transition-opacity"
                  >
                    {canceling ? "Reactivating..." : "Reactivate Subscription"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[#e0e0e0] text-sm">
                    Cancel your subscription at any time. You'll keep access until the end of your current billing period.
                  </p>
                  
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={canceling}
                    variant="outline"
                    className="w-full min-h-[48px] bg-transparent border border-red-500/30 text-red-400 font-mono rounded-xl px-5 py-3 text-sm hover:border-red-500/60 transition-colors"
                  >
                    {canceling ? "Canceling..." : "Cancel Subscription"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Canceled Subscription - Show resubscribe option */}
          {isCanceled && (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 sm:p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-white/30 mb-4">Subscription Expired</h2>
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 font-mono text-sm mb-2">❌ Subscription Ended</p>
                  <p className="text-sm text-[#e0e0e0]">
                    Your Pro subscription has ended. Upgrade again to publish your page and access Pro features.
                  </p>
                </div>
                
                <Link href="/upgrade">
                  <Button className="w-full min-h-[48px] bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-5 py-3 text-sm hover:opacity-90 transition-opacity">
                    Resubscribe to Pro
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-5 sm:p-6">
            <h2 className="text-sm font-mono uppercase tracking-widest text-red-400/60 mb-4">⚠️ Danger Zone</h2>
            
            {!showDeleteConfirm ? (
              <div className="space-y-4">
                <p className="text-[#e0e0e0] text-sm">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="w-full min-h-[48px] bg-transparent border border-red-500/30 text-red-400 font-mono rounded-xl px-5 py-3 text-sm hover:border-red-500/60 transition-colors"
                >
                  Delete Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 font-mono text-sm mb-2">⚠️ WARNING: This Cannot Be Undone!</p>
                  <p className="text-sm text-[#e0e0e0] mb-4">
                    Deleting your account will:
                  </p>
                  <ul className="text-sm text-[#e0e0e0] list-disc list-inside space-y-1 mb-4">
                    <li>Cancel your subscription immediately</li>
                    <li>Delete all your links and content</li>
                    <li>Remove your public page</li>
                    <li>Delete all analytics data</li>
                    <li>Permanently remove your account</li>
                  </ul>
                  <p className="text-sm text-red-400 font-mono">
                    Type "DELETE" to confirm:
                  </p>
                </div>
                
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#e0e0e0] text-sm font-mono focus:border-[#00ff88]/30 outline-none w-full min-h-[48px] placeholder:text-[#444]"
                />
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText("")
                    }}
                    variant="outline"
                    className="flex-1 min-h-[48px]"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== "DELETE"}
                    className="flex-1 min-h-[48px] bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? "Deleting..." : "Delete Account Forever"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
