import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { trackServer } from "@/lib/analytics-server"
import { closeCompGrantLogs, CLEAR_COMP_FIELDS } from "@/lib/comped"
import Stripe from "stripe"
import { Resend } from "resend"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * POST /api/stripe/webhook
 * 
 * Stripe webhook handler for subscription events.
 * 
 * CRITICAL: This is the ONLY place where pages get published after payment.
 * Publishing happens ONLY after Stripe confirms successful payment via webhook.
 * 
 * Events handled:
 * - checkout.session.completed: Payment successful, publish page
 * - customer.subscription.created: New subscription created
 * - customer.subscription.updated: Subscription status changed
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Recurring payment successful
 * - invoice.payment_failed: Payment failed (for logging)
 */
export async function POST(req: Request) {
  const startTime = Date.now()
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("[STRIPE WEBHOOK] 🔔 Incoming webhook request")
  console.log("[STRIPE WEBHOOK] 📅 Timestamp:", new Date().toISOString())
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  
  let body: string
  let signature: string | null
  
  try {
    // Get raw body (required for signature verification)
    body = await req.text()
    
    // Get Stripe signature from headers
    const headersList = await headers()
    signature = headersList.get("stripe-signature")
    
    console.log("[STRIPE WEBHOOK] ✅ Raw body received:", body.substring(0, 100) + "...")
    console.log("[STRIPE WEBHOOK] ✅ Signature present:", !!signature)
    
    if (!signature) {
      console.error("[STRIPE WEBHOOK] ❌ Missing stripe-signature header")
      return NextResponse.json(
        { error: "Missing stripe-signature header" }, 
        { status: 400 }
      )
    }
  } catch (error: unknown) {
    console.error("[STRIPE WEBHOOK] ❌ Error reading request:", (error as Error).message)
    return NextResponse.json(
      { error: "Failed to read request" }, 
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    console.log("[STRIPE WEBHOOK] 🔑 Webhook secret present:", !!webhookSecret)
    
    if (!webhookSecret) {
      // Fail closed in production: never process an unsigned event. A missing
      // secret here would otherwise let anyone POST a forged Stripe event.
      if (process.env.NODE_ENV === "production") {
        console.error("[STRIPE WEBHOOK] ❌ STRIPE_WEBHOOK_SECRET is not set — refusing to process unsigned event in production")
        return NextResponse.json(
          { error: "Webhook secret not configured" },
          { status: 500 }
        )
      }

      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.warn("[STRIPE WEBHOOK] ⚠️  WARNING: No STRIPE_WEBHOOK_SECRET set!")
      console.warn("[STRIPE WEBHOOK] ⚠️  Signature verification DISABLED (insecure!)")
      console.warn("[STRIPE WEBHOOK] ⚠️  Set STRIPE_WEBHOOK_SECRET in production!")
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

      // Parse without verification (development only)
      event = JSON.parse(body) as Stripe.Event
    } else {
      // Verify webhook signature (production)
      console.log("[STRIPE WEBHOOK] 🔐 Verifying webhook signature...")
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log("[STRIPE WEBHOOK] ✅ Signature verified!")
    }
  } catch (err: unknown) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.error("[STRIPE WEBHOOK] ❌ Signature verification failed!")
    console.error("[STRIPE WEBHOOK] Error:", (err as Error).message)
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    return NextResponse.json(
      { error: "Webhook signature verification failed" }, 
      { status: 400 }
    )
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`[STRIPE WEBHOOK] 📨 Event Type: ${event.type}`)
  console.log(`[STRIPE WEBHOOK] 🆔 Event ID: ${event.id}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("[STRIPE WEBHOOK] 💳 Processing checkout.session.completed...")
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        console.log(`[STRIPE WEBHOOK] 🔄 Processing ${event.type}...`)
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case "customer.subscription.deleted": {
        console.log("[STRIPE WEBHOOK] ❌ Processing subscription deletion...")
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case "invoice.payment_succeeded": {
        console.log("[STRIPE WEBHOOK] 💰 Processing successful payment...")
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case "invoice.payment_failed": {
        console.log("[STRIPE WEBHOOK] ⚠️  Processing failed payment...")
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      case "account.updated": {
        // Connect account status sync. This is the SOURCE OF TRUTH for status
        // changes that happen with no user in the loop — Stripe finishing an
        // async review, or flagging an account for more info days later. The
        // connect/callback route only catches the moment the user returns.
        console.log("[STRIPE WEBHOOK] 🔗 Processing account.updated...")
        const account = event.data.object as Stripe.Account
        await handleConnectAccountUpdated(account)
        break
      }

      default:
        console.log(`[STRIPE WEBHOOK] ℹ️  Unhandled event type: ${event.type}`)
    }

    const duration = Date.now() - startTime
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`[STRIPE WEBHOOK] ✅ Success! Processed in ${duration}ms`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return NextResponse.json({ received: true, processed: event.type })

  } catch (error: unknown) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.error("[STRIPE WEBHOOK] ❌ Error processing event!")
    console.error("[STRIPE WEBHOOK] Error:", (error as Error).message)
    console.error("[STRIPE WEBHOOK] Stack:", (error as Error).stack)
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    return NextResponse.json(
      { error: "Webhook handler failed", details: (error as Error).message }, 
      { status: 500 }
    )
  }
}

/**
 * Handle block product purchase (type: "block_product_purchase")
 * Increments salesCount on the Block, emails buyer + seller.
 */
async function handleBlockProductPurchase(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}
  const blockId = metadata.blockId
  const sellerId = metadata.sellerId

  console.log("[STRIPE WEBHOOK] 🛒 Block product purchase:")
  console.log("  - Block ID:", blockId)
  console.log("  - Seller ID:", sellerId)
  console.log("  - Buyer email:", session.customer_details?.email)

  if (!blockId) {
    console.error("[STRIPE WEBHOOK] ❌ No blockId in block_product_purchase metadata!")
    return
  }

  try {
    const block = await prisma.block.update({
      where: { id: blockId },
      data: { salesCount: { increment: 1 } },
      include: {
        user: {
          select: { id: true, username: true, email: true, name: true },
        },
      },
    })

    const cfg = (block.config as Record<string, unknown>) || {}

    // For drop blocks with limited spots: decrement spotsLeft, delete when 0
    if (block.type === "drop") {
      const limitedSpots = typeof cfg.limitedSpots === "number" ? cfg.limitedSpots : null
      if (limitedSpots !== null) {
        const currentSpotsLeft = typeof cfg.spotsLeft === "number" ? cfg.spotsLeft : limitedSpots
        const newSpotsLeft = Math.max(0, currentSpotsLeft - 1)
        if (newSpotsLeft <= 0) {
          await prisma.block.delete({ where: { id: blockId } }).catch(() => {})
          console.log(`[STRIPE WEBHOOK] 🗑️ Drop block "${block.title}" deleted — all spots claimed`)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await prisma.block.update({ where: { id: blockId }, data: { config: { ...cfg, spotsLeft: newSpotsLeft } as any } }).catch(() => {})
          console.log(`[STRIPE WEBHOOK] 🎯 Drop spots remaining: ${newSpotsLeft}`)
        }
      }
    }
    const price = typeof cfg.price === "number" ? cfg.price : 0
    const downloadUrl = cfg.downloadUrl as string | undefined
    const downloadName = cfg.downloadName as string | undefined
    const buyerEmail = session.customer_details?.email || ""
    const saleAmount = price ? `$${(price / 100).toFixed(2)}` : "—"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"

    console.log(`[STRIPE WEBHOOK] ✅ salesCount incremented for block "${block.title}" → ${block.salesCount}`)

    // Revenue event — amount in cents, straight from the paid session.
    await trackServer("receive_payment", {
      amount: session.amount_total ?? price,
      type: "block_product",
    })

    // Social proof event
    prisma.socialProof.create({
      data: {
        userId: block.user.id,
        type: "purchase",
        message: `Someone just purchased ${block.title}`,
      },
    }).catch(() => {})

    if (!buyerEmail) return

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Email buyer
    const downloadSection = downloadUrl
      ? `<a href="${downloadUrl}" style="display:inline-block;padding:14px 28px;background:#00ff88;color:#080808;font-family:monospace;font-weight:bold;font-size:14px;text-decoration:none;border-radius:4px;margin-top:20px;">&#8595; ${downloadName || "Download your file"}</a>`
      : `<p style="color:#888;font-family:monospace;font-size:13px;margin-top:20px;">Visit the creator's page to access your order.</p>`

    resend.emails.send({
      from: "Paytree <noreply@paytree.to>",
      to: buyerEmail,
      subject: `Your purchase: ${block.title}`,
      html: `
        <div style="background:#080808;padding:40px 32px;max-width:520px;margin:0 auto;font-family:monospace;">
          <div style="color:#00ff88;font-size:20px;font-weight:bold;margin-bottom:8px;">Purchase confirmed</div>
          <div style="color:#ffffff;font-size:16px;margin-bottom:24px;">${block.title}</div>
          ${downloadSection}
          <hr style="border:none;border-top:1px solid #1a1a1a;margin:40px 0;" />
          <div style="color:#555;font-size:12px;">Sold by @${block.user.username} via Paytree</div>
        </div>
      `,
    }).catch(() => {})

    // Email seller
    resend.emails.send({
      from: "Paytree <noreply@paytree.to>",
      to: block.user.email,
      subject: "You just made a sale 🎉",
      html: `
        <div style="background:#080808;padding:40px 32px;max-width:520px;margin:0 auto;font-family:monospace;">
          <div style="color:#00ff88;font-size:20px;font-weight:bold;margin-bottom:24px;">You just made a sale</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="color:#555;font-size:12px;padding:10px 0;border-bottom:1px solid #1a1a1a;">Product</td>
              <td style="color:#e0e0e0;font-size:13px;padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;">${block.title}</td>
            </tr>
            <tr>
              <td style="color:#555;font-size:12px;padding:10px 0;border-bottom:1px solid #1a1a1a;">Amount</td>
              <td style="color:#00ff88;font-size:16px;font-weight:bold;padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;">${saleAmount}</td>
            </tr>
            <tr>
              <td style="color:#555;font-size:12px;padding:10px 0;">Buyer</td>
              <td style="color:#e0e0e0;font-size:13px;padding:10px 0;text-align:right;">${buyerEmail}</td>
            </tr>
            <tr>
              <td style="color:#555;font-size:12px;padding:10px 0;">Total sold</td>
              <td style="color:#00ff88;font-size:13px;font-weight:bold;padding:10px 0;text-align:right;">${block.salesCount} × ${block.title}</td>
            </tr>
          </table>
          <a href="${appUrl}/dashboard/analytics" style="display:inline-block;padding:14px 28px;background:#00ff88;color:#080808;font-family:monospace;font-weight:bold;font-size:14px;text-decoration:none;border-radius:6px;margin-top:32px;">View your sales →</a>
          <hr style="border:none;border-top:1px solid #1a1a1a;margin:40px 0;" />
          <div style="color:#444;font-size:11px;">@${block.user.username} on Paytree</div>
        </div>
      `,
    }).catch(() => {})

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "unknown"
    console.error("[STRIPE WEBHOOK] ❌ Error handling block product purchase:", msg)
  }
}

