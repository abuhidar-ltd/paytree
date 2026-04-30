import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { ProfileClient } from "./profile-client"
import { ShareButton } from "@/components/share-button"
import { ProfileLocked } from "./profile-locked"
import { PublishBanner } from "./publish-banner"
import { resolveUserPlan } from "@/lib/plans"

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const users = await prisma.user.findMany({
      select: { username: true },
      take: 100,
    })
    return users.map((user) => ({ username: user.username }))
  } catch (error) {
    console.error("Error generating static params:", error)
    return []
  }
}

async function trackView(userId: string, wasLive: boolean) {
  try {
    await prisma.view.create({
      data: {
        userId,
        userAgent: "server-side",
        wasLive,
      },
    })
  } catch (error) {
    console.error("Failed to track view:", error)
  }
}

/**
 * Determine if a link is currently visible based on scheduling.
 */
function isLinkVisible(link: { scheduledFrom: Date | null; scheduledTo: Date | null; enabled: boolean }): boolean {
  if (!link.enabled) return false
  const now = new Date()
  if (link.scheduledFrom && now < link.scheduledFrom) return false
  if (link.scheduledTo && now > link.scheduledTo) return false
  return true
}

export default async function ProfilePage({
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
      products: {
        where: { enabled: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const isOwner = currentUser?.id === user.id
  const isPublished = user.pageStatus === "published"
  const userPlan = resolveUserPlan(user)
  const isPaid = userPlan !== "free"

  if (!isOwner && (!isPublished || !isPaid)) {
    return <ProfileLocked username={user.username} />
  }

  // Track view for non-owners
  if (!isOwner && isPublished) {
    trackView(user.id, user.liveStatus).catch(console.error)
  }

  const socialIconPosition = user.socialIconPosition || "bottom"
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"}/${user.username}`
  const showPublishBanner = isOwner && !isPublished

  // Filter links by schedule (server-side)
  const visibleLinks = user.links.filter(isLinkVisible)

  // Transform links into portal structure (excluding vault items)
  const topLevelLinks = visibleLinks.filter((l) => !l.parentId && !l.isVaultItem)
  const portalLinks = topLevelLinks.map((link) => ({
    id: link.id,
    title: link.title,
    url: link.isFolder ? undefined : link.url,
    icon: link.icon || undefined,
    isFolder: link.isFolder,
    isStarred: link.isStarred,
    type: link.type,
    children: link.isFolder
      ? visibleLinks
          .filter((child) => child.parentId === link.id)
          .map((child) => ({
            id: child.id,
            title: child.title,
            url: child.url,
            icon: child.icon || undefined,
            isFolder: false,
            isStarred: child.isStarred,
            type: child.type,
            children: [],
          }))
      : [],
  }))

  // Transform vault items
  const vaultItems = visibleLinks
    .filter((l) => l.isVaultItem && l.isEmailLocked)
    .map((item) => ({
      id: item.id,
      title: item.title,
      icon: item.icon || undefined,
      url: item.url || undefined,
      downloadUrl: item.downloadUrl || undefined,
      downloadName: item.downloadName || undefined,
      vaultContent: item.vaultContent || undefined,
    }))

  // Transform crypto addresses
  const cryptoAddresses = user.cryptoAddresses.map((addr) => ({
    id: addr.id,
    currency: addr.currency,
    address: addr.address,
    label: addr.label || undefined,
    enabled: addr.enabled,
  }))

  // Transform products for shop cards
  const shopProducts = user.products.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || undefined,
    price: p.price,
    currency: p.currency,
    imageUrl: p.imageUrl || undefined,
    downloadUrl: p.downloadUrl || undefined,
  }))

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden">
      <PremiumBackground variant="nebula" />

      {showPublishBanner && <PublishBanner username={user.username} />}

      {isPublished && (
        <ShareButton
          url={profileUrl}
          title={`${user.name || user.username}'s PayTree`}
          text={user.bio || undefined}
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 min-h-screen flex items-start justify-center px-4 sm:px-6 py-8 sm:py-12 ${
          showPublishBanner ? "pt-24 sm:pt-28" : "pt-8"
        }`}
      >
        <div className="w-full max-w-[500px] mx-auto">
          {/* Profile Client Component - Handles all interactive features */}
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
            products={shopProducts}
            modules={user.modules.map((m) => ({
              id: m.id,
              type: m.type as any,
              title: m.title || undefined,
              enabled: m.enabled,
              order: m.order,
              span: m.span as 1 | 2 | 4,
              config: m.config as Record<string, unknown>,
            }))}
            socialIconPosition={socialIconPosition}
            isPublished={isPublished}
            isLive={user.liveStatus}
          />
        </div>
      </div>
    </div>
  )
}
