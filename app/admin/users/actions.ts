"use server"

import { revalidatePath } from "next/cache"
import { requireAdminAction } from "@/lib/admin"
import {
  grantComp,
  revokeComp,
  COMP_PLANS,
  COMP_DURATIONS,
  type CompPlan,
  type CompDuration,
} from "@/lib/comped"

/**
 * Admin mutations for manual plan grants. Server Actions are directly
 * invokable POST endpoints, so EVERY action re-checks the ADMIN_EMAILS
 * allowlist itself — page-level gating alone is not a defense here.
 */

export type PlanActionState = { ok: boolean; message: string } | null

export async function grantPlanAction(
  _prev: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const admin = await requireAdminAction()

  const userId = String(formData.get("userId") ?? "")
  const plan = String(formData.get("plan") ?? "")
  const duration = String(formData.get("duration") ?? "")
  const reason = String(formData.get("reason") ?? "").trim()

  if (!userId) return { ok: false, message: "Missing user id." }
  if (!COMP_PLANS.includes(plan as CompPlan)) {
    return { ok: false, message: "Pick a plan: Pro or Ultra." }
  }
  if (!COMP_DURATIONS.some((d) => d.id === duration)) {
    return { ok: false, message: "Pick a duration." }
  }
  if (reason.length < 3) {
    return { ok: false, message: "A reason is required (e.g. partnership, support, friend)." }
  }
  if (reason.length > 500) {
    return { ok: false, message: "Reason too long (500 chars max)." }
  }

  const result = await grantComp({
    userId,
    plan: plan as CompPlan,
    duration: duration as CompDuration,
    reason,
    grantedBy: admin.email,
  })
  if (!result.ok) return { ok: false, message: result.error }

  console.log(`[admin] plan grant: user=${userId} plan=${plan} duration=${duration} by=${admin.email}`)
  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  return { ok: true, message: `Granted ${plan} (${duration}).` }
}

export async function revokePlanAction(
  _prev: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const admin = await requireAdminAction()

  const userId = String(formData.get("userId") ?? "")
  if (!userId) return { ok: false, message: "Missing user id." }

  const result = await revokeComp(userId)
  if (!result.ok) return { ok: false, message: result.error }

  console.log(`[admin] plan revoke: user=${userId} by=${admin.email}`)
  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  return { ok: true, message: "Comp revoked — user is back on Free." }
}