/**
 * Handle GET requests - return 405 Method Not Allowed
 * This confirms the endpoint exists but only accepts POST
 */
export async function GET() {
  console.log("[STRIPE WEBHOOK] ⚠️  GET request received - returning 405")
  return NextResponse.json(
    { 
      error: "Method Not Allowed",
      message: "This endpoint only accepts POST requests from Stripe webhooks" 
    }, 
    { 
      status: 405,
      headers: {
        'Allow': 'POST'
      }
    }
  )
}

/**
 * Handle checkout.session.completed
 * This fires when user completes checkout and payment succeeds
 * 
 * Handles:
 * 1. Subscription purchases (publishes page)
 * 2. Product purchases (completes order and sends download)
 * 3. Tips (records the tip)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}
  const checkoutType = metadata.type
  
  console.log("[STRIPE WEBHOOK] 📋 Checkout session details:")
  console.log("  - Session ID:", session.id)
  console.log("  - Checkout Type:", checkoutType || "subscription")
  console.log("  - Customer ID:", session.customer)
  console.log("  - Payment Status:", session.payment_status)
  console.log("  - Metadata:", JSON.stringify(metadata))
  
  // Handle block product purchase
  if (checkoutType === "block_product_purchase") {
    await handleBlockProductPurchase(session)
    return
  }

  // Handle product purchase (legacy Product model)
  if (checkoutType === "product_purchase") {
    await handleProductPurchase(session)
    return
  }

  // Handle tip
  if (checkoutType === "tip") {
    await handleTipPayment(session)
    return
  }
  
  // Otherwise, handle subscription
  const userId = session.client_reference_id || metadata.userId

  // Get subscription details first (needed for plan resolution)
  const subscriptionId = session.subscription as string

  if (!subscriptionId) {
    console.error("[STRIPE WEBHOOK] ❌ No subscription ID in checkout session!")
    return
  }

  console.log("[STRIPE WEBHOOK] 🔍 Fetching subscription details from Stripe...")
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription & { current_period_end?: number | null }

  // Resolve user — try userId first, then stripeCustomerId, then email
  let resolvedUser: { id: string } | null = null

  if (userId) {
    resolvedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!resolvedUser) {
      console.warn("[STRIPE WEBHOOK] ⚠️  userId from metadata not found:", userId)
    }
  }

  if (!resolvedUser && session.customer) {
    const customerId = session.customer as string
    console.log("[STRIPE WEBHOOK] 🔍 Falling back to stripeCustomerId lookup:", customerId)
    resolvedUser = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    })
  }

  if (!resolvedUser && session.customer_details?.email) {
    const email = session.customer_details.email
    console.log("[STRIPE WEBHOOK] 🔍 Falling back to email lookup:", email)
    resolvedUser = await prisma.user.findFirst({
      where: { email },
      select: { id: true },
    })
  }

  if (!resolvedUser) {
    console.error("[STRIPE WEBHOOK] ❌ Cannot find user for checkout session!")
    console.error("  - client_reference_id:", session.client_reference_id)
    console.error("  - metadata.userId:", metadata.userId)
    console.error("  - customer:", session.customer)
    console.error("  - email:", session.customer_details?.email)
    return
  }

  const resolvedId = resolvedUser.id

  // Determine status based on subscription
  let status: string
  let trialEndsAt: Date | null = null
  let subscriptionEndsAt: Date | null = null

  console.log("[STRIPE WEBHOOK] 📊 Subscription status:", subscription.status)
  console.log("[STRIPE WEBHOOK] 📊 Trial end:", subscription.trial_end)
  console.log("[STRIPE WEBHOOK] 📊 Current period end:", subscription.current_period_end)

  if (subscription.status === 'trialing') {
    status = 'trial'
    trialEndsAt = safeStripeDate(subscription.trial_end)
  } else if (subscription.status === 'active') {
    status = 'active'
    subscriptionEndsAt = safeStripeDate(subscription.current_period_end)
  } else {
    status = subscription.status
  }

  console.log("[STRIPE WEBHOOK] 💾 Updating user in database...")
  console.log("  - Status:", status)
  console.log("  - Trial ends:", trialEndsAt)
  console.log("  - Subscription ends:", subscriptionEndsAt)

  // Extract plan + interval — subscription metadata is authoritative; fall back to session metadata
  const subMeta = (subscription.metadata && Object.keys(subscription.metadata).length > 0)
    ? subscription.metadata
    : (session.metadata || {})
  const plan = subMeta.plan || 'starter'
  const interval = subMeta.interval || 'monthly'

  // Persist customer ID (covers race where create-checkout-session DB write didn't complete)
  const stripeCustomerId = session.customer ? (session.customer as string) : undefined

  // A real paid subscription supersedes any admin-granted comp — clear the
  // comped flags so this user counts in MRR, and close their grant-log rows.
  await closeCompGrantLogs(resolvedId)

  // Update user subscription status AND publish page
  const user = await prisma.user.update({
    where: { id: resolvedId },
    data: {
      subscriptionStatus: status,
      subscriptionPlan: plan,
      subscriptionInterval: interval,
      stripeSubscriptionId: subscriptionId,
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
      trialEndsAt,
      subscriptionEndsAt,
      ...CLEAR_COMP_FIELDS,
      // AUTO-PUBLISH PAGE AFTER SUCCESSFUL PAYMENT
      pageStatus: 'published',
      publishedAt: new Date(),
    },
    select: {
      username: true,
      email: true,
      pageStatus: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
    }
  })

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("[STRIPE WEBHOOK] 🎉 SUCCESS!")
  console.log(`  - User: ${user.username} (${user.email})`)
  console.log(`  - Subscription: ${status}`)
  console.log(`  - Page Status: ${user.pageStatus}`)
  console.log(`  - Published: ✅ YES`)
  console.log(`  - Live URL: /${user.username}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  // THE money metric: a confirmed paid subscription. Server-side because
  // the buyer's tab is on Stripe's domain when this becomes true.
  await trackServer("complete_upgrade", { plan, interval, status })
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  
  console.log("[STRIPE WEBHOOK] 📋 Subscription update details:")
  console.log("  - Subscription ID:", subscription.id)
  console.log("  - User ID (from metadata):", userId)
  console.log("  - Status:", subscription.status)
  
  if (!userId) {
    // Try to find user by subscription ID
    console.log("[STRIPE WEBHOOK] 🔍 No userId in metadata, searching by subscription ID...")
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      select: { id: true, username: true }
    })
    
    if (!user) {
      console.error("[STRIPE WEBHOOK] ❌ Cannot find user for subscription:", subscription.id)
      return
    }
    
    console.log(`[STRIPE WEBHOOK] ✅ Found user: ${user.username} (${user.id})`)
    await updateUserSubscription(user.id, subscription)
  } else {
    await updateUserSubscription(userId, subscription)
  }
}

/**
 * Handle subscription deletion (canceled or expired)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = subscription as Stripe.Subscription & {
    metadata?: Record<string, string>
    current_period_end?: number | null
  }
  const userId = sub.metadata?.userId
  
  console.log("[STRIPE WEBHOOK] 📋 Subscription deletion details:")
  console.log("  - Subscription ID:", sub.id)
  console.log("  - User ID (from metadata):", userId)
  
  // Find user by subscription ID if not in metadata
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, isComped: true }
      })
    : await prisma.user.findFirst({
        where: { stripeSubscriptionId: sub.id },
        select: { id: true, username: true, isComped: true }
      })

  if (!user) {
    console.error("[STRIPE WEBHOOK] ❌ Cannot find user for deleted subscription:", sub.id)
    return
  }

  // An admin-granted comp outranks the death of an OLD Stripe subscription —
  // don't let a stale cancellation event downgrade a deliberately comped user.
  if (user.isComped) {
    console.log(`[STRIPE WEBHOOK] ⏭️  ${user.username} has an active comp — skipping cancellation downgrade`)
    return
  }

  console.log(`[STRIPE WEBHOOK] 📝 Marking subscription as canceled for: ${user.username}`)

  // Mark subscription as canceled but keep page published for grace period
  const cancelDate = safeStripeDate(sub.current_period_end) || new Date()
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'canceled',
      subscriptionEndsAt: cancelDate,
    }
  })

  console.log(`[STRIPE WEBHOOK] ✅ Subscription canceled for user ${user.username}`)
  console.log("  - Grace period until:", cancelDate.toISOString())
}

/**
 * Handle successful payment (recurring)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const inv = invoice as Stripe.Invoice & { subscription?: string | null }
  if (!inv.subscription) {
    console.log("[STRIPE WEBHOOK] ℹ️  Invoice has no subscription, skipping...")
    return
  }

  console.log("[STRIPE WEBHOOK] 💰 Payment succeeded for subscription:", inv.subscription)

  const subscription = await stripe.subscriptions.retrieve(inv.subscription) as Stripe.Subscription
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.log("[STRIPE WEBHOOK] 🔍 No userId in metadata, searching by subscription ID...")
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      select: { id: true, username: true }
    })
    
    if (user) {
      console.log(`[STRIPE WEBHOOK] ✅ Found user: ${user.username}`)
      await updateUserSubscription(user.id, subscription)
    } else {
      console.error("[STRIPE WEBHOOK] ❌ Cannot find user for subscription:", subscription.id)
    }
  } else {
    await updateUserSubscription(userId, subscription)
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const inv = invoice as Stripe.Invoice & { subscription?: string | null }
  if (!inv.subscription) {
    console.log("[STRIPE WEBHOOK] ℹ️  Invoice has no subscription, skipping...")
    return
  }

  console.log("[STRIPE WEBHOOK] ⚠️  Payment failed for subscription:", inv.subscription)

  const subscription = await stripe.subscriptions.retrieve(inv.subscription) as Stripe.Subscription
  
  // Find user
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true, username: true, email: true }
  })

  if (user) {
    console.log(`[STRIPE WEBHOOK] ⚠️  Payment failed for user: ${user.username} (${user.email})`)
    console.log("  - Stripe handles dunning automatically")
    console.log("  - After multiple failures, subscription will be deleted")
  } else {
    console.error("[STRIPE WEBHOOK] ❌ Cannot find user for subscription:", subscription.id)
  }
}

/**
 * Handle account.updated for a Connect (Express) account.
 *
 * Webhooks carry NO session, so we match the connected account to a user by
 * stripeAccountId — never by any assumed user context. Uses the SAME status
 * logic as /api/stripe/connect/callback so the two never disagree:
 *   charges_enabled && payouts_enabled → active
 *   details_submitted only            → restricted
 *   neither                           → pending
 */
