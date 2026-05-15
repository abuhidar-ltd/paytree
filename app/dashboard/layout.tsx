import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/clerk-auth"
import { DashboardSidebar } from "@/components/ui/dashboard-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!user.onboarded) {
    redirect("/onboarding")
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
