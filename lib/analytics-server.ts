/**
 * Server-side event tracking — the money metrics.
 *
 * Client events die with the tab; revenue must be recorded where it actually
 * happens. complete_upgrade and receive_payment fire from the Stripe webhook,
 * publish_page from /api/publish. Event names come from the same EventName
 * registry as the client (lib/analytics.ts).
 *
 * Never throws — a failed analytics call must never fail a webhook (Stripe
 * retries 500s, which would double-process the real work).
 */

import { track as vercelServerTrack } from "@vercel/analytics/server"
import type { EventName, Props } from "./analytics"

export async function trackServer(name: EventName, props: Props = {}): Promise<void> {
  try {
    await vercelServerTrack(name, props)
  } catch (err) {
    console.error(`[analytics-server] failed to track ${name}:`, err)
  }
}
