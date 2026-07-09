import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProfileClient } from "@/app/[username]/profile-client"
import { paymentsUnderMaintenance } from "@/lib/payments-live"

export const metadata = {
  robots: 'noindex, nofollow',
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  // Profile-only — all content lives in the Block table.
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    notFound()
  }

  const socialIconPosition = user.socialIconPosition || "bottom"

  const now = new Date()
  const blocks = await prisma.block.findMany({
    where: {
      userId: user.id,
      enabled: true,
      parentId: null,
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
      {/* React 19 hoists this <base> to <head> — keeps clicks from breaking out of the studio iframe */}
      <base target="_blank" />

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
            isPublished={false}
            buttonStyle={user.buttonStyle ?? undefined}
            accentColor={user.accentColor ?? undefined}
            creatorStripeReady={!!(user.stripeAccountId && user.stripeAccountStatus === "active")}
            paymentsMaintenance={paymentsUnderMaintenance()}
            removeBranding={true}
            isPreview={true}
          />
        </div>
      </div>
    </div>
  )
}
