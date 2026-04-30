import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { ProfileClient } from "@/app/[username]/profile-client"
import { SocialIcon } from "@/components/social-icon"
import Link from "next/link"

// Prevent search engines from indexing preview pages
export const metadata = {
  robots: 'noindex, nofollow',
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const currentUser = await getCurrentUser()
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      links: {
        where: { enabled: true },
        orderBy: { order: "asc" },
      },
      socialLinks: {
        where: { enabled: true },
        orderBy: { order: "asc" },
      },
      cryptoAddresses: {
        where: { enabled: true },
        orderBy: { order: "asc" },
      },
      modules: {
        where: { enabled: true },
        orderBy: { order: "asc" },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const socialIconPosition = user.socialIconPosition || "bottom"
  const isPro = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'canceling'
  const isOwner = currentUser?.id === user.id

  // Transform links into portal structure (excluding vault items)
  const topLevelLinks = user.links.filter(l => !l.parentId && !l.isVaultItem)
  const portalLinks = topLevelLinks.map(link => ({
    id: link.id,
    title: link.title,
    url: link.isFolder ? undefined : link.url,
    icon: link.icon || undefined,
    isFolder: link.isFolder,
    children: link.isFolder 
      ? user.links.filter(child => child.parentId === link.id).map(child => ({
          id: child.id,
          title: child.title,
          url: child.url,
          icon: child.icon || undefined,
          isFolder: false,
          children: []
        }))
      : []
  }))

  // Transform vault items
  const vaultItems = user.links.filter(l => l.isVaultItem && l.isEmailLocked).map(item => ({
    id: item.id,
    title: item.title,
    icon: item.icon || undefined,
    url: item.url || undefined,
    downloadUrl: item.downloadUrl || undefined,
    downloadName: item.downloadName || undefined,
    vaultContent: item.vaultContent || undefined,
  }))

  // Transform crypto addresses
  const cryptoAddresses = user.cryptoAddresses.map(addr => ({
    id: addr.id,
    currency: addr.currency,
    address: addr.address,
    label: addr.label || undefined,
    enabled: addr.enabled,
  }))

  return (
    <div className="min-h-screen bg-[#030303] text-white relative">
      <PremiumBackground />

      {/* Preview Banner - show to page owner */}
      {isOwner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[rgba(0,255,136,0.1)] backdrop-blur-xl border-b border-[rgba(0,255,136,0.2)] text-white py-3 px-4">
          <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-bold text-[#00ff88]">Preview Mode</span>
              <span className="text-[#888888] hidden sm:inline">This is exactly how your terminal will look</span>
            </div>
            <div className="flex items-center gap-2">
              {isPro ? (
                <Link
                  href={`/${username}`}
                  className="btn-accent-solid px-4 py-1.5 text-sm"
                >
                  View Published →
                </Link>
              ) : (
                <Link
                  href="/dashboard/studio"
                  className="btn-accent-solid px-4 py-1.5 text-sm"
                >
                  Publish Terminal
                </Link>
              )}
              <Link
                href="/dashboard/studio"
                className="btn-obsidian px-4 py-1.5 text-sm"
              >
                ← Editor
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Info for non-owners viewing the preview */}
      {!isOwner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[rgba(3,3,3,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)] text-white py-2 px-4">
          <div className="container mx-auto flex items-center justify-center gap-3 text-sm">
            <svg className="w-4 h-4 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-[#888888]">This is a preview of @{username}'s terminal</span>
            <Link href="/" className="text-[#00ff88] hover:underline font-medium">
              Create yours →
            </Link>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-start justify-center px-4 sm:px-6 py-8 sm:py-12 pt-24 sm:pt-28">
        <div className="w-full max-w-[500px] mx-auto">
          <ProfileClient
            user={{
              id: user.id,
              name: user.name,
              username: user.username,
              bio: user.bio,
              image: user.image,
              liveStatus: user.liveStatus,
              liveMessage: user.liveMessage,
              statsStudents: user.statsStudents,
              statsWinRate: Number(user.statsWinRate),
              statsFollowers: user.statsFollowers,
              statsLabel1: user.statsLabel1,
              statsLabel2: user.statsLabel2,
              statsLabel3: user.statsLabel3,
              accentColor: user.accentColor,
            }}
            links={portalLinks}
            socialLinks={user.socialLinks}
            cryptoAddresses={cryptoAddresses}
            vaultItems={vaultItems}
            modules={user.modules.map(m => ({
              id: m.id,
              type: m.type as any,
              title: m.title || undefined,
              enabled: m.enabled,
              order: m.order,
              span: m.span as 1 | 2 | 4,
              config: m.config as Record<string, unknown>,
            }))}
            socialIconPosition={socialIconPosition}
            isPublished={false}
          />
        </div>
      </div>
    </div>
  )
}
