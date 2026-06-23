import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().nullable().optional(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/).optional(),
  bio: z.string().max(200).nullable().optional(),
  image: z.string().nullable().optional().or(z.literal("")), // Allow data URLs and null
  theme: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
  buttonStyle: z.string().nullable().optional(),
  fontFamily: z.string().nullable().optional(),
  backgroundStyle: z.string().nullable().optional(),
  backgroundImageUrl: z.string().nullable().optional().or(z.literal("")), // Allow data URLs and null
  accentColor: z.string().nullable().optional(),
  textColor: z.string().nullable().optional(),
  socialIconPosition: z.string().nullable().optional(),
  heroStyle: z.string().nullable().optional(),
  heroImage: z.string().nullable().optional().or(z.literal("")),
  cornerRadius: z.string().nullable().optional(),
  onboarded: z.boolean().optional(),
  aiAgentEnabled: z.boolean().optional(),
}).strict() // Reject any extra fields to prevent pageStatus injection

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
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
        subscriptionStatus: true,
        pageStatus: true, // Include for polling after checkout
        // Obsidian Terminal fields
        liveStatus: true,
        liveMessage: true,
        statsStudents: true,
        statsWinRate: true,
        statsFollowers: true,
        statsLabel1: true,
        statsLabel2: true,
        statsLabel3: true,
        aiAgentEnabled: true,
        aiChatSessions: true,
        aiChatMessages: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
      }
    })
    
    // Convert Decimal to number for JSON serialization
    const serializedUser = user ? {
      ...user,
      statsWinRate: user.statsWinRate ? Number(user.statsWinRate) : 0,
    } : null

    return NextResponse.json(serializedUser)
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // SECURITY: Explicitly reject attempts to modify protected fields
    if ('pageStatus' in body || 'subscriptionStatus' in body || 'publishedAt' in body || 'clerkId' in body) {
      return NextResponse.json(
        { error: "Cannot modify protected fields" },
        { status: 403 }
      )
    }
    
    const {
      name, username, bio, image, theme, primaryColor, backgroundColor, buttonStyle, fontFamily,
      backgroundStyle, backgroundImageUrl, accentColor, textColor, socialIconPosition, heroStyle,
      heroImage, cornerRadius,
      onboarded, aiAgentEnabled,
    } = profileSchema.parse(body)

    // Check username uniqueness if being changed
    if (username && username !== currentUser.username) {
      const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } })
      if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 })
      }
    }

    // Generate referral code on first onboarding completion
    const isFirstOnboarding = onboarded === true && !currentUser.onboarded
    let referralCode: string | undefined
    if (isFirstOnboarding) {
      const effectiveUsername = username ?? currentUser.username
      referralCode = `${effectiveUsername}-${Math.random().toString(36).substring(2, 8)}`
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        ...(username !== undefined && { username }),
        bio,
        image: image || null,
        theme,
        primaryColor,
        backgroundColor,
        buttonStyle,
        fontFamily,
        backgroundStyle,
        backgroundImageUrl: backgroundImageUrl || null,
        accentColor,
        textColor,
        socialIconPosition,
        heroStyle,
        heroImage: heroImage || null,
        cornerRadius,
        ...(onboarded !== undefined && { onboarded }),
        ...(aiAgentEnabled !== undefined && { aiAgentEnabled }),
        ...(referralCode !== undefined && { referralCode }),
      },
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
      }
    })

    revalidatePath(`/${user.username}`)

    // Send welcome email on first onboarding completion (fire-and-forget)
    if (onboarded === true && !currentUser.onboarded) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"
      const profileUrl = `${appUrl}/${user.username}`

      resend.emails.send({
        from: "Paytree <noreply@paytree.to>",
        to: user.email,
        subject: "Your Paytree page is live",
        html: `
          <div style="background:#080808;padding:40px 32px;max-width:520px;margin:0 auto;font-family:monospace;">
            <div style="color:#00ff88;font-size:22px;font-weight:bold;margin-bottom:6px;">Your page is ready.</div>
            <div style="color:#888;font-size:13px;margin-bottom:32px;">Share it with your audience.</div>

            <a href="${profileUrl}" style="display:inline-block;background:#00ff88;color:#080808;font-family:monospace;font-weight:bold;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:999px;margin-bottom:40px;">${profileUrl.replace("https://", "")}</a>

            <div style="color:#e0e0e0;font-size:13px;margin-bottom:16px;">Here's what to do next:</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #1a1a1a;">
                <td style="padding:12px 0;font-size:16px;width:32px;">🔒</td>
                <td style="padding:12px 0;color:#e0e0e0;font-size:13px;">Add a vault to capture emails</td>
              </tr>
              <tr style="border-bottom:1px solid #1a1a1a;">
                <td style="padding:12px 0;font-size:16px;">⚡</td>
                <td style="padding:12px 0;color:#e0e0e0;font-size:13px;">Create a drop for your next launch</td>
              </tr>
              <tr>
                <td style="padding:12px 0;font-size:16px;">📺</td>
                <td style="padding:12px 0;color:#e0e0e0;font-size:13px;">Connect YouTube to show your latest video</td>
              </tr>
            </table>

            <a href="${appUrl}/dashboard" style="display:inline-block;padding:14px 28px;background:#00ff88;color:#080808;font-family:monospace;font-weight:bold;font-size:14px;text-decoration:none;border-radius:6px;margin-top:32px;">Go to dashboard →</a>

            <hr style="border:none;border-top:1px solid #1a1a1a;margin:40px 0;" />
            <div style="color:#444;font-size:11px;">Paytree · paytree.to</div>
          </div>
        `,
      }).catch(() => {})
    }

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
