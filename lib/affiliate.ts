import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * First-touch affiliate attribution. Called from /onboarding SSR — the first
 * server component render after either the email-signup flow or the Google
 * OAuth callback lands the new user. Idempotent by design:
 *
 *   1. If `affiliateId` is already set on the user, we return without touching
 *      anything (first-touch means once, forever).
 *   2. If there is no `ptaff` cookie, there was no partner touchpoint — skip.
 *   3. If the cookie doesn't match an ACTIVE affiliate, skip silently — a
 *      stale slug from a deleted or paused partner must not block signup and
 *      must not silently attribute to the wrong partner.
 *
 * Never throws. Errors are logged and swallowed — attribution is a nice-to-
 * have and must never surface to the user or interrupt onboarding.
 */
export async function attributeAffiliateIfNeeded(user: {
  id: string
  affiliateId?: string | null
}): Promise<void> {
  if (user.affiliateId) return
  try {
    const cookieStore = await cookies()
    const slug = cookieStore.get("ptaff")?.value?.trim().toLowerCase()
    if (!slug) return

    const affiliate = await prisma.affiliate.findFirst({
      where: { slug, active: true },
      select: { id: true },
    })
    if (!affiliate) {
      console.log(`[ptaff] miss slug=${slug} userId=${user.id}`)
      return
    }

    // Race-safe: only set if still null. Prevents a double-attribution if
    // /onboarding is somehow re-rendered concurrently.
    await prisma.user.updateMany({
      where: { id: user.id, affiliateId: null },
      data: { affiliateId: affiliate.id },
    })
    console.log(`[ptaff] attributed userId=${user.id} affiliate=${affiliate.id} slug=${slug}`)
  } catch (err) {
    console.error("[ptaff] attribute failed:", err)
  }
}
