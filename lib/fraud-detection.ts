/**
 * Duplicate-signup detection over SignupFingerprint rows.
 *
 * FLAGGING for admin review only — nothing here blocks, bans, or gates.
 * False positives are expected and normal: shared WiFi, mobile carrier NAT
 * (very common across our Nigeria/MENA traffic), VPNs, and families all
 * produce legitimate same-IP accounts. That's why the signals are ranked:
 *
 *   deviceHash  — strongest. FingerprintJS hashes stable device traits, so
 *                 two accounts with the same hash are almost always the same
 *                 physical browser+device, regardless of email or cookies.
 *   ip          — weak alone. Only counted as a signal above 2 shared
 *                 accounts (1-2 is everyday NAT/WiFi noise).
 *   city + 24h  — weakest, informational only. Never affects riskLevel.
 *
 * The human decides per cluster on /admin/fraud; the strongest COMBINED
 * signal surfaced there is "shared device/IP AND nobody in the cluster
 * verified their email" — real people verify, throwaway inboxes don't.
 */

import { prisma } from "@/lib/prisma"

export type RiskLevel = "none" | "low" | "medium" | "high"

export interface SuspiciousSignals {
  sameDeviceCount: number
  sameIpCount: number
  sameCityRecentCount: number
  riskLevel: RiskLevel
}

/** The fields admin surfaces show for each account sharing a signal. */
export interface RelatedAccount {
  userId: string
  email: string
  username: string | null
  emailVerified: boolean
  onboarded: boolean
  pageStatus: string | null
  flaggedSuspicious: boolean
  createdAt: Date
  sharedDevice: boolean
  sharedIp: boolean
}

const RELATED_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  emailVerified: true,
  onboarded: true,
  pageStatus: true,
  flaggedSuspicious: true,
  createdAt: true,
} as const

// sameIpCount only becomes a signal above this — 1-2 shared-IP accounts is
// ordinary NAT/WiFi/family noise, not evidence.
const IP_SIGNAL_THRESHOLD = 2

export function computeRiskLevel(sameDeviceCount: number, sameIpCount: number): RiskLevel {
  if (sameDeviceCount > 0) return "high"
  if (sameIpCount > IP_SIGNAL_THRESHOLD) return "medium"
  return "low"
}

/**
 * Signals for one user. riskLevel "none" means we have no fingerprint row at
 * all (account predates this system, or a bot that never loaded the page).
 */
export async function getSuspiciousSignals(userId: string): Promise<SuspiciousSignals> {
  const fp = await prisma.signupFingerprint.findUnique({ where: { userId } })
  if (!fp) {
    return { sameDeviceCount: 0, sameIpCount: 0, sameCityRecentCount: 0, riskLevel: "none" }
  }

  const dayMs = 24 * 60 * 60 * 1000
  const [sameDeviceCount, sameIpCount, sameCityRecentCount] = await Promise.all([
    fp.deviceHash
      ? prisma.signupFingerprint.count({
          where: { deviceHash: fp.deviceHash, userId: { not: userId } },
        })
      : Promise.resolve(0),
    fp.ip
      ? prisma.signupFingerprint.count({
          where: { ip: fp.ip, userId: { not: userId } },
        })
      : Promise.resolve(0),
    fp.city
      ? prisma.signupFingerprint.count({
          where: {
            city: fp.city,
            userId: { not: userId },
            createdAt: {
              gte: new Date(fp.createdAt.getTime() - dayMs),
              lte: new Date(fp.createdAt.getTime() + dayMs),
            },
          },
        })
      : Promise.resolve(0),
  ])

  return {
    sameDeviceCount,
    sameIpCount,
    sameCityRecentCount,
    riskLevel: computeRiskLevel(sameDeviceCount, sameIpCount),
  }
}

export interface UserRisk {
  riskLevel: RiskLevel
  related: RelatedAccount[]
}

/**
 * Batch risk for the admin users table — computes every page row's risk in
 * two queries instead of 3-per-user. City signal is intentionally omitted
 * here (informational-only; it never moves the badge).
 */