async function handleConnectAccountUpdated(account: Stripe.Account) {
  const accountId = account.id
  if (!accountId) {
    console.error("[STRIPE WEBHOOK] ❌ account.updated with no account id")
    return
  }

  const user = await prisma.user.findFirst({
    where: { stripeAccountId: accountId },
    select: { id: true, username: true, stripeAccountStatus: true },
  })

  if (!user) {
    // Not necessarily an error — could be an account we never saved (or one
    // deleted on our side). Log and move on so Stripe still gets a 200.
    console.warn(`[STRIPE WEBHOOK] ⚠️  account.updated for ${accountId} — no matching user`)
    return
  }

  let status: "active" | "restricted" | "pending"
  if (account.charges_enabled && account.payouts_enabled) {
    status = "active"
  } else if (account.details_submitted) {
    status = "restricted"
  } else {
    status = "pending"
  }

  if (user.stripeAccountStatus === status) {
    console.log(`[STRIPE WEBHOOK] ℹ️  account.updated ${accountId} — status unchanged (${status})`)
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeAccountStatus: status },
  })

  console.log(
    `[STRIPE WEBHOOK] ✅ account.updated ${user.username}: ${user.stripeAccountStatus} → ${status} (charges=${account.charges_enabled} payouts=${account.payouts_enabled} submitted=${account.details_submitted})`
  )
}

