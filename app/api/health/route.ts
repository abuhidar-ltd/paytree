import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint - verifies all configurations
 */
export async function GET() {
  const checks: any = {
    timestamp: new Date().toISOString(),
    status: "checking...",
    database: { status: "unknown" },
    stripe: { status: "unknown" },
    auth: { status: "unknown" },
    env: { status: "unknown" },
  };

  try {
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "✅ connected" };
    } catch (dbError: any) {
      checks.database = { 
        status: "❌ error", 
        error: dbError.message 
      };
    }

    // Check Stripe configuration
    const stripeConfig = {
      secretKey: !!process.env.STRIPE_SECRET_KEY,
      publicKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      productId: !!process.env.STRIPE_PRODUCT_ID,
      priceId: !!process.env.STRIPE_PRICE_ID,
    };
    
    const stripeMissing = Object.entries(stripeConfig)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    
    if (stripeMissing.length === 0) {
      checks.stripe = { 
        status: "✅ configured",
        priceId: process.env.STRIPE_PRICE_ID 
      };
    } else {
      checks.stripe = { 
        status: "⚠️ incomplete", 
        missing: stripeMissing,
        hint: stripeMissing.includes('priceId') ? 
          "Add STRIPE_PRICE_ID=price_1Sg58FAbaUyr5xFPdsHorEj0 to .env" : null
      };
    }

    // Check Better Auth configuration
    const authConfig = {
      secret: !!process.env.BETTER_AUTH_SECRET,
      baseUrl: !!(process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL),
    };

    const authMissing = Object.entries(authConfig)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (authMissing.length === 0) {
      checks.auth = { status: "✅ configured" };
    } else {
      checks.auth = {
        status: "❌ incomplete",
        missing: authMissing
      };
    }

    // Check other environment variables
    checks.env = {
      databaseUrl: !!process.env.DATABASE_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    };

    // Overall status
    const hasErrors =
      checks.database.status.includes("❌") ||
      checks.stripe.status.includes("❌") ||
      checks.auth.status.includes("❌");
    
    const hasWarnings = 
      checks.stripe.status.includes("⚠️");

    checks.status = hasErrors ? "❌ errors found" : 
                    hasWarnings ? "⚠️ warnings" : 
                    "✅ all systems ready";

    return NextResponse.json(checks, { 
      status: hasErrors ? 500 : 200,
      headers: {
        'Cache-Control': 'no-store',
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      status: "❌ error",
      error: error.message,
      checks
    }, { status: 500 });
  }
}
