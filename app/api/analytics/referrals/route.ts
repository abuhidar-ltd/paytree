import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"

// Common referrer patterns
const REFERRER_PATTERNS: Record<string, { name: string; color: string }> = {
  "tiktok.com": { name: "TikTok", color: "#00f2ea" },
  "instagram.com": { name: "Instagram", color: "#E4405F" },
  "twitter.com": { name: "Twitter", color: "#1DA1F2" },
  "x.com": { name: "Twitter/X", color: "#1DA1F2" },
  "youtube.com": { name: "YouTube", color: "#FF0000" },
  "facebook.com": { name: "Facebook", color: "#1877F2" },
  "linkedin.com": { name: "LinkedIn", color: "#0A66C2" },
  "reddit.com": { name: "Reddit", color: "#FF4500" },
  "discord.com": { name: "Discord", color: "#5865F2" },
  "t.co": { name: "Twitter/X", color: "#1DA1F2" },
  "google.com": { name: "Google", color: "#4285F4" },
  "bing.com": { name: "Bing", color: "#008373" },
}

function parseReferrer(referrer: string | null): string {
  if (!referrer) return "Direct"
  
  try {
    const url = new URL(referrer)
    const hostname = url.hostname.replace("www.", "")
    
    // Check known patterns
    for (const [pattern, info] of Object.entries(REFERRER_PATTERNS)) {
      if (hostname.includes(pattern)) {
        return info.name
      }
    }
    
    // Return cleaned hostname
    return hostname
  } catch {
    return "Other"
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const period = url.searchParams.get("period") || "30"
    const days = Math.min(parseInt(period), 90)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get all views with referrers
    const views = await prisma.view.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: startDate }
      },
      select: {
        referrer: true,
      }
    })
    
    // Aggregate referrers
    const referrerCounts: Record<string, number> = {}
    
    views.forEach(view => {
      const source = parseReferrer(view.referrer)
      referrerCounts[source] = (referrerCounts[source] || 0) + 1
    })
    
    // Calculate percentages and format
    const total = views.length
    const referrals = Object.entries(referrerCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: Object.entries(REFERRER_PATTERNS).find(([, v]) => v.name === name)?.[1]?.color || "#888888"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 sources
    
    return NextResponse.json({
      referrals,
      total
    })
  } catch (error) {
    console.error("Analytics referrals error:", error)
    return NextResponse.json(
      { error: "Failed to get referral analytics" },
      { status: 500 }
    )
  }
}

