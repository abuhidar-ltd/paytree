import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { PremiumBackground } from "@/components/backgrounds/premium-background"
import { ProfileClient } from "@/app/[username]/profile-client"
import { resolveUserPlan, getUserFeatures } from "@/lib/plans"

export const metadata = {
  robots: 'noindex, nofollow',
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
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

  const topLevelLinks = user.links.filter(l => !l.parentId && !l.isVaultItem)
  const portalLinks = topLevelLinks.map(link => ({
    id: link.id,
    title: link.title,
    url: link.isFolder ? undefined : link.url,
    icon: link.icon || undefined,
    isFolder: link.isFolder,
    cardStyle: link.style || undefined,
    cardSize: link.cardSize || undefined,
    children: link.isFolder
      ? user.links.filter(child => child.parentId === link.id).map(child => ({
          id: child.id,
          title: child.title,
          url: child.url,
          icon: child.icon || undefined,
          isFolder: false,
          cardStyle: child.style || undefined,
          children: []
        }))
      : []
  }))

  const vaultItems = user.links.filter(l => l.isVaultItem && l.isEmailLocked).map(item => ({
    id: item.id,
    title: item.title,
    icon: item.icon || undefined,
    url: item.url || undefined,
    downloadUrl: item.downloadUrl || undefined,
    downloadName: item.downloadName || undefined,
    vaultContent: item.vaultContent || undefined,
  }))

  const cryptoAddresses = user.cryptoAddresses.map(addr => ({
    id: addr.id,
    currency: addr.currency,
    address: addr.address,
    label: addr.label || undefined,
    enabled: addr.enabled,
  }))

  const blocks = await prisma.block.findMany({
    where: { userId: user.id, enabled: true, parentId: null },
    orderBy: { position: "asc" },
    include: {
      children: {
        where: { enabled: true },
        orderBy: { position: "asc" },
      },
    },
  })

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
      <PremiumBackground />

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
                'linear-gradient(to bottom, rgba(180,120,60,0.25) 0%, rgba(180,120,60,0.1) 30%, transparent 50%)',
                'linear-gradient(to bottom, rgba(3,3,3,0) 0%, rgba(3,3,3,0) 25%, rgba(3,3,3,0.75) 65%, rgba(3,3,3,1) 80%)',
                'linear-gradient(to right, rgba(3,3,3,0.55) 0%, transparent 18%, transparent 82%, rgba(3,3,3,0.55) 100%)',
              ].join(', '),
            }}
          />
        </div>
      )}

      <div className={`relative z-10 min-h-screen flex items-start justify-center px-4 sm:px-6 pb-8 sm:pb-12 ${
        user.heroStyle === 'cinematic'
          ? "pt-[220px] sm:pt-[240px]"
          : "pt-24 sm:pt-28"
      }`}>
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
              heroImage: user.heroStyle === "cinematic" ? user.image : null,
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
            socialLinks={user.socialLinks}
            socialIconPosition={socialIconPosition}
            isPublished={false}
            buttonStyle={user.buttonStyle ?? undefined}
            accentColor={user.accentColor ?? undefined}
            creatorStripeReady={!!(user.stripeAccountId && user.stripeAccountStatus === "active")}
            removeBranding={true}
            isPreview={true}
          />
        </div>
      </div>
    </div>
  )
}
