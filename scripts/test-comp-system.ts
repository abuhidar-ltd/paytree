import "dotenv/config"
import { prisma } from "../lib/prisma"
import { grantComp, revokeComp, expireCompIfDue } from "../lib/comped"
import { resolveUserPlan, getUserFeatures, PLANS } from "../lib/plans"

/**
 * End-to-end smoke test for the manual plan-grant (comp) system.
 * Creates a throwaway user, walks grant → gates → MRR-exclusion → revoke →
 * expiry → paying-customer-refusal, and deletes everything it created.
 *
 *   npx tsx scripts/test-comp-system.ts
 *
 * Safe to run anywhere the DB is safe to write to (it only touches its own
 * throwaway rows), but intended for the paytree-test database.
 */

let failures = 0
function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "  ✓" : "  ✗ FAIL"} ${label}${!ok && detail ? ` — ${detail}` : ""}`)
  if (!ok) failures++
}

async function main() {
  const stamp = Date.now().toString(36)
  const email = `comp-test-${stamp}@example.com`
  const username = `comp-test-${stamp}`
  const admin = "admin-test@paytree.to"

  console.log(`\n[1] Creating throwaway user ${email}`)
  const user = await prisma.user.create({
    data: { email, username, name: "Comp Test" },
    select: { id: true },
  })

  try {
    // ── Baseline ──
    let u = await load(user.id)
    check("new user resolves to free", resolveUserPlan(u) === "free")
    check("free: drops locked", !getUserFeatures(u).hasDrops)
    check("free: vault locked", !getUserFeatures(u).hasLockedLinks)
    check("free: AI agent locked", !getUserFeatures(u).hasAiFeatures)

    // ── Grant Ultra, 3 months ──
    console.log("\n[2] Granting Ultra (3 months)")
    const grant = await grantComp({
      userId: user.id, plan: "ultra", duration: "3m",
      reason: "smoke test — partnership", grantedBy: admin,
    })
    check("grant succeeds", grant.ok, grant.ok ? "" : grant.error)

    u = await load(user.id)
    check("resolves to ultra", resolveUserPlan(u) === "ultra")
    check("ultra: drops unlocked", getUserFeatures(u).hasDrops)
    check("ultra: vault unlocked", getUserFeatures(u).hasLockedLinks)
    check("ultra: AI agent unlocked", getUserFeatures(u).hasAiFeatures)
    check("isComped set", u.isComped)
    check("expiry ~3 months out", !!u.compedExpiresAt && u.compedExpiresAt > new Date())

    const openLog = await prisma.planGrantLog.findFirst({
      where: { userId: user.id, revokedAt: null },
    })
    check("audit log row written", !!openLog && openLog.plan === "ultra" && openLog.grantedBy === admin)

    // ── MRR exclusion (same loop as /admin) ──
    console.log("\n[3] MRR exclusion")
    let mrr = 0
    const plan = resolveUserPlan(u)
    if (plan !== "free" && !u.isComped && u.subscriptionStatus !== "trial") {
      mrr += PLANS[plan].monthly
    }
    check("comped user contributes $0 to MRR", mrr === 0)

    // ── Revoke ──
    console.log("\n[4] Revoke")
    const revoke = await revokeComp(user.id)
    check("revoke succeeds", revoke.ok, revoke.ok ? "" : revoke.error)
    u = await load(user.id)
    check("back to free", resolveUserPlan(u) === "free" && !u.isComped)
    const closedLog = await prisma.planGrantLog.findFirst({
      where: { userId: user.id }, orderBy: { grantedAt: "desc" },
    })
    check("audit log stamped revokedAt", !!closedLog?.revokedAt)

    // ── Expiry (check-on-read) ──
    console.log("\n[5] Expiry check-on-read")
    await grantComp({
      userId: user.id, plan: "pro", duration: "1m",
      reason: "smoke test — expiry", grantedBy: admin,
    })
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: user.id },
      data: { compedExpiresAt: yesterday, subscriptionEndsAt: yesterday },
    })
    u = await load(user.id)
    check("expired comp resolves free BEFORE revert (pure check)", resolveUserPlan(u) === "free")
    const reverted = await expireCompIfDue(u)
    check("expireCompIfDue reverts the row", reverted)
    u = await load(user.id)
    check("row reverted to free", u.subscriptionStatus === "free" && !u.isComped)
    const expiredLog = await prisma.planGrantLog.findFirst({
      where: { userId: user.id }, orderBy: { grantedAt: "desc" },
    })
    check("expiry stamped at scheduled date", !!expiredLog?.revokedAt &&
      Math.abs(expiredLog.revokedAt.getTime() - yesterday.getTime()) < 1000)

    // ── Paying customers are protected ──
    console.log("\n[6] Refuses to comp a paying customer")
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: "active", stripeSubscriptionId: "sub_test_123" },
    })
    const refused = await grantComp({
      userId: user.id, plan: "ultra", duration: "lifetime",
      reason: "should fail", grantedBy: admin,
    })
    check("grant refused for live Stripe subscription", !refused.ok)

    // Canceled mid-term with paid time remaining is still a paying customer.
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: "canceled", subscriptionEndsAt: nextMonth },
    })
    const refusedGrace = await grantComp({
      userId: user.id, plan: "ultra", duration: "lifetime",
      reason: "should fail", grantedBy: admin,
    })
    check("grant refused for canceled sub with paid grace time", !refusedGrace.ok)

    // ── Month-end expiry clamp ──
    console.log("\n[7] Expiry date clamps short months")
    const { compExpiryDate } = await import("../lib/comped")
    const jan31 = new Date("2026-01-31T12:00:00Z")
    const plus1m = compExpiryDate("1m", jan31)
    check(
      "Jan 31 + 1 month clamps to Feb 28 (no March overflow)",
      !!plus1m && plus1m.getUTCMonth() === 1 && plus1m.getUTCDate() === 28,
      plus1m?.toISOString()
    )
  } finally {
    console.log("\n[8] Cleanup")
    await prisma.planGrantLog.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
    console.log("  throwaway rows deleted")
  }

  console.log(failures === 0 ? "\nALL CHECKS PASSED ✓\n" : `\n${failures} CHECK(S) FAILED ✗\n`)
  process.exit(failures === 0 ? 0 : 1)
}

function load(id: string) {
  return prisma.user.findUniqueOrThrow({ where: { id } })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