/**
 * Update user's subscription status based on Stripe subscription
 */
async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  const sub = subscription as Stripe.Subscription & {
    metadata?: Record<string, string>
    trial_end?: number | null
    current_period_end?: number | null
    cancel_at?: number | null
  }
  let status: string
  let trialEndsAt: Date | null = null
  let subscriptionEndsAt: Date | null = null

  console.log(`[STRIPE WEBHOOK] 📊 Updating subscription for user: ${userId}`)
  console.log("  - Subscription status:", sub.status)

  switch (sub.status) {
    case 'trialing':
      status = 'trial'
      trialEndsAt = safeStripeDate(sub.trial_end)
      break
    case 'active':
      status = 'active'
      subscriptionEndsAt = safeStripeDate(sub.current_period_end)
      break
    case 'canceled':
    case 'unpaid':
    case 'past_due':
      status = 'canceled'
      break
    default:
      status = sub.status
  }

  // Extract plan + interval from subscription metadata
  const subMeta = sub.metadata || {}
  let plan = subMeta.plan || undefined
  const interval = subMeta.interval || undefined

  // Fallback: determine plan from price ID if metadata is missing
  if (!plan) {
    const priceId = sub.items?.data?.[0]?.price?.id
    if (priceId) {
      const ultraMonthly = process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID
      const ultraYearly = process.env.STRIPE_ULTRA_YEARLY_PRICE_ID
      const starterMonthly = process.env.STRIPE_STARTER_MONTHLY_PRICE_ID
      const starterYearly = process.env.STRIPE_STARTER_YEARLY_PRICE_ID
      if (priceId === ultraMonthly || priceId === ultraYearly) {
        plan = "ultra"
      } else if (priceId === starterMonthly || priceId === starterYearly) {
        plan = "starter"
      }
    }
  }

  // Clear an active comp ONLY when a real subscription ACTIVATES. Dunning and
  // cancellation events (past_due/unpaid/canceled — often from an old, dead
  // subscription) must not strip a comp the admin granted on purpose, nor
  // clobber the comp's "active" status with "canceled".
  const isActivation = status === "active" || status === "trial"
  if (isActivation) {
    await closeCompGrantLogs(userId)
  } else {
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { isComped: true } })
    if (existing?.isComped) {
      console.log("[STRIPE WEBHOOK] ⏭️  user has an active comp — skipping non-activation subscription update")
      return
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: status,
      stripeSubscriptionId: sub.id,
      trialEndsAt,
      subscriptionEndsAt,
      ...(plan ? { subscriptionPlan: plan } : {}),
      ...(interval ? { subscriptionInterval: interval } : {}),
      ...(isActivation ? CLEAR_COMP_FIELDS : {}),
    },
    select: { username: true }
  })

  console.log(`[STRIPE WEBHOOK] ✅ Updated ${updatedUser.username}: ${status} (plan=${plan}, interval=${interval})`)
}

