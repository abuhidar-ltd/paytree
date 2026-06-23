/**
 * PayTree Demo Seed Script
 *
 * Creates a demo user with links, folders, products, vault items,
 * modules, social links, and sample analytics data.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts
 *
 * Requires: DATABASE_URL in .env
 */

import "dotenv/config"
import { prisma } from "../lib/prisma"

async function seed() {
  console.log("🌱 Seeding PayTree demo data...\n")

  // ─── Demo User ────────────────────────────────────────
  const email = "demo@paytree.to"
  const username = "demo"

  let user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    console.log("  ♻️  Demo user already exists, updating...")
    user = await prisma.user.update({
      where: { email },
      data: {
        name: "Alex Rivera",
        username,
        bio: "Creator · Trader · Building in public. Sharing alpha and resources.",
        subscriptionStatus: "active",
        subscriptionPlan: "pro",
        subscriptionInterval: "monthly",
        pageStatus: "published",
        publishedAt: new Date(),
        theme: "dark",
        accentColor: "#00ff88",
        textColor: "#ffffff",
        backgroundStyle: "mesh",
        buttonStyle: "3d",
        socialIconPosition: "bottom",
        liveStatus: true,
        liveMessage: "LIVE — Trading Session",
        statsStudents: 4821,
        statsWinRate: 94.5,
        statsFollowers: 128500,
        statsLabel1: "Students",
        statsLabel2: "Win Rate",
        statsLabel3: "Followers",
      },
    })
  } else {
    user = await prisma.user.create({
      data: {
        email,
        username,
        name: "Alex Rivera",
        bio: "Creator · Trader · Building in public. Sharing alpha and resources.",
        subscriptionStatus: "active",
        subscriptionPlan: "pro",
        subscriptionInterval: "monthly",
        pageStatus: "published",
        publishedAt: new Date(),
        theme: "dark",
        accentColor: "#00ff88",
        textColor: "#ffffff",
        backgroundStyle: "mesh",
        buttonStyle: "3d",
        socialIconPosition: "bottom",
        liveStatus: true,
        liveMessage: "LIVE — Trading Session",
        statsStudents: 4821,
        statsWinRate: 94.5,
        statsFollowers: 128500,
        statsLabel1: "Students",
        statsLabel2: "Win Rate",
        statsLabel3: "Followers",
      },
    })
    console.log("  ✅ Demo user created!")
  }

  // Clean existing demo data
  await prisma.click.deleteMany({ where: { userId: user.id } })
  await prisma.view.deleteMany({ where: { userId: user.id } })
  await prisma.audience.deleteMany({ where: { userId: user.id } })
  await prisma.link.deleteMany({ where: { userId: user.id } })
  await prisma.module.deleteMany({ where: { userId: user.id } })
  await prisma.socialLink.deleteMany({ where: { userId: user.id } })
  await prisma.cryptoAddress.deleteMany({ where: { userId: user.id } })
  await prisma.product.deleteMany({ where: { userId: user.id } })
  console.log("  🧹 Cleaned existing demo data")

  // ─── Links ────────────────────────────────────────────
  const folder = await prisma.link.create({
    data: {
      userId: user.id,
      title: "Trading Resources",
      url: "",
      icon: "📚",
      isFolder: true,
      type: "generic",
      order: 0,
    },
  })

  const childLinks = [
    { title: "Beginner Trading Guide", url: "https://example.com/beginner-guide", type: "generic" as const },
    { title: "My TradingView Setup", url: "https://example.com/tradingview", type: "generic" as const },
    { title: "Risk Management 101", url: "https://example.com/risk", type: "generic" as const },
  ]

  for (let i = 0; i < childLinks.length; i++) {
    await prisma.link.create({
      data: {
        userId: user.id,
        title: childLinks[i].title,
        url: childLinks[i].url,
        type: childLinks[i].type,
        parentId: folder.id,
        order: i,
      },
    })
  }

  const topLinks = [
    { title: "Watch on YouTube", url: "https://youtube.com/@alexrivera", icon: "▶️", type: "youtube", isStarred: true },
    { title: "Follow on TikTok", url: "https://tiktok.com/@alexrivera", icon: "🎵", type: "tiktok" },
    { title: "Live on Twitch", url: "https://twitch.tv/alexrivera", icon: "🟣", type: "twitch", isStarred: true },
    { title: "Follow on X", url: "https://x.com/alexrivera", icon: "𝕏", type: "twitter" },
    { title: "Join Discord", url: "https://discord.gg/example", icon: "💬", type: "generic" },
    { title: "Listen on Spotify", url: "https://open.spotify.com/playlist/example", icon: "🎧", type: "spotify" },
  ]

  for (let i = 0; i < topLinks.length; i++) {
    await prisma.link.create({
      data: {
        userId: user.id,
        title: topLinks[i].title,
        url: topLinks[i].url,
        icon: topLinks[i].icon,
        type: topLinks[i].type,
        isStarred: topLinks[i].isStarred || false,
        order: i + 1, // after folder
      },
    })
  }

  // Vault / locked link
  await prisma.link.create({
    data: {
      userId: user.id,
      title: "Free Trading Cheat Sheet (PDF)",
      url: "https://example.com/cheat-sheet.pdf",
      icon: "🔒",
      isVaultItem: true,
      isEmailLocked: true,
      downloadUrl: "https://example.com/cheat-sheet.pdf",
      downloadName: "Trading-Cheat-Sheet.pdf",
      vaultContent: "Here's the secret: Always use stop losses and never risk more than 2% per trade.",
      type: "generic",
      order: 100,
    },
  })

  // Scheduled link (future)
  await prisma.link.create({
    data: {
      userId: user.id,
      title: "New Course Launch (Feb 15)",
      url: "https://example.com/new-course",
      icon: "🚀",
      type: "generic",
      scheduledFrom: new Date("2026-02-15T00:00:00Z"),
      order: 101,
    },
  })

  console.log("  ✅ Links + folders + vault + scheduled created")

  // ─── Products ─────────────────────────────────────────
  await prisma.product.create({
    data: {
      userId: user.id,
      title: "Advanced Trading Course",
      description: "12 hours of in-depth trading strategies, risk management, and live trade breakdowns.",
      price: 9900, // $99
      currency: "usd",
    },
  })

  await prisma.product.create({
    data: {
      userId: user.id,
      title: "Chart Templates Pack",
      description: "50+ TradingView chart templates for crypto and forex.",
      price: 2900, // $29
      currency: "usd",
    },
  })

  console.log("  ✅ Products created")

  // ─── Social Links ─────────────────────────────────────
  const socials = [
    { platform: "instagram", url: "https://instagram.com/alexrivera" },
    { platform: "twitter", url: "https://x.com/alexrivera" },
    { platform: "youtube", url: "https://youtube.com/@alexrivera" },
    { platform: "tiktok", url: "https://tiktok.com/@alexrivera" },
  ]

  for (let i = 0; i < socials.length; i++) {
    await prisma.socialLink.create({
      data: { userId: user.id, platform: socials[i].platform, url: socials[i].url, order: i },
    })
  }

  console.log("  ✅ Social links created")

  // ─── Crypto Addresses ─────────────────────────────────
  await prisma.cryptoAddress.create({
    data: {
      userId: user.id,
      currency: "BTC",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      label: "Tips",
    },
  })

  await prisma.cryptoAddress.create({
    data: {
      userId: user.id,
      currency: "ETH",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
      label: "Tips",
      order: 1,
    },
  })

  console.log("  ✅ Crypto addresses created")

  // ─── Modules ──────────────────────────────────────────
  await prisma.module.create({
    data: {
      userId: user.id,
      type: "youtube",
      title: "Latest Video",
      span: 2,
      config: { videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
      order: 0,
    },
  })

  await prisma.module.create({
    data: {
      userId: user.id,
      type: "twitch",
      title: "Live Stream",
      span: 2,
      config: { channelName: "alexrivera" },
      order: 1,
    },
  })

  console.log("  ✅ Modules created")

  // ─── Sample Analytics (30 days) ───────────────────────
  const now = new Date()
  for (let d = 30; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
    const viewCount = Math.floor(Math.random() * 50) + 10
    const clickCount = Math.floor(Math.random() * 20) + 3

    // Views
    for (let v = 0; v < viewCount; v++) {
      const ts = new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000)
      await prisma.view.create({
        data: {
          userId: user.id,
          timestamp: ts,
          wasLive: Math.random() > 0.7,
          isUnique: Math.random() > 0.3,
        },
      })
    }

    // Clicks (use existing links)
    const allLinks = await prisma.link.findMany({
      where: { userId: user.id, isVaultItem: false, isFolder: false },
      select: { id: true },
    })

    for (let c = 0; c < clickCount; c++) {
      const randomLink = allLinks[Math.floor(Math.random() * allLinks.length)]
      if (randomLink) {
        const ts = new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        await prisma.click.create({
          data: {
            linkId: randomLink.id,
            userId: user.id,
            timestamp: ts,
            isLiveClick: Math.random() > 0.7,
          },
        })
      }
    }
  }

  console.log("  ✅ 30 days of sample analytics created")

  // ─── Sample Audience ──────────────────────────────────
  const sampleEmails = [
    "john.trader@gmail.com",
    "sarah.crypto@outlook.com",
    "mike.daytrader@yahoo.com",
    "emma.invest@proton.me",
    "alex.beginner@gmail.com",
  ]

  for (const email of sampleEmails) {
    await prisma.audience.create({
      data: {
        userId: user.id,
        email,
        source: Math.random() > 0.5 ? "vault" : "locked_link",
        capturedAt: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      },
    })
  }

  console.log("  ✅ Sample audience created")

  // Done
  console.log("\n🎉 Demo seed complete!")
  console.log(`   Visit: /${username}`)
  console.log(`   Email: ${email}`)
}

seed()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
