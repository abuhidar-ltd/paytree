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
    const headersList = await headers()
    const pathname = headersList.get("x-pathname") ?? ""
    if (!pathname.startsWith("/onboarding") && !pathname.startsWith("/api")) {
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
