import { betterAuth, type BetterAuthOptions } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const hasGoogleOAuth = !!(googleClientId && googleClientSecret)

// ────────────────────────────────────────────────────────────────────────────
// trustedOrigins
//
// Better Auth's CSRF middleware rejects requests whose Origin header does NOT
// match `baseURL`'s origin or anything in `trustedOrigins`. The rejection is
// a 403 with `code: "INVALID_ORIGIN"` and (in some versions) NO `message`
// field — which means the React client surfaces `authError.message` as
// undefined, the signup form falls back to "Sign up failed", and the user
// never learns the real cause. Vercel does not count 4xx as a server error,
// which is why our logs show "0% errors" while production users can't sign up.
//
// Real users hit production via multiple aliases — `paytree.to`,
// `www.paytree.to`, the Vercel preview hostnames, and (briefly, during a TikTok
// share intercept) `m.paytree.to`. Any visit through a non-canonical alias
// produces an `Origin` that doesn't equal the configured `BETTER_AUTH_URL`,
// so we list every alias we know about here. Add to BETTER_AUTH_TRUSTED_ORIGINS
// in Vercel for any new domain instead of editing this file.
// ────────────────────────────────────────────────────────────────────────────
function buildTrustedOrigins(): string[] {
  const explicit = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  const baseAlias = baseURL ? safeOrigin(baseURL) : null

  const defaults = [
    baseAlias,
    "https://paytree.to",
    "https://www.paytree.to",
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter((s): s is string => !!s)

  // Dedup while preserving order so the canonical baseURL stays first.
  return Array.from(new Set([...defaults, ...explicit]))
}

function safeOrigin(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).origin
  } catch {
    return null
  }
}

const trustedOrigins = buildTrustedOrigins()

if (process.env.NODE_ENV !== "test") {
  // Print once at module init so a misconfigured deploy is obvious from logs.
  console.log("[auth] trustedOrigins:", trustedOrigins)
  console.log("[auth] baseURL:", process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "<undefined>")
  console.log("[auth] hasGoogleOAuth:", hasGoogleOAuth)
}

const config: BetterAuthOptions = {
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins,
  // Surface internal errors to Vercel logs. Without this we have no visibility
  // into 4xx rejections (INVALID_ORIGIN, USER_ALREADY_EXISTS, etc.) — they
  // come back to the client as `{ error: {...} }` with no server log.
  logger: {
    disabled: false,
    level: "debug",
    log(level, message, ...args) {
      console.log(`[better-auth:${level}]`, message, ...args)
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  // Register Google only when both credentials are present. Missing creds
  // would otherwise crash Better Auth at boot via the `as string` cast in
  // origin's earlier version. The signup/login pages further gate the button
  // behind NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED so users never see a broken flow.
  ...(hasGoogleOAuth
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
          },
        },
      }
    : {}),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      username: { type: "string", required: false, input: false },
      onboarded: { type: "boolean", required: false, input: false },
      subscriptionPlan: { type: "string", required: false, input: false },
      subscriptionStatus: { type: "string", required: false, input: false },
      stripeCustomerId: { type: "string", required: false, input: false },
      stripeAccountId: { type: "string", required: false, input: false },
      heroStyle: { type: "string", required: false, input: false },
      heroImage: { type: "string", required: false, input: false },
      accentColor: { type: "string", required: false, input: false },
      backgroundStyle: { type: "string", required: false, input: false },
      buttonStyle: { type: "string", required: false, input: false },
      fontFamily: { type: "string", required: false, input: false },
      cornerRadius: { type: "string", required: false, input: false },
      bio: { type: "string", required: false, input: false },
      removeBranding: { type: "boolean", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Wrap the whole hook so a Prisma timeout / pool exhaustion / collision
          // surfaces in Vercel logs instead of silently aborting the signup.
          // Better Auth catches any thrown error and returns a generic 500 to
          // the client — without this log we'd never know why.
          try {
            const base =
              (user.email.split("@")[0] || "user")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")
                .slice(0, 15) || "user"
            let candidate = base
            let i = 1
            const loopStart = Date.now()
            while (await prisma.user.findUnique({ where: { username: candidate } })) {
              candidate = `${base}${i++}`
              // Hard time bound on top of the iteration bound. Under bot load
              // the per-query latency can spike and i never reaches 100.
              if (i > 100 || Date.now() - loopStart > 3000) {
                candidate = `${base}${Date.now()}${Math.random().toString(36).slice(2, 6)}`
                break
              }
            }
            console.log("[auth:hook] username allocated:", { email: user.email, username: candidate })
            return { data: { ...user, username: candidate } }
          } catch (err) {
            console.error("[auth:hook] user.create.before threw:", err)
            // Re-throw so Better Auth aborts the signup with a proper error,
            // rather than silently creating a user with a NULL username (which
            // would break the unique constraint later anyway).
            throw err
          }
        },
        after: async (user) => {
          // Starter card: the canvas must never be empty. Runs for every
          // account path (email AND Google OAuth). config.starter marks it so
          // the go-live checklist can tell it apart from user-added cards.
          // Never throw — a failed starter card must not abort a signup.
          try {
            await prisma.block.create({
              data: {
                userId: user.id,
                type: "link",
                title: "My favorite link — tap to edit",
                url: "https://paytree.to",
                position: 0,
                config: { starter: true },
              },
            })
            console.log("[auth:hook] starter card created for", user.email)
          } catch (err) {
            console.error("[auth:hook] starter card create failed:", err)
          }
        },
      },
    },
  },
}

export const auth = betterAuth(config)

export type Session = typeof auth.$Infer.Session
