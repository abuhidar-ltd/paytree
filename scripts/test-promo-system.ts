import "dotenv/config"
import { prisma } from "../lib/prisma"
import {
  redeemPromoCode,
  generatePromoCode,
  PROMO_CODE_RE,
  PROMO_GENERIC_ERROR,
  PROMO_ALREADY_PLAN_ERROR,
} from "../lib/promo"
import { expireCompIfDue, grantComp } from "../lib/comped"
import { resolveUserPlan, getUserFeatures, PLANS } from "../lib/plans"

/**
 * End-to-end smoke test for the promo code system.
 * Creates a throwaway code + users, walks redeem → gates → audit-log →
 * max-redemptions → already-planned block → deactivate → expiry → MRR
 * exclusion, and deletes everything it created.
 *
 *   npx tsx scripts/test-promo-system.ts
 *
 * Intended for the paytree-test database (lib/prisma.ts guards production).
 */

let failures = 0
function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "  ✓" : "  ✗ FAIL"} ${label}${!ok && detail ? ` — ${detail}` : ""}`)
  if (!ok) failures++
}

async function makeUser(tag: string) {
  return prisma.user.create({
    data: { email: `promo-test-${tag}@example.com`, username: `promo-test-${tag}`, name: "Promo Test" },
    select: { id: true },
  })
}

function load(id: string) {
  return prisma.user.findUniqueOrThrow({ where: { id } })
}

async function main() {
  const stamp = Date.now().toString(36)
  const codeStr = `TEST-${stamp}`.toUpperCase()

  console.log(`\n[0] Code generator + format`)
  const suggested = generatePromoCode()
  check("generated code matches format", PROMO_CODE_RE.test(suggested), suggested)
  check("test code matches format", PROMO_CODE_RE.test(codeStr), codeStr)

  console.log(`\n[1] Creating throwaway users + code ${codeStr} (pro, 30d, max 2)`)
  const [userA, userB, userC, userD] = await Promise.all([
    makeUser(`${stamp}-a`),
    makeUser(`${stamp}-b`),
    makeUser(`${stamp}-c`),
    makeUser(`${stamp}-d`),
  ])
  const promo = await prisma.promoCode.create({
    data: {
      code: codeStr,
      plan: "pro",
      durationDays: 30,
      maxRedemptions: 2,
      note: "smoke test",
      createdBy: "test-script",
    },
  })
  const userIds = [userA.id, userB.id, userC.id, userD.id]

  try {
    // ── Redeem as user A ──
    console.log("\n[2] Redeem as user A")
    const r1 = await redeemPromoCode(userA.id, ` ${codeStr.toLowerCase()} `) // messy input on purpose
    check("redeem succeeds (case/whitespace normalized)", r1.ok, r1.ok ? "" : r1.error)
    let a = await load(userA.id)
    check("resolves to pro", resolveUserPlan(a) === "pro")
    check("pro: drops unlocked", getUserFeatures(a).hasDrops)
    check("isComped + compedSource=promo", a.isComped && a.compedSource === "promo")
    check("promoCodeId linked", a.promoCodeId === promo.id)
    const days = a.compedExpiresAt ? (a.compedExpiresAt.getTime() - Date.now()) / 86_400_000 : 0
    check("expiry ~30 days out", days > 29 && days < 31, `${days.toFixed(2)}d`)

    const redemption = await prisma.promoRedemption.findFirst({
      where: { promoCodeId: promo.id, userId: userA.id },
    })
    check("PromoRedemption row written", !!redemption && redemption.planGranted === "pro")
    const grantLog = await prisma.planGrantLog.findFirst({
      where: { userId: userA.id, revokedAt: null },
    })
    check(
      "PlanGrantLog row written with grantedBy=promo:CODE",
      !!grantLog && grantLog.grantedBy === `promo:${codeStr}` && grantLog.duration === "30d"
    )
    const afterOne = await prisma.promoCode.findUniqueOrThrow({ where: { id: promo.id } })
    check("timesRedeemed incremented to 1", afterOne.timesRedeemed === 1)

    // ── Already-active-plan block ──
    console.log("\n[3] Blocks users who already have a plan")
    const again = await redeemPromoCode(userA.id, codeStr)
    check("re-redeem by comped user blocked", !again.ok && !again.ok && again.error === PROMO_ALREADY_PLAN_ERROR)
    await grantComp({ userId: userD.id, plan: "ultra", duration: "1m", reason: "test", grantedBy: "test-script" })
    const compedTry = await redeemPromoCode(userD.id, codeStr)
    check("manually-comped user blocked with plan message", !compedTry.ok && compedTry.error === PROMO_ALREADY_PLAN_ERROR)
    await prisma.user.update({
      where: { id: userC.id },
      data: { subscriptionStatus: "active", subscriptionPlan: "pro", stripeSubscriptionId: "sub_test_x" },
    })
    const paidTry = await redeemPromoCode(userC.id, codeStr)
    check("paying user blocked with plan message", !paidTry.ok && paidTry.error === PROMO_ALREADY_PLAN_ERROR)
    await prisma.user.update({
      where: { id: userC.id },
      data: { subscriptionStatus: "free", subscriptionPlan: null, stripeSubscriptionId: null },
    })

    // ── Max redemptions ──
    console.log("\n[4] Max redemptions")
    const r2 = await redeemPromoCode(userB.id, codeStr)
    check("2nd redemption (user B) succeeds", r2.ok, r2.ok ? "" : r2.error)
    const r3 = await redeemPromoCode(userC.id, codeStr)
    check("3rd redemption rejected with generic error", !r3.ok && r3.error === PROMO_GENERIC_ERROR)
    const afterTwo = await prisma.promoCode.findUniqueOrThrow({ where: { id: promo.id } })
    check("timesRedeemed capped at 2", afterTwo.timesRedeemed === 2)

    // ── Generic error for unknown / inactive / date-expired codes ──
    console.log("\n[5] Enumeration resistance + deactivate")
    const unknown = await redeemPromoCode(userC.id, "DOES-NOT-EXIST")
    check("unknown code → generic error", !unknown.ok && unknown.error === PROMO_GENERIC_ERROR)
    await prisma.promoCode.update({
      where: { id: promo.id },
      data: { active: false, maxRedemptions: null }, // lift cap to prove active is what blocks
    })
    const inactive = await redeemPromoCode(userC.id, codeStr)
    check("deactivated code → generic error", !inactive.ok && inactive.error === PROMO_GENERIC_ERROR)
    await prisma.promoCode.update({
      where: { id: promo.id },
      data: { active: true, expiresAt: new Date(Date.now() - 60_000) },
    })
    const dateExpired = await redeemPromoCode(userC.id, codeStr)
    check("date-expired code → generic error", !dateExpired.ok && dateExpired.error === PROMO_GENERIC_ERROR)

    // ── MRR exclusion (same loop as /admin) ──
    console.log("\n[6] MRR exclusion")
    a = await load(userA.id)
    let mrr = 0
    const planA = resolveUserPlan(a)
    if (planA !== "free" && !a.isComped && a.subscriptionStatus !== "trial") {
      mrr += PLANS[planA].monthly
    }
    check("promo-redeemed user contributes $0 to MRR", mrr === 0)

    // ── Expiry check-on-read (shared comp machinery) ──
    console.log("\n[7] Expiry check-on-read")
    const yesterday = new Date(Date.now() - 86_400_000)
    await prisma.user.update({
      where: { id: userA.id },
      data: { compedExpiresAt: yesterday, subscriptionEndsAt: yesterday },
    })
    a = await load(userA.id)
    check("expired promo comp resolves free (pure check)", resolveUserPlan(a) === "free")
    const reverted = await expireCompIfDue(a)
    check("expireCompIfDue reverts the row", reverted)
    a = await load(userA.id)
    check(
      "row reverted: free + promo fields cleared",
      a.subscriptionStatus === "free" && !a.isComped && a.compedSource === null && a.promoCodeId === null
    )
  } finally {
    console.log("\n[8] Cleanup")
    await prisma.promoRedemption.deleteMany({ where: { promoCodeId: promo.id } })
    await prisma.promoCode.delete({ where: { id: promo.id } })
    await prisma.planGrantLog.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    console.log("  throwaway rows deleted")
  }

  console.log(failures === 0 ? "\nALL CHECKS PASSED ✓\n" : `\n${failures} CHECK(S) FAILED ✗\n`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
