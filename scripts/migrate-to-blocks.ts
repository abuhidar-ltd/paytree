/**
 * Migrate existing Link / Module / Product / Drop / SocialLink / CryptoAddress
 * records into the unified Block model.
 *
 * Idempotency: we tag each created Block.config with `migratedFrom` and
 * `legacyId`. Re-running the script skips records whose legacy IDs already
 * exist as a Block for that user.
 *
 * Usage:
 *   npm run migrate:blocks
 */

import "dotenv/config"
import { prisma } from "../lib/prisma"

type BlockSeed = {
  userId: string
  title: string
  type: string
  enabled?: boolean
  position: number
  url?: string | null
  thumbnail?: string | null
  description?: string | null
  style?: string
  size?: string
  config: Record<string, unknown>
  parentLegacyId?: string | null
  legacyId: string
  migratedFrom: string
}

function parseConfig(raw: unknown): Record<string, unknown> {
  if (raw == null) return {}
  if (typeof raw === "object") return raw as Record<string, unknown>
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  return {}
}

async function alreadyMigrated(userId: string): Promise<Set<string>> {
  const existing = await prisma.block.findMany({
    where: { userId },
    select: { config: true },
  })
  const set = new Set<string>()
  for (const b of existing) {
    const cfg = (b.config as Record<string, unknown> | null) ?? {}
    const legacy = cfg.legacyId
    if (typeof legacy === "string") set.add(legacy)
  }
  return set
}

