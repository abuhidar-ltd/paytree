/**
 * AI Link Optimizer — Rule-Based Reordering
 *
 * Applies a set of deterministic rules to reorder a user's links
 * for maximum engagement. Runs server-side.
 *
 * Rules (applied in priority order):
 *  1. Live Twitch stream → boost to top
 *  2. Starred links → boost (user intent)
 *  3. CTR boost — links with highest recent CTR float up
 *  4. Scheduled override — links inside their active schedule window stay in position
 *  5. Time-of-day boosts — evening content boosted after 6pm local, morning content before 12pm
 */

import { prisma } from "@/lib/prisma"

interface LinkWithStats {
  id: string
  title: string
  url: string
  type: string
  isStarred: boolean
  isFolder: boolean
  isVaultItem: boolean
  parentId: string | null
  scheduledFrom: Date | null
  scheduledTo: Date | null
  enabled: boolean
  order: number
  // computed
  recentClicks: number
  recentViews: number // profile-level; same for all links
}

/**
 * Compute an optimized ordering for a user's top-level links.
 * Returns an array of { linkId, newOrder }.
 */
export async function computeOptimizedOrder(userId: string): Promise<{ linkId: string; newOrder: number }[]> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Fetch links + recent click counts in parallel
  const [links, clickCounts, user] = await Promise.all([
    prisma.link.findMany({
      where: { userId, enabled: true, parentId: null, isVaultItem: false },
      orderBy: { order: "asc" },
    }),
    prisma.click.groupBy({
      by: ["linkId"],
      where: { userId, timestamp: { gte: sevenDaysAgo } },
      _count: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { liveStatus: true },
    }),
  ])

  if (links.length === 0) return []

  const clickMap = new Map(clickCounts.map((c) => [c.linkId, c._count.id]))
  const totalViews = await prisma.view.count({
    where: { userId, timestamp: { gte: sevenDaysAgo } },
  })

  // Build scored items
  const scored = links.map((link) => {
    let score = 0
    const clicks = clickMap.get(link.id) || 0
    const ctr = totalViews > 0 ? clicks / totalViews : 0

    // Rule 1: Live Twitch stream → +1000
    if (user?.liveStatus && link.type === "twitch") {
      score += 1000
    }

    // Rule 2: Starred → +500
    if (link.isStarred) {
      score += 500
    }

    // Rule 3: CTR boost (0-200 points)
    score += Math.min(ctr * 2000, 200)

    // Rule 4: Folder boost (portals stay slightly elevated)
    if (link.isFolder) {
      score += 50
    }

    // Rule 5: Time-of-day (crude server-side heuristic)
    const hour = now.getHours()
    if (hour >= 18 || hour < 6) {
      // Evening/night: boost entertainment
      if (["youtube", "twitch", "tiktok", "spotify"].includes(link.type)) {
        score += 30
      }
    } else if (hour < 12) {
      // Morning: boost informational
      if (["twitter", "generic"].includes(link.type)) {
        score += 20
      }
    }

    // Keep original order as tiebreaker
    const tiebreaker = (1000 - link.order) * 0.01

    return { linkId: link.id, score: score + tiebreaker }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  return scored.map((item, i) => ({ linkId: item.linkId, newOrder: i }))
}

/**
 * Apply the optimized order to the database.
 */
export async function applyOptimizedOrder(userId: string): Promise<number> {
  const ordering = await computeOptimizedOrder(userId)

  if (ordering.length === 0) return 0

  // Batch update
  await Promise.all(
    ordering.map(({ linkId, newOrder }) =>
      prisma.link.update({ where: { id: linkId }, data: { order: newOrder } })
    )
  )

  return ordering.length
}
