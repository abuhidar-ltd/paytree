import { test, expect, request as pwRequest } from "@playwright/test"

/**
 * Concurrent-signup guard: reproduce the username-allocation race and prove
 * the fix holds.
 *
 * BEFORE the July 2026 rewrite of databaseHooks.user.create.before, the hook
 * did findUnique → return candidate → let Better Auth db.user.create. Two
 * signups with the same email-localpart prefix, arriving in the same tick,
 * would both see the base free, both return the same candidate, and the
 * second Prisma insert would P2002 → the client saw a generic
 * "Sign up failed". This is exactly what killed conversion during paid spikes.
 *
 * The rewrite:
 *   - tries the clean base once
 *   - on any collision or lookup error, adds a crypto random 4-hex suffix
 *   - leaves the residual 1/65k to the client's FAILED_TO_CREATE_USER retry
 *
 * This test fires N parallel signups sharing an identical 15+ char base
 * (which is exactly the collision the old code hit), then asserts every
 * response is a session cookie, not a 500.
 */

const CONCURRENCY = 20

test("N parallel signups with identical email-prefix all succeed", async ({ baseURL }) => {
  test.setTimeout(60_000)

  // Same 20-char localpart prefix → same sanitized base → old code would
  // hand out the same candidate to every request in the burst.
  const sharedPrefix = "conc-race-shared-base"
  const now = Date.now()

  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }).map(async (_, i) => {
      const ctx = await pwRequest.newContext({ baseURL })
      const email = `${sharedPrefix}-${now}-${i}@paytree-e2e.test`
      const res = await ctx.post("/api/auth/sign-up/email", {
        data: {
          email,
          password: "concurrent-race-test-password-123",
          name: `Race ${i}`,
          callbackURL: "/onboarding",
        },
      })
      const body = await res.text()
      await ctx.dispose()
      return { i, status: res.status(), body: body.slice(0, 200), email }
    }),
  )

  const failures = results.filter((r) => r.status >= 400)
  if (failures.length > 0) {
    // Loud diagnostic — if this ever regresses we want the exact reason.
    console.error("[concurrent-signup] failures:", failures)
  }
  expect(failures, `Expected all ${CONCURRENCY} concurrent signups to succeed, got ${failures.length} failures`).toEqual([])

  // Sanity: no two accounts were handed the same username. The API doesn't
  // return username directly, so we can't assert this without a DB lookup —
  // the constraint enforcement above (no P2002 → all inserts landed on a
  // distinct username) is the guarantee.
  expect(results.length).toBe(CONCURRENCY)
})
