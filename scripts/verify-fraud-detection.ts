/**
 * End-to-end check of the duplicate-signup detection pipeline against the
 * LOCAL dev server + test DB (never prod).
 *
 * Usage: npx tsx scripts/verify-fraud-detection.ts
 * Expects `npm run dev` on :3000. Creates pt-fraud-* accounts; re-runnable
 * (cleans up its own accounts first).
 *
 * Scenarios:
 *   1. same device (identical deviceHash) ×2      → both HIGH
 *   2. same IP, distinct devices ×4               → each MEDIUM (3 > 2 others)
 *   3. lone signup, unique IP + device            → LOW, no relations
 *   4. device cluster of 3                        → appears in getFraudClusters
 */
import "dotenv/config"
import { prisma } from "../lib/prisma"
import { getSuspiciousSignals, getFraudClusters, getRiskForUsers } from "../lib/fraud-detection"

const BASE = process.env.VERIFY_BASE_URL || "http://localhost:3000"
const PW = "testpassword123"

let failures = 0
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? "PASS" : "FAIL"} ${label} — got ${JSON.stringify(actual)}${ok ? "" : `, expected ${JSON.stringify(expected)}`}`)
}

async function signup(email: string, ip: string, deviceHash: string | null): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: BASE,
      // Dev server passes this straight through; on Vercel the platform sets it.
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ email, password: PW, name: "Fraud Verify" }),
  })
  if (!res.ok) throw new Error(`signup failed ${res.status} for ${email}`)
  const setCookie = res.headers.get("set-cookie") || ""
  const sessionCookie = setCookie
    .split(/,(?=\s*\S+?=)/)
    .map((c) => c.split(";")[0].trim())
    .filter((c) => c.includes("session_token"))
    .join("; ")

  if (deviceHash) {
    const beacon = await fetch(`${BASE}/api/signup-fingerprint`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: sessionCookie, "x-forwarded-for": ip },
      body: JSON.stringify({ deviceHash }),
    })
    if (beacon.status !== 204) throw new Error(`beacon unexpected status ${beacon.status}`)
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) throw new Error(`user row missing for ${email}`)
  return user.id
}

async function main() {
  // Clean slate for re-runs.
  await prisma.user.deleteMany({ where: { email: { startsWith: "pt-fraud-" } } })

  const HASH_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" // shared device
  const IP_SOLO = "198.51.100.10"
  const IP_SHARED = "203.0.113.7"

  // 1. Same device, two accounts (different IPs — device signal must win alone)
  const dev1 = await signup("pt-fraud-dev1@example.com", "192.0.2.1", HASH_A)
  const dev2 = await signup("pt-fraud-dev2@example.com", "192.0.2.2", HASH_A)

  const s1 = await getSuspiciousSignals(dev1)
  const s2 = await getSuspiciousSignals(dev2)
  expect("same-device #1 risk", s1.riskLevel, "high")
  expect("same-device #1 sameDeviceCount", s1.sameDeviceCount, 1)
  expect("same-device #2 risk", s2.riskLevel, "high")

  // 2. Same IP, four accounts, all DIFFERENT devices → medium (3 others > 2)
  const ipIds: string[] = []
  for (let i = 0; i < 4; i++) {
    ipIds.push(await signup(`pt-fraud-ip${i}@example.com`, IP_SHARED, `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb${i}`))
  }
  const sIp = await getSuspiciousSignals(ipIds[0])
  expect("shared-IP risk", sIp.riskLevel, "medium")
  expect("shared-IP sameIpCount", sIp.sameIpCount, 3)
  expect("shared-IP sameDeviceCount", sIp.sameDeviceCount, 0)

  // 2b. Two accounts on one IP is NOT a signal (NAT/WiFi noise)
  const nat1 = await signup("pt-fraud-nat1@example.com", "192.0.2.50", "cccccccccccccccccccccccccccccc01")
  await signup("pt-fraud-nat2@example.com", "192.0.2.50", "cccccccccccccccccccccccccccccc02")
  const sNat = await getSuspiciousSignals(nat1)
  expect("two-on-one-IP stays low", sNat.riskLevel, "low")

  // 3. Lone signup — clean
  const solo = await signup("pt-fraud-solo@example.com", IP_SOLO, "dddddddddddddddddddddddddddddd01")
  const sSolo = await getSuspiciousSignals(solo)
  expect("lone signup risk", sSolo.riskLevel, "low")
  expect("lone signup relations", sSolo.sameDeviceCount + sSolo.sameIpCount, 0)
  const riskMap = await getRiskForUsers([solo])
  expect("lone signup batch risk", riskMap.get(solo)?.riskLevel, "low")
  expect("lone signup batch related", riskMap.get(solo)?.related.length, 0)

  // 4. Device cluster of 3 → fraud page cluster; the 2-account device pair
  //    from (1) must NOT appear (threshold is 3+); the 4-account IP cluster must.
  await signup("pt-fraud-dev3@example.com", "192.0.2.3", HASH_A)
  const clusters = await getFraudClusters()
  const mine = clusters.filter((c) => c.members.some((m) => m.email.startsWith("pt-fraud-")))
  const deviceCluster = mine.find((c) => c.kind === "device" && c.key === HASH_A)
  const ipCluster = mine.find((c) => c.kind === "ip" && c.key === IP_SHARED)
  expect("device cluster found (3 members)", deviceCluster?.members.length, 3)
  expect("device cluster all-unverified", deviceCluster?.allUnverified, true)
  expect("IP cluster found (4 members)", ipCluster?.members.length, 4)
  const natCluster = mine.find((c) => c.kind === "ip" && c.key === "192.0.2.50")
  expect("2-account IP pair below cluster threshold", natCluster, undefined)

  // 5. Overwrite protection: re-beacon with a new hash must be ignored
  //    (write-once while deviceHash is set).
  const fpBefore = await prisma.signupFingerprint.findUnique({ where: { userId: solo } })
  const res = await fetch(`${BASE}/api/signup-fingerprint`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": IP_SOLO },
    body: JSON.stringify({ deviceHash: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeee99" }),
  })
  expect("unauthenticated beacon returns 204", res.status, 204)
  const fpAfter = await prisma.signupFingerprint.findUnique({ where: { userId: solo } })
  expect("hash not overwritten", fpAfter?.deviceHash, fpBefore?.deviceHash)

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`)
  process.exitCode = failures === 0 ? 0 : 1
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
