import { unstable_noStore as noStore } from "next/cache"
import { getCurrentUser } from "@/lib/get-user"
import { redirect } from "next/navigation"
import { OnboardingFlow } from "./onboarding-flow"
import { attributeAffiliateIfNeeded } from "@/lib/affiliate"

export default async function OnboardingPage() {
  noStore()
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // First-touch partner attribution. Runs at the first SSR render after either
  // the email-signup flow or Google OAuth callback lands here. No-ops if the
  // user is already attributed or the ptaff cookie isn't set. Never throws.
  await attributeAffiliateIfNeeded(user)

  if (user.onboarded) {
    redirect("/dashboard")
  }

  return (
    <OnboardingFlow
      user={{
        username: user.username,
        name: user.name ?? null,
        image: user.image ?? null,
      }}
    />
  )
}
