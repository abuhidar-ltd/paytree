import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * GET /api/purchase/verify?session_id=cs_...[&block=<blockId>]
 *
 * Both product checkouts are DIRECT charges on the seller's CONNECTED account
 * (see api/{products,blocks}/[id]/checkout — `{ stripeAccount }`). A session
 * created on a connected account can ONLY be retrieved with that same account
 * context — retrieving it on the platform returns "No such checkout.session"
 * (resource_missing, 404). So the first job here is to resolve which connected
 * account the session belongs to, THEN retrieve it with that context.
 *
 * Two product shapes land here:
 *   - Block products (`&block=<id>`): no Purchase row exists — resolve the
 *     seller + download details from the Block itself.
 *   - Legacy Product model: a Purchase row keyed by stripeSessionId carries
 *     the seller + details, and gets marked completed here.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id")
    const blockId = request.nextUrl.searchParams.get("block")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Resolve the connected account + product details BEFORE touching Stripe,
    // so we can retrieve the session on the right account.
    let stripeAccount: string | null = null
    let details: {
      productTitle: string
      downloadUrl?: string
      downloadName?: string
      sellerUsername: string
    }
    let purchaseToComplete: { id: string; status: string; buyerEmail: string } | null = null

    if (blockId) {
      // ── Block product path (no Purchase row) ──
      const block = await prisma.block.findUnique({
        where: { id: blockId },
        include: { user: { select: { username: true, stripeAccountId: true } } },
      })

      if (!block) {
        return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
      }

      stripeAccount = block.user.stripeAccountId
      const cfg = (block.config as Record<string, unknown>) || {}
      details = {
        productTitle: block.title,
        downloadUrl: typeof cfg.downloadUrl === "string" ? cfg.downloadUrl : undefined,
        downloadName: typeof cfg.downloadName === "string" ? cfg.downloadName : undefined,
        sellerUsername: block.user.username,
      }
    } else {
      // ── Legacy Product path (Purchase row keyed by stripeSessionId) ──
      const purchase = await prisma.purchase.findUnique({
        where: { stripeSessionId: sessionId },
        include: {
          product: {
            select: {
              title: true,
              downloadUrl: true,
              downloadName: true,
              user: { select: { username: true, stripeAccountId: true } },
            },
          },
        },
      })

      if (!purchase) {
        return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
      }

      stripeAccount = purchase.product.user.stripeAccountId
      details = {
        productTitle: purchase.product.title,
        downloadUrl: purchase.product.downloadUrl ?? undefined,
        downloadName: purchase.product.downloadName ?? undefined,
        sellerUsername: purchase.product.user.username,
      }
      purchaseToComplete = {
        id: purchase.id,
        status: purchase.status,
        buyerEmail: purchase.buyerEmail,
      }
    }

    // Retrieve the session on the SAME connected account it was created on.
    const session = await stripe.checkout.sessions.retrieve(
      sessionId,
      stripeAccount ? { stripeAccount } : undefined
    )

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    // Integrity: for block products the caller supplies the blockId, so make
    // sure the paid session actually belongs to THIS block before handing over
    // the download (stops a paid session from one product unlocking another).
    if (blockId && session.metadata?.blockId !== blockId) {
      console.error(
        `[purchase-verify] session ${sessionId} metadata.blockId=${session.metadata?.blockId} != ${blockId}`
      )
      return NextResponse.json({ error: "Session does not match product" }, { status: 403 })
    }

    // Legacy Product path: mark the pending Purchase completed.
    if (purchaseToComplete && purchaseToComplete.status !== "completed") {
      await prisma.purchase.update({
        where: { id: purchaseToComplete.id },
        data: {
          status: "completed",
          buyerEmail: session.customer_details?.email || purchaseToComplete.buyerEmail,
        },
      })
    }

    return NextResponse.json(details)
  } catch (error) {
    console.error("Verify purchase error:", error)
    return NextResponse.json(
      { error: "Failed to verify purchase" },
      { status: 500 }
    )
  }
}
