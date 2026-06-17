import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",  // Clerk sign-in routes
  "/join(.*)",   // Clerk sign-up routes (replaces /register)
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/privacy",
  "/terms",
  "/api/stripe/webhook",  // Stripe webhook endpoint (correct path)
  "/api/track-click",
  "/api/health",
  "/api/ai/agent",        // Public AI agent for public profiles
  "/api/social/youtube",  // YouTube social card (no auth needed)
  "/api/social/podcast",  // Podcast social card (no auth needed)
  "/api/social/twitch",   // Twitch social card (no auth needed)
  "/api/social-proof",    // Public social proof feed for profiles
  "/api/contact",         // Public contact form submissions
  "/:username",
  "/preview/:username",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Only inject x-pathname for dashboard routes that read it. Propagating
  // request headers via NextResponse.next({ request }) emits a middleware
  // rewrite that commits the HTTP status to 200, which prevents notFound()
  // on public profile pages from returning a real 404.
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
