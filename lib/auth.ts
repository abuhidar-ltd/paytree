import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const hasGoogleOAuth = !!(googleClientId && googleClientSecret)

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
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
          const base =
            (user.email.split("@")[0] || "user")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 15) || "user"
          let candidate = base
          let i = 1
          while (await prisma.user.findUnique({ where: { username: candidate } })) {
            candidate = `${base}${i++}`
            if (i > 100) {
              candidate = `${base}${Date.now()}`
              break
            }
          }
          return { data: { ...user, username: candidate } }
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
