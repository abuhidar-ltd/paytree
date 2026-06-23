import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * Get the current authenticated user from Better Auth + the full Prisma User row.
 * Returns null if no session or user not found.
 */
export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) return null
    return await prisma.user.findUnique({ where: { id: session.user.id } })
  } catch {
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
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}
