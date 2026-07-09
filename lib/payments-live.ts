/**
 * Paytree — LIVE payments kill-switch (TEMPORARY)
 * ================================================================
 * Stripe is reviewing our application to create *live* Connect accounts.
 * Until that clears, real creators must not start the live Stripe Connect
 * flow or take real payments (Product cards, paid Drops, Tip jar). We show a
 * friendly "back soon" maintenance state on exactly those money-movement
 * surfaces and enforce the same thing server-side.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  THE SINGLE TOGGLE.  Flip this to `true` the moment Stripe approves.  │
 * │  That one change lifts the maintenance state EVERYWHERE — UI + API.   │
 * │  (Or delete this module and its imports for a full clean-up.)         │
 * └─────────────────────────────────────────────────────────────────────┘
 */
export const PAYMENTS_LIVE = false

/**
 * Are real (live) Stripe keys in use?
 *
 * Test mode is NEVER gated — local dev and test accounts keep working so we
 * can keep testing the full flow while the live experience is paused. The
 * server sees the secret key; the browser only ever sees the publishable key
 * (`NEXT_PUBLIC_*`), so we check whichever is available in the current runtime.
 */
function usingLiveStripeKeys(): boolean {
  const key =
    process.env.STRIPE_SECRET_KEY /* server */ ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY /* client */ ||
    ""
  return key.startsWith("sk_live_") || key.startsWith("pk_live_")
}

/**
 * Is real money movement currently available to creators & buyers?
 * True once `PAYMENTS_LIVE` is flipped, OR whenever we're on test keys.
 */
export function paymentsLive(): boolean {
  if (PAYMENTS_LIVE) return true
  // Not yet enabled → only actually gate when real (live) keys are in use.
  return !usingLiveStripeKeys()
}

/** Convenience inverse — drives the maintenance UI and API guards. */
export function paymentsUnderMaintenance(): boolean {
  return !paymentsLive()
}

/**
 * Copy for the maintenance state. Calm and confident, never "error/down/broken".
 * Kept here so every surface reads from one place.
 */
export const PAYMENTS_MAINTENANCE = {
  sticker: "BACK SOON",
  stickerShort: "SOON",
  pill: "Back very soon",
  title: "Payments are getting a final tune-up",
  body: "Back very soon — everything else on your page works as normal.",
} as const

/**
 * Shared JSON body returned by gated API routes (HTTP 503). Frontends that hit
 * an endpoint directly get the same friendly, non-alarming message.
 */
export const PAYMENTS_MAINTENANCE_RESPONSE = {
  error: PAYMENTS_MAINTENANCE.title,
  message: PAYMENTS_MAINTENANCE.body,
  code: "PAYMENTS_MAINTENANCE",
} as const
