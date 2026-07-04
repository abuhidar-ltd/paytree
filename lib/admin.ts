import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/get-user"

/**
 * Admin authorization for the read-only Admin Dashboard (V1).
 *
 * Admins are real, authenticated users whose email is listed in the
 * ADMIN_EMAILS environment variable (comma-separated). There is intentionally:
 *   - NO admin bootstrap route,
 *   - NO role/isAdmin column,
 *   - NO hardcoded emails.
 *
 * Fails CLOSED: if ADMIN_EMAILS is empty/unset, nobody is an admin.
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allow = getAdminEmails()
  if (allow.length === 0) return false // fail closed — never allow-all
  return allow.includes(email.trim().toLowerCase())
}

type AdminUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

/**
 * Require an authenticated, allowlisted admin. Calls notFound() (404) for
 * anyone who is not — so /admin is not discoverable by non-admins. Returns the
 * admin's user record on success. Compares the authenticated session email,
 * never a client-supplied value.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user || !isAdminEmail(user.email)) {
    notFound()
  }
  return user
}

/**
 * Same allowlist check for Server Actions (mutations), where a thrown error —
 * not a 404 render — is the correct rejection. Every admin action must call
 * this first; never rely on the page being gated, since actions are directly
 * invokable POST endpoints.
 */
export async function requireAdminAction(): Promise<AdminUser> {
  const user = await getCurrentUser()
  if (!user || !isAdminEmail(user.email)) {
    throw new Error("Unauthorized")
  }
  return user
}
