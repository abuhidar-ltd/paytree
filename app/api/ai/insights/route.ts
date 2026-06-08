import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { getUserFeatures } from "@/lib/plans"

/**
 * GET /api/ai/insights
 *
 * Returns AI-powered insights for Pro users.
 * These are template-based insights generated from the user's analytics data.
 *
 * POST /api/ai/insights  (body: { id, dismissed: true })
 * Dismisses an insight.
 */

// Insight templates
interface InsightTemplate {
  type: "performance" | "suggestion" | "warning"
  check: (data: AnalyticsData) => boolean
  message: (data: AnalyticsData) => string
}

interface AnalyticsData {
  totalViews: number
  totalClicks: number
  ctr: number
  topLinkTitle: string | null
  topLinkClicks: number
  audienceCount: number
  vaultUnlocks: number
  totalLinks: number
  liveViews: number
  starredCount: number
}

const TEMPLATES: InsightTemplate[] = [
  {
    type: "performance",
    check: (d) => d.ctr > 15,
    message: (d) =>
      `Your CTR is ${d.ctr.toFixed(1)}% — that's excellent! Your link placement is working well.`,
  },
  {
    type: "warning",
    check: (d) => d.ctr < 3 && d.totalViews > 20,
    message: () =>
      `Your click-through rate is below 3%. Consider reordering your links or making titles more compelling.`,
  },
  {
    type: "suggestion",
    check: (d) => d.topLinkTitle !== null && d.topLinkClicks > 5,
    message: (d) =>
      `"${d.topLinkTitle}" is your top performer with ${d.topLinkClicks} clicks. Consider starring it to keep it prominent.`,
  },
  {
    type: "suggestion",
    check: (d) => d.audienceCount === 0 && d.totalViews > 10,
    message: () =>
      `You have views but no email captures. Add a locked link or vault item to start building your audience.`,
  },
  {
    type: "performance",
    check: (d) => d.vaultUnlocks > 0 && d.audienceCount > 0,
    message: (d) =>
      `You've captured ${d.audienceCount} emails through locked content — keep it up!`,
  },
  {
    type: "suggestion",
    check: (d) => d.totalLinks > 10 && d.starredCount === 0,
    message: () =>
      `You have many links but none are starred. Star your best links to boost them in the AI optimizer.`,
  },
  {
    type: "suggestion",
    check: (d) => d.liveViews > 0,
    message: (d) =>
      `${d.liveViews} of your views came while you were live. Going live drives ${((d.liveViews / Math.max(d.totalViews, 1)) * 100).toFixed(0)}% of your traffic.`,
  },
  {
    type: "suggestion",
    check: (d) => d.totalViews === 0,
    message: () =>
      `No views yet! Share your Paytree link on social media to start getting traffic.`,
  },
]

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
        subscriptionEndsAt: true,
      },
    })

    const features = getUserFeatures(user || {})
    if (!features.hasAiFeatures) {
      return NextResponse.json(
        { error: "AI Insights require an Ultra plan.", code: "UPGRADE_REQUIRED" },
        { status: 403 }
      )
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Gather analytics data
    const [
      totalViews,
      totalClicks,
      audienceCount,
      vaultUnlocks,
      totalLinks,
      liveViews,
      starredCount,
      topLink,
      existingInsights,
    ] = await Promise.all([
      prisma.view.count({ where: { userId: currentUser.id, timestamp: { gte: sevenDaysAgo } } }),
      prisma.click.count({ where: { userId: currentUser.id, timestamp: { gte: sevenDaysAgo } } }),
      prisma.audience.count({ where: { userId: currentUser.id } }),
      prisma.audience.count({ where: { userId: currentUser.id, source: "vault" } }),
      prisma.link.count({ where: { userId: currentUser.id, isVaultItem: false } }),
      prisma.view.count({ where: { userId: currentUser.id, wasLive: true, timestamp: { gte: sevenDaysAgo } } }),
      prisma.link.count({ where: { userId: currentUser.id, isStarred: true } }),
      prisma.click.groupBy({
        by: ["linkId"],
        where: { userId: currentUser.id, timestamp: { gte: sevenDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }),
      prisma.aiInsight.findMany({
        where: { userId: currentUser.id, dismissed: false },
        orderBy: { createdAt: "desc" },
      }),
    ])

    // Get top link title
    let topLinkTitle: string | null = null
    let topLinkClicks = 0
    if (topLink.length > 0) {
      const link = await prisma.link.findUnique({
        where: { id: topLink[0].linkId },
        select: { title: true },
      })
      topLinkTitle = link?.title || null
      topLinkClicks = topLink[0]._count.id
    }

    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0

    const data: AnalyticsData = {
      totalViews,
      totalClicks,
      ctr,
      topLinkTitle,
      topLinkClicks,
      audienceCount,
      vaultUnlocks,
      totalLinks,
      liveViews,
      starredCount,
    }

    // Generate new insights from templates
    const newInsights: { type: string; message: string }[] = []
    for (const template of TEMPLATES) {
      if (template.check(data)) {
        const message = template.message(data)
        // Avoid duplicating existing insights with same message
        const isDuplicate = existingInsights.some((i) => i.message === message)
        if (!isDuplicate) {
          newInsights.push({ type: template.type, message })
        }
      }
    }

    // Save new insights to DB
    if (newInsights.length > 0) {
      await prisma.aiInsight.createMany({
        data: newInsights.map((i) => ({
          userId: currentUser.id,
          type: i.type,
          message: i.message,
          metadata: data as any,
        })),
      })
    }

    // Return all undismissed insights
    const allInsights = await prisma.aiInsight.findMany({
      where: { userId: currentUser.id, dismissed: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({
      insights: allInsights,
      analyticsSnapshot: data,
    })
  } catch (error: any) {
    console.error("[ai/insights] Error:", error.message)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}

/**
 * POST - dismiss an insight
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Insight ID required" }, { status: 400 })
    }

    await prisma.aiInsight.updateMany({
      where: { id, userId: currentUser.id },
      data: { dismissed: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[ai/insights] Dismiss error:", error.message)
    return NextResponse.json({ error: "Failed to dismiss" }, { status: 500 })
  }
}
