import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint.
 *
 * Public response is intentionally minimal ({ ok: true }) so it cannot be used
 * to fingerprint infrastructure, environment configuration, or secrets.
 *
 * Detailed diagnostics are returned ONLY when a valid `x-health-secret` header
 * matching HEALTH_CHECK_SECRET is supplied. If HEALTH_CHECK_SECRET is not set,
 * detailed diagnostics are never exposed. Even when authorized, the response
 * contains presence booleans / status only — never raw secret values, price
 * IDs, or raw error messages.
 */
export async function GET(req: Request) {
  const healthSecret = process.env.HEALTH_CHECK_SECRET;
  const provided = req.headers.get("x-health-secret");
  const authorized = !!healthSecret && provided === healthSecret;

  // Minimal, safe public response by default.
  if (!authorized) {
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  // ---- Authorized: detailed diagnostics (presence/status only) ----
  const checks: Record<string, unknown> & {
    database: { status: string }
    stripe: { status: string; missing?: string[] }
    auth: { status: string; missing?: string[] }
  } = {
    timestamp: new Date().toISOString(),
    status: "checking...",
    database: { status: "unknown" },
    stripe: { status: "unknown" },
    auth: { status: "unknown" },
    env: { status: "unknown" },
  };

  try {
    // Check database connection (do not expose raw error details)
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "✅ connected" };
    } catch {
      checks.database = { status: "❌ error" };
    }

    // Check Stripe configuration — presence booleans only
    const stripeConfig = {
      secretKey: !!process.env.STRIPE_SECRET_KEY,
      publicKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      productId: !!process.env.STRIPE_PRODUCT_ID,
      priceId: !!process.env.STRIPE_PRICE_ID,
    };
    const stripeMissing = Object.entries(stripeConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);
    checks.stripe = stripeMissing.length === 0
      ? { status: "✅ configured" }
      : { status: "⚠️ incomplete", missing: stripeMissing };

    // Check Better Auth configuration — presence booleans only
    const authConfig = {
      secret: !!process.env.BETTER_AUTH_SECRET,
      baseUrl: !!(process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL),
    };
    const authMissing = Object.entries(authConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);
    checks.auth = authMissing.length === 0
      ? { status: "✅ configured" }
      : { status: "❌ incomplete", missing: authMissing };

    // Other environment variables — presence booleans only
    checks.env = {
      databaseUrl: !!process.env.DATABASE_URL,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    };

    // Overall status
    const hasErrors =
      checks.database.status.includes("❌") ||
      checks.stripe.status.includes("❌") ||
      checks.auth.status.includes("❌");

    const hasWarnings = checks.stripe.status.includes("⚠️");

    checks.status = hasErrors ? "❌ errors found" :
                    hasWarnings ? "⚠️ warnings" :
                    "✅ all systems ready";

    return NextResponse.json(checks, {
      status: hasErrors ? 500 : 200,
      headers: {
        'Cache-Control': 'no-store',
      }
    });

  } catch {
    // Never leak raw error details, even on the authorized path.
    return NextResponse.json(
      { status: "❌ error" },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
