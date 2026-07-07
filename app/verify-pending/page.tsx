import { unstable_noStore as noStore } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { VerifyPendingScreen } from "@/components/verify-pending-screen"

/**
 * The email-verification gate's waiting room (2026-07-07 hard gate).
 *
 * Everyone lands here with a session but no access: fresh email/password
 * signups, unverified logins, and every default verification-link click
 * (lib/auth.ts points callbackURL at this page, so success AND
 * &error=<CODE> failures both resolve here). The client screen polls
 * /api/auth/check-verified and moves on the moment the flag flips —
 * including when the link was clicked in a different browser, which is the
 * normal case inside social-app WebViews.
 *
 * Session lookup uses auth.api.getSession directly, NOT getCurrentUser():
 * that helper deliberately returns null for unverified accounts — the very
 * users this page exists for.
 */
export default async function VerifyPendingPage() {
  noStore()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/login")

  // `onboarded` is an additionalField — present at runtime but not in the
  // static session type (config is annotated as BetterAuthOptions, which
  // widens away the inference). A wrong guess self-corrects: /onboarding
  // redirects already-onboarded users to /dashboard.
  const { email, emailVerified } = session.user
  const onboarded = (session.user as { onboarded?: boolean | null }).onboarded

  return (
    <VerifyPendingScreen
      email={email}
      initiallyVerified={emailVerified}
      target={onboarded ? "/dashboard" : "/onboarding"}
    />
  )
}
