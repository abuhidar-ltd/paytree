import { unstable_noStore as noStore } from "next/cache"
import { getCurrentUser } from "@/lib/get-user"
import { redirect } from "next/navigation"
import { OnboardingFlow } from "./onboarding-flow"

export default async function OnboardingPage() {
  noStore()
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

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
