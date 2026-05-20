import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { ProfileClient } from "./profile-client"
import { ShareButton } from "@/components/share-button"
import { ProfileLocked } from "./profile-locked"
import { PublishBanner } from "./publish-banner"
import { resolveUserPlan, getUserFeatures } from "@/lib/plans"

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

const PRIVATE_IP = /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::ffff:127\.)/

async function lookupGeo(ip: string): Promise<{ country?: string; city?: string; lat?: number; lng?: number }> {
  if (!ip || PRIVATE_IP.test(ip)) return {}
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,lat,lon`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return {}
    const data = await res.json()
    return {
      country: data.country || undefined,
      city: data.city || undefined,
      lat: typeof data.lat === "number" ? data.lat : undefined,
      lng: typeof data.lon === "number" ? data.lon : undefined,
    }
  } catch {
    return {}
  }
}

async function trackView(userId: string, wasLive: boolean, ip: string | null) {
  try {
    const geo = ip ? await lookupGeo(ip) : {}
    await prisma.view.create({
      data: {
        userId,
        userAgent: "server-side",
        wasLive,
        ...geo,
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
  const userFeatures = getUserFeatures(user)
  const showAiAgent = !isOwner && userFeatures.hasAiFeatures && user.aiAgentEnabled

  if (!isOwner && (!isPublished || !isPaid)) {
    return <ProfileLocked username={user.username} />
  }

  // Track view for non-owners (with geo lookup)
  if (!isOwner && isPublished) {
    const reqHeaders = await headers()
    const forwarded = reqHeaders.get("x-forwarded-for")
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : (reqHeaders.get("x-real-ip") ?? null)
    trackView(user.id, user.liveStatus, ip).catch(console.error)
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
    cardStyle: link.style || undefined,
    cardSize: link.cardSize || undefined,
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
            cardStyle: child.style || undefined,
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

  // Fetch top-level enabled blocks with their children
  const blocks = await prisma.block.findMany({
    where: { userId: user.id, enabled: true, parentId: null },
    orderBy: { position: "asc" },
    include: {
      children: { orderBy: { position: "asc" } },
    },
  })

  // Fetch enabled drops
  const dropsRaw = await prisma.drop.findMany({
    where: { userId: user.id, enabled: true },
    orderBy: { dropAt: "asc" },
  })
  const drops = dropsRaw.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description || undefined,
    dropAt: d.dropAt.toISOString(),
    revealUrl: d.revealUrl || undefined,
    revealText: d.revealText || undefined,
    status: d.status,
    limitedSpots: d.limitedSpots ?? undefined,
    spotsLeft: d.spotsLeft ?? undefined,
  }))

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden">
      <PremiumBackground variant="nebula" />

      {user.image && user.heroStyle === 'cinematic' && (
        <div
          className="absolute top-0 left-0 right-0 h-[480px] z-[1] overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <img
            src={user.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 35%', userSelect: 'none', pointerEvents: 'none' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: [
                'linear-gradient(to bottom, rgba(3,3,3,0) 0%, rgba(3,3,3,0) 25%, rgba(3,3,3,0.75) 65%, rgba(3,3,3,1) 80%)',
                'linear-gradient(to right, rgba(3,3,3,0.55) 0%, transparent 18%, transparent 82%, rgba(3,3,3,0.55) 100%)',
              ].join(', '),
            }}
          />
        </div>
      )}

      {showPublishBanner && <PublishBanner username={user.username} canPublish={userFeatures.canPublish} />}

      {isPublished && (
        <ShareButton
          url={profileUrl}
          title={`${user.name || user.username}'s PayTree`}
          text={user.bio || undefined}
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 min-h-screen flex items-start justify-center px-4 sm:px-6 pb-8 sm:pb-12 ${
          user.heroStyle === 'cinematic'
            ? showPublishBanner
              ? "pt-[220px] sm:pt-[240px]"
              : "pt-[180px] sm:pt-[200px]"
            : showPublishBanner
              ? "pt-24 sm:pt-28"
              : "pt-8 sm:pt-12"
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
              heroStyle: user.heroStyle,
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
            buttonStyle={user.buttonStyle ?? undefined}
            drops={drops}
            blocks={blocks.map((b) => ({
              id: b.id,
              type: b.type,
              title: b.title,
              url: b.url,
              description: b.description,
              thumbnail: b.thumbnail,
              style: b.style,
              size: b.size,
              layout: b.layout,
              config: b.config as Record<string, unknown>,
              children: b.children.map((c) => ({
                id: c.id,
                type: c.type,
                title: c.title,
                url: c.url,
                thumbnail: c.thumbnail,
                config: c.config as Record<string, unknown>,
              })),
            }))}
            showAiAgent={showAiAgent}
            accentColor={user.accentColor ?? undefined}
            creatorStripeReady={!!(user.stripeAccountId && user.stripeAccountStatus === "active")}
          />
        </div>
      </div>
    </div>
  )
}