async function migrateUser(userId: string) {
  const skip = await alreadyMigrated(userId)

  // Counter for position; appended in the order we process types.
  let position = 0

  // ─── Links ────────────────────────────────────────
  const links = await prisma.link.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  })

  const seeds: BlockSeed[] = []

  // Top-level non-folder, non-vault links → "link" blocks
  for (const link of links) {
    if (skip.has(`link:${link.id}`)) continue
    if (link.isFolder) continue
    if (link.isVaultItem) continue
    if (link.parentId) continue // children handled with their folder

    seeds.push({
      userId,
      type: "link",
      title: link.title,
      enabled: link.enabled,
      position: position++,
      url: link.url || null,
      thumbnail: link.thumbnail ?? null,
      style: link.style || "glass",
      size: link.cardSize || "full",
      legacyId: `link:${link.id}`,
      migratedFrom: "Link",
      config: {
        icon: link.icon ?? null,
        linkType: link.type,
        legacyId: `link:${link.id}`,
        migratedFrom: "Link",
      },
    })
  }

  // Folders → "collection" blocks, with children
  const folders = links.filter((l) => l.isFolder)
  const collectionLegacyToSeed = new Map<string, BlockSeed>()
  for (const folder of folders) {
    if (skip.has(`link:${folder.id}`)) continue
    const seed: BlockSeed = {
      userId,
      type: "collection",
      title: folder.title,
      enabled: folder.enabled,
      position: position++,
      legacyId: `link:${folder.id}`,
      migratedFrom: "Link",
      config: {
        legacyId: `link:${folder.id}`,
        migratedFrom: "Link",
      },
    }
    collectionLegacyToSeed.set(folder.id, seed)
    seeds.push(seed)
  }

  // Vault items
  for (const link of links) {
    if (!link.isVaultItem) continue
    if (skip.has(`link:${link.id}`)) continue
    seeds.push({
      userId,
      type: "vault",
      title: link.title,
      enabled: link.enabled,
      position: position++,
      legacyId: `link:${link.id}`,
      migratedFrom: "Link",
      config: {
        emailRequired: link.isEmailLocked,
        content: link.vaultContent,
        downloadUrl: link.downloadUrl,
        downloadName: link.downloadName,
        url: link.url,
        legacyId: `link:${link.id}`,
        migratedFrom: "Link",
      },
    })
  }

  // ─── Modules ────────────────────────────────────────
  const modules = await prisma.module.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  })
  for (const m of modules) {
    if (skip.has(`module:${m.id}`)) continue
    const cfg = parseConfig(m.config)
    const sizeMap: Record<number, string> = { 1: "compact", 2: "half", 4: "full" }
    seeds.push({
      userId,
      type: m.type,
      title: m.title ?? m.type,
      enabled: m.enabled,
      position: position++,
      size: sizeMap[m.span] ?? "full",
      legacyId: `module:${m.id}`,
      migratedFrom: "Module",
      config: {
        ...cfg,
        legacyId: `module:${m.id}`,
        migratedFrom: "Module",
      },
    })
  }

  // ─── Products ────────────────────────────────────────
  const products = await prisma.product.findMany({ where: { userId } })
  for (const p of products) {
    if (skip.has(`product:${p.id}`)) continue
    seeds.push({
      userId,
      type: "product",
      title: p.title,
      enabled: p.enabled,
      position: position++,
      thumbnail: p.imageUrl ?? null,
      legacyId: `product:${p.id}`,
      migratedFrom: "Product",
      config: {
        price: p.price,
        currency: p.currency,
        description: p.description,
        fileUrl: p.downloadUrl,
        fileName: p.downloadName,
        legacyId: `product:${p.id}`,
        migratedFrom: "Product",
      },
    })
  }

  // ─── Drops ────────────────────────────────────────
  const drops = await prisma.drop.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })
  for (const d of drops) {
    if (skip.has(`drop:${d.id}`)) continue
    seeds.push({
      userId,
      type: "drop",
      title: d.title,
      enabled: d.enabled,
      position: position++,
      legacyId: `drop:${d.id}`,
      migratedFrom: "Drop",
      config: {
        description: d.description,
        dropAt: d.dropAt,
        revealUrl: d.revealUrl,
        revealText: d.revealText,
        limitedSpots: d.limitedSpots,
        spotsLeft: d.spotsLeft,
        legacyId: `drop:${d.id}`,
        migratedFrom: "Drop",
      },
    })
  }

  // ─── Social Links ────────────────────────────────────────
  const socialLinks = await prisma.socialLink.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  })
  for (const s of socialLinks) {
    if (skip.has(`social:${s.id}`)) continue
    seeds.push({
      userId,
      type: "social_link",
      title: s.platform,
      enabled: s.enabled,
      position: position++,
      url: s.url,
      legacyId: `social:${s.id}`,
      migratedFrom: "SocialLink",
      config: {
        platform: s.platform,
        legacyId: `social:${s.id}`,
        migratedFrom: "SocialLink",
      },
    })
  }

  // ─── Crypto Addresses ────────────────────────────────────────
  const cryptos = await prisma.cryptoAddress.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  })
  for (const c of cryptos) {
    if (skip.has(`crypto:${c.id}`)) continue
    seeds.push({
      userId,
      type: "crypto",
      title: c.label || c.currency,
      enabled: c.enabled,
      position: position++,
      legacyId: `crypto:${c.id}`,
      migratedFrom: "CryptoAddress",
      config: {
        currency: c.currency,
        address: c.address,
        legacyId: `crypto:${c.id}`,
        migratedFrom: "CryptoAddress",
      },
    })
  }

  // ─── Create top-level seeds, then children ────────────────────
  // First pass: create everything that isn't a child link.
  const created = new Map<string, string>() // legacyId → new Block id

  for (const seed of seeds) {
    const block = await prisma.block.create({
      data: {
        userId: seed.userId,
        title: seed.title,
        type: seed.type,
        enabled: seed.enabled ?? true,
        position: seed.position,
        url: seed.url ?? null,
        thumbnail: seed.thumbnail ?? null,
        description: seed.description ?? null,
        style: seed.style ?? "glass",
        size: seed.size ?? "full",
        config: seed.config as object,
      },
    })
    created.set(seed.legacyId, block.id)
  }

  // Second pass: child links → block under their collection parent
  for (const link of links) {
    if (!link.parentId) continue
    if (skip.has(`link:${link.id}`)) continue
    const parentLegacyId = `link:${link.parentId}`
    const parentBlockId = created.get(parentLegacyId)
    if (!parentBlockId) continue // parent wasn't a migrated folder, skip

    const childCount = await prisma.block.count({
      where: { userId, parentId: parentBlockId },
    })

    await prisma.block.create({
      data: {
        userId,
        type: "link",
        title: link.title,
        enabled: link.enabled,
        position: childCount,
        url: link.url || null,
        thumbnail: link.thumbnail ?? null,
        style: link.style || "glass",
        size: link.cardSize || "full",
        parentId: parentBlockId,
        config: {
          icon: link.icon ?? null,
          linkType: link.type,
          legacyId: `link:${link.id}`,
          migratedFrom: "Link",
        },
      },
    })
  }

  return { seedCount: seeds.length }
}

async function main() {
  console.log("🔁 Migrating legacy records to Block model...\n")

  const users = await prisma.user.findMany({ select: { id: true, username: true } })
  let totalUsers = 0
  let totalSeeds = 0

  for (const u of users) {
    const { seedCount } = await migrateUser(u.id)
    if (seedCount > 0) {
      console.log(`  @${u.username}: migrated ${seedCount} blocks`)
      totalSeeds += seedCount
    }
    totalUsers += 1
  }

  console.log(`\n✅ Done. Processed ${totalUsers} users, migrated ${totalSeeds} blocks.`)
}

main()
  .catch((err) => {
    console.error("❌ Migration failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