/**
 * Handle product purchase completion
 */
async function handleProductPurchase(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}
  const purchaseId = metadata.purchaseId
  const productId = metadata.productId
  
  console.log("[STRIPE WEBHOOK] 🛒 Processing product purchase:")
  console.log("  - Purchase ID:", purchaseId)
  console.log("  - Product ID:", productId)
  console.log("  - Customer Email:", session.customer_details?.email)
  
  if (!purchaseId) {
    console.error("[STRIPE WEBHOOK] ❌ No purchaseId in product checkout metadata!")
    return
  }
  
  try {
    // Update purchase record
    const purchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: "completed",
        buyerEmail: session.customer_details?.email || "",
      },
      include: {
        product: {
          select: {
            title: true,
            downloadUrl: true,
            downloadName: true,
            user: {
              select: { id: true, username: true, email: true }
            }
          }
        }
      }
    })
    
    console.log("[STRIPE WEBHOOK] ✅ Product purchase completed!")
    console.log("  - Product:", purchase.product.title)
    console.log("  - Buyer:", purchase.buyerEmail)
    console.log("  - Seller:", purchase.product.user.username)

    // Revenue event — amount in cents.
    await trackServer("receive_payment", {
      amount: session.amount_total ?? 0,
      type: "product",
    })

    // Social proof event (fire-and-forget)
    prisma.socialProof.create({
      data: {
        userId: purchase.product.user.id,
        type: "purchase",
        message: `Someone just purchased ${purchase.product.title}`,
      },
    }).catch(() => {})
    
    const resend = new Resend(process.env.RESEND_API_KEY)

    const downloadSection = purchase.product.downloadUrl
      ? `<a href="${purchase.product.downloadUrl}"
           style="display:inline-block;padding:14px 28px;background:#00ff88;color:#080808;
                  font-family:monospace;font-weight:bold;font-size:14px;text-decoration:none;
                  border-radius:4px;margin-top:20px;">
           &#8595; ${purchase.product.downloadName || "Download your file"}
         </a>`
      : `<p style="color:#888;font-family:monospace;font-size:13px;margin-top:20px;">
           Visit your purchases page to access your order.
         </p>`

    await resend.emails.send({
      from: "Paytree <noreply@paytree.to>",
      to: purchase.buyerEmail,
      subject: `Your purchase: ${purchase.product.title}`,
      html: `
        <div style="background:#080808;padding:40px 32px;max-width:520px;margin:0 auto;font-family:monospace;">
          <div style="color:#00ff88;font-size:20px;font-weight:bold;margin-bottom:8px;">
            Purchase confirmed
          </div>
          <div style="color:#ffffff;font-size:16px;margin-bottom:24px;">
            ${purchase.product.title}
          </div>
          ${downloadSection}
          <hr style="border:none;border-top:1px solid #1a1a1a;margin:40px 0;" />
          <div style="color:#555;font-size:12px;font-family:monospace;">
            Sold by @${purchase.product.user.username} via Paytree
          </div>
        </div>
      `,
    })

    // Notify the creator of their sale (fire-and-forget so buyer delivery isn't affected)
    const saleAmount = session.amount_total
      ? `$${(session.amount_total / 100).toFixed(2)}`
      : "—"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"

    resend.emails.send({
      from: "Paytree <noreply@paytree.to>",
      to: purchase.product.user.email,
      subject: "You just made a sale 🎉",
      html: `
        <div style="background:#080808;padding:40px 32px;max-width:520px;margin:0 auto;font-family:monospace;">
          <div style="color:#00ff88;font-size:20px;font-weight:bold;margin-bottom:24px;">You just made a sale</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="color:#555;font-size:12px;padding:10px 0;border-bottom:1px solid #1a1a1a;">Product</td>
              <td style="color:#e0e0e0;font-size:13px;padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;">${purchase.product.title}</td>
            </tr>
            <tr>
              <td style="color:#555;font-size:12px;padding:10px 0;border-bottom:1px solid #1a1a1a;">Amount</td>
              <td style="color:#00ff88;font-size:16px;font-weight:bold;padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;">${saleAmount}</td>
            </tr>
            <tr>
              <td style="color:#555;font-size:12px;padding:10px 0;">Buyer</td>
              <td style="color:#e0e0e0;font-size:13px;padding:10px 0;text-align:right;">${purchase.buyerEmail}</td>
            </tr>
          </table>
          <a href="${appUrl}/dashboard/analytics" style="display:inline-block;padding:14px 28px;background:#00ff88;color:#080808;font-family:monospace;font-weight:bold;font-size:14px;text-decoration:none;border-radius:6px;margin-top:32px;">View your sales →</a>
          <hr style="border:none;border-top:1px solid #1a1a1a;margin:40px 0;" />
          <div style="color:#444;font-size:11px;">@${purchase.product.user.username} on Paytree</div>
        </div>
      `,
    }).catch(() => {})

  } catch (error: unknown) {
    console.error("[STRIPE WEBHOOK] ❌ Error completing product purchase:", (error as Error).message)
  }
}

