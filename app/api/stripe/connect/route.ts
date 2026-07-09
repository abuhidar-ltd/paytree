import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { resolveUserPlan } from "@/lib/plans"
import { isStripeSupportedCountry } from "@/lib/stripe-countries"
import { paymentsUnderMaintenance } from "@/lib/payments-live"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * GET /api/stripe/connect — browser-navigated Stripe Connect onboarding.
 *
 * History: this used raw fetch() against the Stripe API. When POST /v1/accounts
 * failed, the error JSON was silently swallowed — `account.id` came back
 * undefined, Prisma treated `stripeAccountId: undefined` as "leave the field
 * alone" (no crash, no save), and URLSearchParams stringified the undefined
 * into the literal string "undefined", producing Stripe's
 * "No such account: 'undefined'". Every failure mode below now either logs
 * loudly and redirects to the payments page (which toasts on ?stripe=error)
 * or throws — nothing passes undefined through silently.
 *
 * The user lands here via a full-page navigation, so errors REDIRECT (a JSON
 * body would render as a raw browser page); the real cause always goes to the
 * server log first.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const errorRedirect = () =>
    NextResponse.redirect(`${appUrl}/dashboard/payments?stripe=error`)

  // TEMPORARY: live Stripe Connect onboarding is paused while Stripe reviews
  // our live application. Browser-navigated route → redirect (a JSON body would
  // render as a raw page), matching the ?stripe= convention above. Test mode is
  // never gated. Lift by flipping PAYMENTS_LIVE in lib/payments-live.ts.
  if (paymentsUnderMaintenance()) {
    return NextResponse.redirect(`${appUrl}/dashboard/payments?stripe=maintenance`)
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      stripeAccountId: true,
      country: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      subscriptionEndsAt: true, isComped: true, compedExpiresAt: true,
    },
  })

  const plan = resolveUserPlan({
    subscriptionStatus: dbUser?.subscriptionStatus,
    subscriptionPlan: dbUser?.subscriptionPlan,
    trialEndsAt: dbUser?.trialEndsAt,
    subscriptionEndsAt: dbUser?.subscriptionEndsAt,
  })

  if (plan === "free") {
    return NextResponse.redirect(`${appUrl}/pricing?reason=connect`)
  }

  console.log("[stripe-connect] existing account id:", dbUser?.stripeAccountId)

  let stripeAccountId: string | null = dbUser?.stripeAccountId || null

  if (!stripeAccountId) {
    // Country is REQUIRED to create the Express account in the creator's own
    // country. Without it Stripe defaults to the platform's country (US),
    // which silently blocks non-US creators from adding a real bank account.
    // The payments/settings UI collects it before firing this route; this is
    // the hard backstop for any stale link that reaches here without one.
    const country = dbUser?.country?.toUpperCase()
    if (!country) {
      console.warn(`[stripe-connect] no country set userId=${user.id} — redirecting to country step`)
      return NextResponse.redirect(`${appUrl}/dashboard/payments?stripe=country_required`)
    }
    if (!isStripeSupportedCountry(country)) {
      console.warn(`[stripe-connect] unsupported country ${country} userId=${user.id}`)
      return NextResponse.redirect(`${appUrl}/dashboard/payments?stripe=country_unsupported`)
    }

    let account: Stripe.Account
    try {
      account = await stripe.accounts.create({
        type: "express",
        country,
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
    } catch (err) {
      // The SDK throws typed errors — this is the failure the old fetch()
      // version swallowed into "No such account: 'undefined'".
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[stripe-connect] accounts.create FAILED userId=${user.id} country=${country}: ${msg}`)
      // Final backstop: if Stripe itself rejects the country (our list drifted
      // from theirs), surface it clearly instead of a generic error.
      if (msg.toLowerCase().includes("support")) {
        return NextResponse.redirect(`${appUrl}/dashboard/payments?stripe=country_unsupported`)
      }
      return errorRedirect()
    }

    if (!account?.id) {
      console.error(`[stripe-connect] accounts.create returned no id userId=${user.id}`)
      return errorRedirect()
    }

    // Save IMMEDIATELY, race-safely: `updateMany` with the null-check condition
    // means a double-click (two concurrent requests both seeing null) can't
    // save two different account ids — exactly one request claims the slot.
    const claimed = await prisma.user.updateMany({
      // null OR "" — the pre-fix code normalized missing ids to "" in memory,
      // so tolerate either shape in the DB.
      where: { id: user.id, OR: [{ stripeAccountId: null }, { stripeAccountId: "" }] },
      data: { stripeAccountId: account.id, stripeAccountStatus: "pending" },
    })

    if (claimed.count === 1) {
      console.log(`[stripe-connect] saved new account id: ${account.id} userId=${user.id}`)
      stripeAccountId = account.id
    } else {
      // Lost the race — a parallel request saved its account first. Use the
      // winner's id and delete the just-created orphan so it never shows up
      // as a duplicate in the Stripe dashboard.
      const winner = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeAccountId: true },
      })
      console.warn(
        `[stripe-connect] race: created ${account.id} but ${winner?.stripeAccountId} was saved first userId=${user.id} — using saved id`
      )
      stripeAccountId = winner?.stripeAccountId ?? null
      if (stripeAccountId && stripeAccountId !== account.id) {
        try {
          await stripe.accounts.del(account.id)
        } catch (err) {
          console.warn(
            `[stripe-connect] orphan cleanup failed for ${account.id}:`,
            err instanceof Error ? err.message : err
          )
        }
      }
    }
  }

  // Guard: this must be impossible now, so make the impossible LOUD. Never
  // let an undefined account id reach Stripe again.
  if (!stripeAccountId) {
    throw new Error("Stripe account was not created successfully")
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/api/stripe/connect`,
      // The callback asks Stripe for the account's REAL state (return_url fires
      // even on abandon) and syncs our DB before landing on the payments page.
      return_url: `${appUrl}/api/stripe/connect/callback`,
      type: "account_onboarding",
    })
    return NextResponse.redirect(accountLink.url)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[stripe-connect] accountLinks.create FAILED account=${stripeAccountId} userId=${user.id}: ${msg}`)
    // Saved account no longer exists on Stripe (deleted in the dashboard,
    // or a test-mode id after a key rotation): clear it so the user's next
    // click creates a fresh account instead of being stuck forever.
    if (msg.includes("No such account")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: null, stripeAccountStatus: "not_connected" },
      })
      console.warn(`[stripe-connect] cleared stale account id ${stripeAccountId} userId=${user.id}`)
    }
    return errorRedirect()
  }
}
