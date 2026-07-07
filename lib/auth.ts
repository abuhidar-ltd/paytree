import { randomBytes } from "crypto"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import { trackServer } from "@/lib/analytics-server"

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

// Vercel geo headers arrive URL-encoded ("Abu%20Dhabi"); a malformed value
// must never throw inside a signup hook.
function decodeGeoHeader(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function parseCoord(value: string | null): number | null {
  if (!value) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const trustedOrigins = buildTrustedOrigins()

if (process.env.NODE_ENV !== "test") {
  // One compact line per cold start so a misconfigured deploy is obvious
  // from logs without three multi-line dumps on every function instance.
  console.log(
    `[auth] init baseURL=${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "<undefined>"} ` +
      `google=${hasGoogleOAuth} origins=${trustedOrigins.join(",")}`
  )

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
  // warn+error only: debug-level output drowned the signal (the route wrapper
  // in app/api/auth/[...all]/route.ts already logs request/response/body).
  logger: {
    disabled: false,
    level: "warn",
    log(level, message, ...args) {
      console.log(`[better-auth:${level}]`, message, ...args)
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // HARD GATE — deliberately flipped from "visibility only" to mandatory on
    // 2026-07-07 as an anti-fraud measure. Existing users were grandfathered
    // via scripts/grandfather-email-verified.ts before enforcement shipped.
    //
    // The flag itself stays false ON PURPOSE: in better-auth 1.6.20 setting it
    // true also (a) skips session creation on sign-up (dist/api/routes/
    // sign-up.mjs → `token: null`), which strands the /verify-pending polling
    // flow and forces WebView signups (94% of traffic) to re-type their
    // password after verifying, and (b) turns duplicate-email signups into
    // synthetic fake-success responses, breaking the "account exists → sign
    // in" recovery. Unverified users therefore DO get a session — it just
    // grants nothing. The gate is enforced one layer up:
    //   proxy.ts          unverified session on any protected page → /verify-pending
    //   lib/get-user.ts   getCurrentUser() → null until verified (every page + API)
    //   sign-in/up screens  navigate unverified users straight to /verify-pending
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    // Links get clicked from an inbox hours later — the 1h default expires
    // for anyone who signs up on mobile and opens email on desktop at night.
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      // Better Auth builds `url` with the caller's callbackURL (or "/" when
      // absent). Land every default click on /verify-pending: that page owns
      // the whole verification UX — success fires complete_verification and
      // forwards to onboarding/dashboard; bad tokens append &error=<CODE> and
      // surface the resend button right there. Explicit callbackURLs (e.g. a
      // future change-email flow) pass through.
      const link = new URL(url)
      const cb = link.searchParams.get("callbackURL")
      if (!cb || cb === "/") {
        link.searchParams.set("callbackURL", "/verify-pending")
      }
      // sendVerificationEmail catches internally — a Resend failure logs
      // instead of failing the signup this hook runs inside of.
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl: link.toString(),
      })
    },
    afterEmailVerification: async (user) => {
      console.log(`[auth] email verified userId=${user.id}`)
      await trackServer("verify_email")
    },
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
      // Resend button on /verify-pending and the dashboard banner. 5/min per
      // IP is plenty for a human mashing "Resend" and keeps a bot from using
      // us as an email cannon.
      "/send-verification-email": { window: 60, max: 5 },
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
            console.log(`[signup] user.create.before email=${user.email} username=${candidate}`)
            return { data: { ...user, username: candidate } }
          } catch (err) {
            console.error(
              `[signup] user.create.before FAILED email=${user.email} err=${err instanceof Error ? err.message : String(err)}`,
              err instanceof Error ? err.stack : undefined,
            )
            throw err
          }
        },
        after: async (user, ctx) => {
          console.log(`[signup] user created id=${user.id} email=${user.email}`)
          // Signup fingerprint: IP + coarse geo (Vercel edge headers) + UA,
          // for duplicate-signup review in /admin/fraud. deviceHash arrives a
          // moment later via /api/signup-fingerprint (client beacon) — bots
          // and Google OAuth signups keep it null. FLAGGING data only; never
          // read by anything that gates the user. Never throw — a fingerprint
          // failure (e.g. table not migrated yet) must not abort a signup.
          try {
            const h = ctx?.request?.headers
            if (h) {
              await prisma.signupFingerprint.create({
                data: {
                  userId: user.id,
                  ip: (h.get("x-forwarded-for") || "").split(",")[0]?.trim() || null,
                  country: h.get("x-vercel-ip-country") || null,
                  region: h.get("x-vercel-ip-country-region") || null,
                  city: decodeGeoHeader(h.get("x-vercel-ip-city")),
                  latitude: parseCoord(h.get("x-vercel-ip-latitude")),
                  longitude: parseCoord(h.get("x-vercel-ip-longitude")),
                  userAgent: (h.get("user-agent") || "").slice(0, 500) || null,
                },
              })
              console.log(`[signup] fingerprint ok userId=${user.id}`)
            } else {
              console.log(`[signup] fingerprint skipped (no request ctx) userId=${user.id}`)
            }
          } catch (err) {
            console.error(
              `[signup] fingerprint FAILED userId=${user.id} err=${err instanceof Error ? err.message : String(err)}`
            )
          }
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
            console.log(`[signup] starter-card ok userId=${user.id}`)
          } catch (err) {
            const code = (err as { code?: string })?.code
            console.error(
              `[signup] starter-card FAILED userId=${user.id} code=${code ?? "-"} err=${err instanceof Error ? err.message : String(err)}`,
              err instanceof Error ? err.stack : undefined,
            )
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Fires on signup AND login — session id truncated: it's a bearer
          // credential, logs only need enough of it to correlate.
          console.log(`[auth] session created userId=${session.userId} sid=${session.id.slice(0, 8)}…`)
        },
      },
    },
  },
}

export const auth = betterAuth(config)

export type Session = typeof auth.$Infer.Session
