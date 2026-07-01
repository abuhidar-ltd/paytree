import { createAuthClient } from "better-auth/react"

// No baseURL on purpose: the client then POSTs to /api/auth/* on whatever
// origin the user is actually browsing (paytree.to, www.paytree.to, a Vercel
// preview URL). Hardcoding NEXT_PUBLIC_APP_URL here made every visit through
// a non-canonical alias a cross-origin request — which is CORS-blocked in
// strict WebViews and surfaced to users as "Failed to fetch" during signup.
// Same-origin requests also always carry the session cookie.
//
// Server-side CSRF allowlisting for those aliases lives in lib/auth.ts
// (trustedOrigins).
export const authClient = createAuthClient()

export const { signIn, signUp, signOut, useSession, getSession } = authClient
