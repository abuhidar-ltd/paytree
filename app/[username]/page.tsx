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
import { detectDevice, normalizeReferrer } from "@/lib/tracking"

// Public profile must render dynamically so notFound() returns a real 404 status
// and view tracking (headers, IP, geo) runs on every request instead of being
// frozen into a static cache.
export const dynamic = "force-dynamic"

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

async function trackView(
  userId: string,
  wasLive: boolean,
  ip: string | null,
  userAgent: string | null,
  referer: string | null,
) {
  try {
    const geo = ip ? await lookupGeo(ip) : {}
    await prisma.view.create({
      data: {
        userId,
        userAgent: userAgent || undefined,
        device: detectDevice(userAgent),
        referrer: normalizeReferrer(referer),
        wasLive,
        ...geo,
      },
    })
  } catch (error) {
    console.error("Failed to track view:", error)
  }
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
  const isPaid = userPlan !== "free"
  const userFeatures = getUserFeatures(user)
  const showAiAgent = !isOwner && userFeatures.hasAiFeatures && user.aiAgentEnabled

  if (!isOwner && (!isPublished || !isPaid)) {
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
    trackView(user.id, user.liveStatus, ip, userAgent, referer).catch(console.error)
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
    },
  })

  const bgVariant =
    user.backgroundStyle === "particles" ? "particles"
    : user.backgroundStyle === "none" ? "minimal"
    : "nebula"

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">
      <PremiumBackground variant={bgVariant} />

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
          />
        </div>
      </div>
    </div>
  )
}
