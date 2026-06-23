/**
 * Seeds a self-contained "opustest" user for end-to-end visual verification:
 * - Published Ultra plan (so the public profile renders fully)
 * - heroStyle = cinematic, with both image (profile) and heroImage set (so we
 *   can see whether the renderer honors heroImage at all)
 * - One representative block of every type the test plan touches, including
 *   a featured link with a GIF thumbnail (the critical animation check)
 *
 * Safe to re-run: blocks are wiped + re-seeded for this user only.
 */
import "dotenv/config"
import { prisma } from "../lib/prisma"

const TEST_USERNAME = "opustest"
const TEST_EMAIL = "opus-test@paytree.io"
const ACCENT = "#00ff88"

const HERO_IMAGE = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80&fm=jpg"
const PROFILE_IMAGE = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80"
const GIF_THUMB = "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif"
const FEATURED_THUMB = "https://picsum.photos/seed/trading/800/400"

async function main() {
  const yearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  // Upsert the user
  const user = await prisma.user.upsert({
    where: { username: TEST_USERNAME },
    create: {
      email: TEST_EMAIL,
      username: TEST_USERNAME,
      name: "Karim Al-Rashid",
      bio: "Crypto trader & educator. 7 years in the markets.",
      onboarded: true,
      pageStatus: "published",
      publishedAt: new Date(),
      subscriptionStatus: "active",
      subscriptionPlan: "ultra",
      subscriptionEndsAt: yearFromNow,
      accentColor: ACCENT,
      heroStyle: "cinematic",
      image: PROFILE_IMAGE,
      heroImage: HERO_IMAGE,
      buttonStyle: "glass",
      fontFamily: "inter",
      cornerRadius: "xl",
      backgroundStyle: "none",
      socialIconPosition: "top",
      aiAgentEnabled: false,
      statsStudents: 4200,
      statsWinRate: 87,
      statsFollowers: 0,
      statsLabel1: "STUDENTS",
      statsLabel2: "WIN RATE",
    },
    update: {
      pageStatus: "published",
      publishedAt: new Date(),
      subscriptionStatus: "active",
      subscriptionPlan: "ultra",
      subscriptionEndsAt: yearFromNow,
      accentColor: ACCENT,
      heroStyle: "cinematic",
      image: PROFILE_IMAGE,
      heroImage: HERO_IMAGE,
      bio: "Crypto trader & educator. 7 years in the markets.",
      name: "Karim Al-Rashid",
      buttonStyle: "glass",
      cornerRadius: "xl",
      socialIconPosition: "top",
      statsStudents: 4200,
      statsWinRate: 87,
      statsLabel1: "STUDENTS",
      statsLabel2: "WIN RATE",
    },
    select: { id: true, username: true },
  })

  // Wipe old blocks for this user only
  await prisma.block.deleteMany({ where: { userId: user.id } })

  const fiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)

  const blocks: Array<{
    type: string
    title: string
    position: number
    size?: string
    layout?: string
    url?: string | null
    thumbnail?: string | null
    description?: string | null
    lockType?: string
    lockValue?: string | null
    config?: Record<string, unknown>
  }> = [
    // 1. Classic link
    {
      type: "link",
      title: "Watch My Free Masterclass",
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      position: 0,
    },
    // 2. Featured link with thumbnail
    {
      type: "link",
      title: "Download Free Trading Bible",
      url: "https://google.com",
      layout: "featured",
      thumbnail: FEATURED_THUMB,
      position: 1,
    },
    // 3. GIF featured link — the critical animation check
    {
      type: "link",
      title: "Check this out",
      url: "https://google.com",
      layout: "featured",
      thumbnail: GIF_THUMB,
      position: 2,
    },
    // 4. Vault
    {
      type: "vault",
      title: "My Exact Portfolio",
      description: null,
      lockType: "email",
      position: 3,
      config: {
        content: "40% BTC, 30% ETH, 20% SOL, 10% cash",
        delivery: "text",
      },
    },
    // 5. Drop
    {
      type: "drop",
      title: "Pro Signals Course Launch",
      position: 4,
      config: {
        dropAt: fiveDays.toISOString(),
        limitedSpots: 100,
        revealMode: "url",
        revealUrl: "https://google.com",
      },
    },
    // 6. YouTube — specific video
    {
      type: "youtube",
      title: "Latest Trading Setup",
      position: 5,
      config: {
        mode: "video",
        videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      },
    },
    // 7. YouTube — channel
    {
      type: "youtube",
      title: "Latest from MKBHD",
      position: 6,
      config: {
        mode: "channel",
        channelId: "@mkbhd",
      },
    },
    // 8. Product
    {
      type: "product",
      title: "Pro Signals Monthly",
      description: "Daily signals, entry/exit points",
      thumbnail: "https://picsum.photos/seed/signals/800/400",
      position: 7,
      config: { price: 4900 }, // cents
    },
    // 9-10. Stats half-width
    {
      type: "stats",
      title: "Win rate",
      size: "half",
      position: 8,
      config: { value: "87%", label: "WIN RATE" },
    },
    {
      type: "stats",
      title: "Students",
      size: "half",
      position: 9,
      config: { value: "4.2K", label: "STUDENTS" },
    },
    // 11. Social link
    {
      type: "social_link",
      title: "Instagram",
      url: "https://instagram.com/test",
      position: 10,
      config: { platform: "instagram" },
    },
    // 12. FAQ multi-item
    {
      type: "faq",
      title: "FAQ",
      position: 11,
      config: {
        items: [
          { question: "What do I get?", answer: "Daily trading signals with entry and exit points" },
          { question: "Is it suitable for beginners?", answer: "Yes, I explain every trade in detail" },
        ],
      },
    },
    // 13. Discount code
    {
      type: "discount_code",
      title: "Save on Pro Signals",
      position: 12,
      config: { code: "TRADING20", description: "20% off Pro Signals" },
    },
    // 14. Text heading
    {
      type: "text",
      title: "Join 4,200+ Students",
      position: 13,
      config: { style: "heading" },
    },
  ]

  for (const b of blocks) {
    await prisma.block.create({
      data: {
        userId: user.id,
        type: b.type,
        title: b.title,
        url: b.url ?? null,
        description: b.description ?? null,
        thumbnail: b.thumbnail ?? null,
        size: b.size ?? "full",
        layout: b.layout ?? "classic",
        style: "glass",
        priority: "none",
        lockType: b.lockType ?? "none",
        lockValue: b.lockValue ?? null,
        config: (b.config ?? {}) as object,
        position: b.position,
        enabled: true,
      },
    })
  }

  // 15. Collection with 3 children
  const collection = await prisma.block.create({
    data: {
      userId: user.id,
      type: "collection",
      title: "My Resources",
      style: "glass",
      size: "full",
      priority: "none",
      lockType: "none",
      config: {},
      position: 14,
      enabled: true,
    },
  })
  const children = [
    { title: "Trading Guide PDF", url: "https://google.com" },
    { title: "Join Discord", url: "https://discord.com" },
    { title: "Weekly Newsletter", url: "https://google.com" },
  ]
  for (let i = 0; i < children.length; i++) {
    await prisma.block.create({
      data: {
        userId: user.id,
        parentId: collection.id,
        type: "link",
        title: children[i].title,
        url: children[i].url,
        style: "glass",
        size: "full",
        priority: "none",
        lockType: "none",
        config: {},
        position: i,
        enabled: true,
      },
    })
  }

  const total = await prisma.block.count({ where: { userId: user.id } })
  console.log(`✓ Seeded ${user.username} with ${total} blocks. Visit http://localhost:3000/${user.username}`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
