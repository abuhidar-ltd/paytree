import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * Get the current authenticated user from Better Auth + the full Prisma User row.
 * Returns null if no session or user not found.
 *
 * NOTE: errors here are logged but still return null. A swallowed Prisma /
 * Better Auth error during session validation used to make signed-in users
 * appear signed-out, which bounced them back to /login from /onboarding —
 * looked identical to "signup didn't work" from the user's perspective.
 */
export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) return null
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      console.warn("[getCurrentUser] session present but user not found in DB:", session.user.id)
    }
    return user
  } catch (err) {
    console.error("[getCurrentUser] threw:", err)
    return null
  }
}

/**
 * Throws "Unauthorized" if no session.
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

/**
 * Get current user id (shorthand). Returns null if no session.
 */
export async function getUserId() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return session?.user?.id ?? null
  } catch (err) {
    console.error("[getUserId] threw:", err)
    return null
  }
}
