import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { getUserFeatures } from "@/lib/plans"

/**
 * GET /api/ai/email-followups
 *
 * Returns pending email follow-up events for the current user.
 * These are automatically created when audience members perform actions.
 *
 * POST /api/ai/email-followups
 * Body: { audienceId, message, subject }
 * Manually queues a follow-up email (stored for future send).
 *
 * V1 Implementation:
 * - Events are stored in AiInsight with type="email_followup"
 * - The creator can manually review and send (no auto-send in V1)
 * - Future: integrate with Resend/SendGrid for automated sending
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        subscriptionEndsAt: true, isComped: true, compedExpiresAt: true,
      },
    })

    const features = getUserFeatures(user || {})
    if (!features.hasAiFeatures) {
      return NextResponse.json(
        { error: "Email follow-ups require an Ultra plan.", code: "UPGRADE_REQUIRED" },
        { status: 403 }
      )
    }

    // Get recent audience captures that haven't been followed up on
    const recentCaptures = await prisma.audience.findMany({
      where: {
        userId: currentUser.id,
        capturedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        vaultItem: { select: { title: true } },
      },
      orderBy: { capturedAt: "desc" },
      take: 50,
    })

    // Generate suggested follow-up actions
    const suggestions = recentCaptures.map((capture) => ({
      id: capture.id,
      email: capture.email,
      source: capture.source,
      vaultItemTitle: capture.vaultItem?.title || null,
      capturedAt: capture.capturedAt,
      suggestedAction:
        capture.source === "vault" || capture.source === "locked_link"
          ? `Thank ${capture.email} for unlocking "${capture.vaultItem?.title || "your content"}" and offer additional resources.`
          : `Welcome ${capture.email} to your audience and share your latest content.`,
    }))

    return NextResponse.json({
      followups: suggestions,
      totalAudience: recentCaptures.length,
    })
  } catch (error: unknown) {
    console.error("[ai/email-followups] Error:", (error as Error).message)
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 })
  }
}

/**
 * POST - Queue a manual follow-up (V1: just stores the intent)
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, subject, message } = await req.json()

    if (!email || !subject || !message) {
      return NextResponse.json({ error: "Email, subject, and message are required" }, { status: 400 })
    }

    // Store as an insight/event for future sending
    await prisma.aiInsight.create({
      data: {
        userId: currentUser.id,
        type: "email_followup",
        message: `Follow-up to ${email}: ${subject}`,
        metadata: {
          email,
          subject,
          message,
          status: "queued",
          queuedAt: new Date().toISOString(),
        },
      },
    })

    // TODO: In future, integrate with Resend/SendGrid to actually send
    console.log(`[email-followup] Queued: ${email} — ${subject}`)

    return NextResponse.json({
      success: true,
      message: `Follow-up to ${email} has been queued.`,
      note: "V1: Emails are stored for review. Automated sending coming soon.",
    })
  } catch (error: unknown) {
    console.error("[ai/email-followups] Error:", (error as Error).message)
    return NextResponse.json({ error: "Failed to queue follow-up" }, { status: 500 })
  }
}