export async function getRiskForUsers(userIds: string[]): Promise<Map<string, UserRisk>> {
  const result = new Map<string, UserRisk>()
  if (userIds.length === 0) return result

  const fps = await prisma.signupFingerprint.findMany({
    where: { userId: { in: userIds } },
  })
  for (const id of userIds) {
    result.set(id, { riskLevel: "none", related: [] })
  }
  if (fps.length === 0) return result

  const hashes = [...new Set(fps.map((f) => f.deviceHash).filter((v): v is string => !!v))]
  const ips = [...new Set(fps.map((f) => f.ip).filter((v): v is string => !!v))]
  if (hashes.length === 0 && ips.length === 0) {
    for (const fp of fps) result.set(fp.userId, { riskLevel: "low", related: [] })
    return result
  }

  const sharers = await prisma.signupFingerprint.findMany({
    where: {
      OR: [
        ...(hashes.length ? [{ deviceHash: { in: hashes } }] : []),
        ...(ips.length ? [{ ip: { in: ips } }] : []),
      ],
    },
    include: { user: { select: RELATED_USER_SELECT } },
  })

  for (const fp of fps) {
    const related = new Map<string, RelatedAccount>()
    let sameDeviceCount = 0
    let sameIpCount = 0
    for (const other of sharers) {
      if (other.userId === fp.userId) continue
      const sharedDevice = !!fp.deviceHash && other.deviceHash === fp.deviceHash
      const sharedIp = !!fp.ip && other.ip === fp.ip
      if (!sharedDevice && !sharedIp) continue
      if (sharedDevice) sameDeviceCount++
      if (sharedIp) sameIpCount++
      related.set(other.userId, {
        userId: other.userId,
        email: other.user.email,
        username: other.user.username,
        emailVerified: other.user.emailVerified,
        onboarded: other.user.onboarded,
        pageStatus: other.user.pageStatus,
        flaggedSuspicious: other.user.flaggedSuspicious,
        createdAt: other.user.createdAt,
        sharedDevice,
        sharedIp,
      })
    }
    result.set(fp.userId, {
      riskLevel: computeRiskLevel(sameDeviceCount, sameIpCount),
      related: [...related.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    })
  }
  return result
}

export interface FraudCluster {
  kind: "device" | "ip"
  /** The shared deviceHash or IP. */
  key: string
  members: (RelatedAccount & { city: string | null; country: string | null })[]
  allUnverified: boolean
}

// /admin/fraud lists only clusters of this size or larger — pairs are too
// often two real people (or one person's phone + laptop on the same NAT).
const CLUSTER_MIN = 3

/**
 * Clusters of 3+ accounts sharing a deviceHash or an IP, newest first.
 * Device clusters and IP clusters are listed separately — an account can
 * legitimately appear in both.
 */
export async function getFraudClusters(): Promise<FraudCluster[]> {
  const [byDevice, byIp] = await Promise.all([
    prisma.signupFingerprint.groupBy({
      by: ["deviceHash"],
      where: { deviceHash: { not: null } },
      having: { deviceHash: { _count: { gte: CLUSTER_MIN } } },
      _count: { deviceHash: true },
    }),
    prisma.signupFingerprint.groupBy({
      by: ["ip"],
      where: { ip: { not: null } },
      having: { ip: { _count: { gte: CLUSTER_MIN } } },
      _count: { ip: true },
    }),
  ])

  const deviceKeys = byDevice.map((g) => g.deviceHash).filter((v): v is string => !!v)
  const ipKeys = byIp.map((g) => g.ip).filter((v): v is string => !!v)
  if (deviceKeys.length === 0 && ipKeys.length === 0) return []

  const rows = await prisma.signupFingerprint.findMany({
    where: {
      OR: [
        ...(deviceKeys.length ? [{ deviceHash: { in: deviceKeys } }] : []),
        ...(ipKeys.length ? [{ ip: { in: ipKeys } }] : []),
      ],
    },
    include: { user: { select: RELATED_USER_SELECT } },
    orderBy: { createdAt: "asc" },
  })

  const toMember = (row: (typeof rows)[number], kind: "device" | "ip") => ({
    userId: row.userId,
    email: row.user.email,
    username: row.user.username,
    emailVerified: row.user.emailVerified,
    onboarded: row.user.onboarded,
    pageStatus: row.user.pageStatus,
    flaggedSuspicious: row.user.flaggedSuspicious,
    createdAt: row.user.createdAt,
    sharedDevice: kind === "device",
    sharedIp: kind === "ip",
    city: row.city,
    country: row.country,
  })

  const clusters: FraudCluster[] = []
  for (const key of deviceKeys) {
    const members = rows.filter((r) => r.deviceHash === key).map((r) => toMember(r, "device"))
    clusters.push({ kind: "device", key, members, allUnverified: members.every((m) => !m.emailVerified) })
  }
  for (const key of ipKeys) {
    const members = rows.filter((r) => r.ip === key).map((r) => toMember(r, "ip"))
    clusters.push({ kind: "ip", key, members, allUnverified: members.every((m) => !m.emailVerified) })
  }

  // Strongest first: device clusters, then by newest member activity.
  return clusters.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "device" ? -1 : 1
    const lastA = Math.max(...a.members.map((m) => m.createdAt.getTime()))
    const lastB = Math.max(...b.members.map((m) => m.createdAt.getTime()))
    return lastB - lastA
  })
}
