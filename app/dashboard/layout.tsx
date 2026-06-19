import { redirect } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { getCurrentUser } from "@/lib/clerk-auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  noStore()

  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.onboarded) {
    redirect("/onboarding")
  }

  return <>{children}</>
}
