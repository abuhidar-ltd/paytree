"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdminAction } from "@/lib/admin"

/**
 * Manual fraud-review tagging. flaggedSuspicious is a pure admin bookmark —
 * it never blocks login, features, or publishing, and nothing automated ever
 * sets it. Server Actions are directly invokable POST endpoints, so the
 * action re-checks the ADMIN_EMAILS allowlist itself (same rule as
 * app/admin/users/actions.ts).
 */
export async function setSuspiciousAction(formData: FormData): Promise<void> {
  const admin = await requireAdminAction()

  const userIds = formData
    .getAll("userIds")
    .map((v) => String(v))
    .filter(Boolean)
    .slice(0, 100)
  const flag = String(formData.get("flag")) === "1"
  if (userIds.length === 0) return

  const { count } = await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { flaggedSuspicious: flag },
  })

  console.log(
    `[admin] fraud ${flag ? "flag" : "unflag"}: ${count} user(s) [${userIds.join(",")}] by=${admin.email}`
  )
  revalidatePath("/admin/fraud")
  revalidatePath("/admin/users")
}