/**
 * Handle tip payment
 */
async function handleTipPayment(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}
  const recipientUserId = metadata.recipientUserId
  const recipientUsername = metadata.recipientUsername
  
  console.log("[STRIPE WEBHOOK] 💸 Processing tip payment:")
  console.log("  - Recipient User ID:", recipientUserId)
  console.log("  - Recipient Username:", recipientUsername)
  console.log("  - Amount:", session.amount_total)
  console.log("  - Tipper Email:", session.customer_details?.email)
  
  // Tips don't require database updates beyond what Stripe provides
  // The creator can see tips in their Stripe dashboard
  // In future, we could add a Tips table to track this

  // Revenue event — amount in cents.
  await trackServer("receive_payment", {
    amount: session.amount_total ?? 0,
    type: "tip",
  })

  console.log("[STRIPE WEBHOOK] ✅ Tip processed successfully!")
}

/**
 * Safely convert a Stripe timestamp to a Date object
 * Handles edge cases where the value might be undefined, null, or invalid
 */
function safeStripeDate(timestamp: number | null | undefined): Date | null {
  if (timestamp === null || timestamp === undefined) {
    return null
  }
  
  if (typeof timestamp !== 'number' || isNaN(timestamp) || timestamp <= 0) {
    console.warn(`[STRIPE WEBHOOK] ⚠️ Invalid timestamp value: ${timestamp}`)
    return null
  }
  
  const date = new Date(timestamp * 1000)
  
  // Verify the date is valid
  if (isNaN(date.getTime())) {
    console.warn(`[STRIPE WEBHOOK] ⚠️ Created invalid Date from timestamp: ${timestamp}`)
    return null
  }
  
  return date
}

// Disable body parser - Stripe needs raw body for signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
