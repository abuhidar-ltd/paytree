import { getCurrentUser } from "@/lib/clerk-auth"
import { redirect } from "next/navigation"
import { OnboardingFlow } from "./onboarding-flow"

export default async function OnboardingPage() {
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
