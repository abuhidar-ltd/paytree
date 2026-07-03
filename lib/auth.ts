import { randomBytes } from "crypto"
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

  // Vercel-provided hostnames — critical so signup works on preview deployments
  // (each PR gets a paytree-git-<branch>-<team>.vercel.app URL). Without these,
  // every internal test on a preview URL hits INVALID_ORIGIN and looks like
  // "signup is broken". Also covers the production alias.
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null
  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null

  const defaults = [
    baseAlias,
    "https://paytree.to",
    "https://www.paytree.to",
    "http://localhost:3000",
    "http://localhost:3001",
    vercelUrl,
    vercelBranchUrl,
    vercelProdUrl,
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

  // Loud, one-time sanity check for the two variables whose absence otherwise
  // manifests as opaque 500s on every signup. We warn rather than throw so a
  // dev booting locally without a full .env still gets a running server —
  // production catches this via `next build`'s env inlining anyway.
  if (!process.env.BETTER_AUTH_SECRET) {
    console.warn(
      "[auth] ⚠ BETTER_AUTH_SECRET is not set — sessions will be signed with a\n" +
      "        random per-process secret and every deploy will invalidate all\n" +
      "        existing sessions. Set BETTER_AUTH_SECRET in Vercel before shipping."
    )
  }
  if (!process.env.BETTER_AUTH_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    console.warn(
      "[auth] ⚠ Neither BETTER_AUTH_URL nor NEXT_PUBLIC_APP_URL is set — the\n" +
      "        CSRF Origin check will reject every signup with INVALID_ORIGIN."
    )
  }
  if (!process.env.DATABASE_URL) {
    console.warn(
      "[auth] ⚠ DATABASE_URL is not set — every auth request will 500 as soon\n" +
      "        as Prisma tries to open a connection."
    )
  }
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
  // Rate limit only in production — bots hammering /sign-up eat Prisma pool
  // slots and cascade into real users seeing 500s. 10 requests per minute
  // per IP is generous for humans (a fumbled password + a retry) and
  // aggressive enough to make a botnet uneconomical. Better Auth keeps the
  // window in-memory; fine for the size of surface we're protecting.
  //
  // Disabled in dev/test — Playwright's IAB and concurrency specs fire from
  // a single loopback IP and would otherwise trip the limit within one run.
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 20,
    customRules: {
      "/sign-up/email": { window: 60, max: 10 },
      "/sign-in/email": { window: 60, max: 10 },
    },
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
  // Cookie domain lift for www/apex parity. Opt-in via env so dev on localhost
  // stays untouched. Set BETTER_AUTH_COOKIE_DOMAIN=".paytree.to" in Vercel to
  // share the session between paytree.to and www.paytree.to — if the marketing
  // team ever links across subdomains mid-flow, the user stays signed in.
  ...(process.env.BETTER_AUTH_COOKIE_DOMAIN
    ? {
        advanced: {
          defaultCookieAttributes: {
            domain: process.env.BETTER_AUTH_COOKIE_DOMAIN,
          },
        },
      }
    : {}),
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
          // Username allocation must be race-free under concurrent signups.
          // The old check-then-insert (findUnique → return candidate → let
          // Better Auth db.user.create) had a TOCTOU: two signups with the
          // same email-localpart arriving in the same tick both saw the base
          // free, both returned the same candidate, and the second insert
          // hit Prisma P2002 → generic "Sign up failed". The Playwright
          // concurrency spec reproduced this deterministically at N=6.
          //
          // Strategy now: always append 8 hex chars of cryptographic entropy
          // (~4B values per base). Two concurrent same-base signups collide
          // with probability ~1/4B; even a viral burst of 1000 same-base
          // requests has collision odds of 1 in ~8k. The residual is caught
          // by the client's FAILED_TO_CREATE_USER retry, which re-invokes
          // this hook and rolls fresh entropy — guaranteed-terminating.
          //
          // The username is a starter value only. During onboarding step 0
          // the user picks the pretty handle they actually want.
          try {
            const base =
              (user.email.split("@")[0] || "user")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")
                .slice(0, 12) || "user"
            const candidate = `${base}${randomBytes(4).toString("hex")}`
            console.log("[auth:hook] username allocated:", { email: user.email, username: candidate })
            return { data: { ...user, username: candidate } }
          } catch (err) {
            console.error("[auth:hook] user.create.before threw:", err)
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
