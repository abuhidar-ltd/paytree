import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// GET - Verify a purchase and return download details
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id")
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }
    
    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }
    
    // Get purchase details
    const purchase = await prisma.purchase.findUnique({
      where: { stripeSessionId: sessionId },
      include: {
        product: {
          select: {
            title: true,
            downloadUrl: true,
            downloadName: true,
            user: {
              select: { username: true },
            },
          },
        },
      },
    })
    
    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
    }
    
    // Update purchase status if needed
    if (purchase.status !== "completed") {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { 
          status: "completed",
          buyerEmail: session.customer_details?.email || purchase.buyerEmail,
        },
      })
    }
    
    return NextResponse.json({
      productTitle: purchase.product.title,
      downloadUrl: purchase.product.downloadUrl,
      downloadName: purchase.product.downloadName,
      sellerUsername: purchase.product.user.username,
    })
  } catch (error) {
    console.error("Verify purchase error:", error)
    return NextResponse.json(
      { error: "Failed to verify purchase" },
      { status: 500 }
    )
  }
}
