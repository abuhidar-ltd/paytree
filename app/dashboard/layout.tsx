import { redirect } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { headers } from "next/headers"
import { getCurrentUser } from "@/lib/clerk-auth"
import { DashboardSidebar } from "@/components/ui/dashboard-sidebar"

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
    // Don't redirect if we just came from onboarding — the DB write may
    // still be propagating and we'd create an infinite loop.
    const headersList = await headers()
    const referer = headersList.get("referer") ?? ""
    if (!referer.includes("/onboarding")) {
      redirect("/onboarding")
    }
  }

  return (
    <DashboardSidebar
      user={{
        username: user.username,
        image: user.image ?? null,
        name: user.name ?? null,
      }}
    >
      {children}
    </DashboardSidebar>
  )
}
