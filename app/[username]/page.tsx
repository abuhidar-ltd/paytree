import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"
import { ProfileClient } from "./profile-client"
import { ShareButton } from "@/components/share-button"
import { ProfileLocked } from "./profile-locked"
import { PublishBanner } from "./publish-banner"
import { resolveUserPlan, getUserFeatures } from "@/lib/plans"
import { detectDevice, normalizeReferrer } from "@/lib/tracking"

// Public profile must render dynamically so notFound() returns a real 404 status
// and view tracking (headers, IP, geo) runs on every request instead of being
// frozen into a static cache.
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, username: true, bio: true, image: true },
  })
  if (!user) return { title: "Not found · Paytree" }
  const displayName = user.name || user.username
  const title = `${displayName} (@${user.username}) · Paytree`
  const description = user.bio || `Check out ${displayName}'s page on Paytree.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/${user.username}`,
      images: user.image ? [{ url: user.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: user.image ? [user.image] : undefined,
    },
  }
}

const PRIVATE_IP = /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::ffff:127\.)/

async function lookupGeo(ip: string): Promise<{ country?: string; city?: string; lat?: number; lng?: number }> {
  if (!ip || PRIVATE_IP.test(ip)) return {}
  try {
    // 1.2s timeout instead of 3s — ip-api.com rate-limits to 45 req/min/IP.
    // Under TikTok traffic spikes we hit that ceiling and slow responses
    // pile up. Better to drop geo than hang.
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,lat,lon`, {
      signal: AbortSignal.timeout(1200),
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

/**
 * Track a view entirely post-response via `after()` — the public profile
 * render never waits on Prisma or ip-api. Two phases inside:
 *   1. INSERT the view row.
 *   2. Best-effort geo enrichment that UPDATEs the row with country/city.
 *
 * Either phase can fail silently; analytics is not allowed to slow profiles.
 */
function scheduleViewTracking(
  userId: string,
  wasLive: boolean,
  ip: string | null,
  userAgent: string | null,
  referer: string | null,
) {
  after(async () => {
    try {
      const view = await prisma.view.create({
        data: {
          userId,
          userAgent: userAgent || undefined,
          device: detectDevice(userAgent),
          referrer: normalizeReferrer(referer),
          wasLive,
        },
        select: { id: true },
      })

      if (!ip || PRIVATE_IP.test(ip)) return

      const geo = await lookupGeo(ip)
      if (geo.country || geo.city || geo.lat || geo.lng) {
        try {
          await prisma.view.update({ where: { id: view.id }, data: geo })
        } catch {
          // View may have been deleted by retention job; that's fine.
        }
      }
    } catch (error) {
      console.error("Failed to track view:", error)
    }
  })
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const currentUser = await getCurrentUser()
  const { username } = await params

  // Profile data only — no relations. All content lives in the Block table.
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    notFound()
  }

  const isOwner = currentUser?.id === user.id
  const isPublished = user.pageStatus === "published"
  const userPlan = resolveUserPlan(user)
  const userFeatures = getUserFeatures(user)
  const showAiAgent = !isOwner && userFeatures.hasAiFeatures && user.aiAgentEnabled

  // Publishing is free — every plan can go live. Features are gated, not visibility.
  if (!isOwner && !isPublished) {
    return <ProfileLocked username={user.username} />
  }

  // Track view for non-owners (with geo lookup, device, and referrer)
  if (!isOwner && isPublished) {
    const reqHeaders = await headers()
    const forwarded = reqHeaders.get("x-forwarded-for")
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : (reqHeaders.get("x-real-ip") ?? null)
    const userAgent = reqHeaders.get("user-agent")
    const referer = reqHeaders.get("referer")
    scheduleViewTracking(user.id, user.liveStatus, ip, userAgent, referer)
  }

  const socialIconPosition = user.socialIconPosition || "bottom"
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"}/${user.username}`
  const showPublishBanner = isOwner && !isPublished

  // ─── Single Block query — the only source of truth ──────────────
  // - Enabled + top-level only (children come via include)
  // - Schedule window enforced in SQL: scheduleStart null OR <= now AND scheduleEnd null OR >= now
  // - Order: starred first (priority desc, "starred" > "none" string-wise), then position asc
  const now = new Date()
  const blocks = await prisma.block.findMany({
    where: {
      userId: user.id,
      enabled: true,
      parentId: null,
      // Modular reveal: hide blocks that are owned as another block's revealBlock
      revealedBy: { none: {} },
      AND: [
        { OR: [{ scheduleStart: null }, { scheduleStart: { lte: now } }] },
        { OR: [{ scheduleEnd: null }, { scheduleEnd: { gte: now } }] },
      ],
    },
    orderBy: [{ priority: "desc" }, { position: "asc" }],
    include: {
      children: {
        where: { enabled: true },
        orderBy: { position: "asc" },
      },
      revealBlock: true,
    },
  })

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">

      {user.heroStyle === 'cinematic' && (user.heroImage || user.image) && (
        <div
          className="absolute top-0 left-0 right-0 h-[480px] z-[1] overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <img
            src={user.heroImage || user.image || ""}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 35%', userSelect: 'none', pointerEvents: 'none' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: [
                'linear-gradient(to bottom, rgba(3,3,3,0) 0%, rgba(3,3,3,0) 30%, rgba(3,3,3,0.6) 70%, rgba(3,3,3,1) 85%)',
                'linear-gradient(to right, rgba(3,3,3,0.4) 0%, transparent 20%, transparent 80%, rgba(3,3,3,0.4) 100%)',
              ].join(', '),
            }}
          />
        </div>
      )}

      {showPublishBanner && <PublishBanner username={user.username} canPublish={userFeatures.canPublish} />}

      {isPublished && (
        <ShareButton
          url={profileUrl}
          title={`${user.name || user.username}'s Paytree`}
          text={user.bio || undefined}
        />
      )}

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
              heroImage: user.heroStyle === "cinematic" ? (user.heroImage || user.image) : null,
              fontFamily: user.fontFamily,
              cornerRadius: user.cornerRadius,
            }}
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
              priority: b.priority,
              lockType: b.lockType,
              lockValue: b.lockValue,
              config: b.config as Record<string, unknown>,
              children: b.children.map((c) => ({
                id: c.id,
                type: c.type,
                title: c.title,
                url: c.url,
                description: c.description,
                thumbnail: c.thumbnail,
                style: c.style,
                size: c.size,
                layout: c.layout,
                lockType: c.lockType,
                lockValue: c.lockValue,
                config: c.config as Record<string, unknown>,
              })),
              revealBlock: b.revealBlock
                ? {
                    id: b.revealBlock.id,
                    type: b.revealBlock.type,
                    title: b.revealBlock.title,
                    url: b.revealBlock.url,
                    description: b.revealBlock.description,
                    thumbnail: b.revealBlock.thumbnail,
                    style: b.revealBlock.style,
                    size: b.revealBlock.size,
                    layout: b.revealBlock.layout,
                    lockType: b.revealBlock.lockType,
                    lockValue: b.revealBlock.lockValue,
                    config: b.revealBlock.config as Record<string, unknown>,
                  }
                : null,
            }))}
            socialIconPosition={socialIconPosition}
            isPublished={isPublished}
            isLive={user.liveStatus}
            buttonStyle={user.buttonStyle ?? undefined}
            showAiAgent={showAiAgent}
            accentColor={user.accentColor ?? undefined}
            creatorStripeReady={!!(user.stripeAccountId && user.stripeAccountStatus === "active")}
            removeBranding={userFeatures.removeBranding}
            isOwner={isOwner}
            creatorPlan={userPlan}
          />
        </div>
      </div>
    </div>
  )
}
