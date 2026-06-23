import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StudioEditor } from "./studio-editor"

interface StudioPageProps {
  searchParams: Promise<{
    checkout?: string
    session_id?: string
  }>
}

// Auth-gated, reads headers via getCurrentUser. Force-dynamic so the build
// doesn't try (and fail) to pre-render it.
export const dynamic = "force-dynamic"

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const user = await getCurrentUser()
  const params = await searchParams
  
  if (!user) {
    redirect("/login")
  }

  const [profile, links, socialLinks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        theme: true,
        primaryColor: true,
        backgroundColor: true,
        buttonStyle: true,
        fontFamily: true,
        backgroundStyle: true,
        backgroundImageUrl: true,
        accentColor: true,
        textColor: true,
        socialIconPosition: true,
        heroStyle: true,
        heroImage: true,
        cornerRadius: true,
        subscriptionStatus: true,
        pageStatus: true,
      }
    }),
    prisma.link.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
      take: 10
    }),
    prisma.socialLink.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' }
    }),
  ])

  if (!profile) {
    redirect("/login")
  }

  const checkoutSuccess = params.checkout === "success"
  const checkoutSessionId = params.session_id || null

  return (
    <StudioEditor
      initialProfile={profile}
      initialLinks={links}
      initialSocialLinks={socialLinks}
      checkoutSuccess={checkoutSuccess}
      checkoutSessionId={checkoutSessionId}
    />
  )
}
