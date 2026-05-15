import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",  // Allow all Clerk login routes
  "/register(.*)",  // Allow all Clerk register routes
  "/sign-in(.*)",  // Clerk sign-in routes
  "/sign-up(.*)",  // Clerk sign-up routes
  "/pricing",
  "/privacy",
  "/terms",
  "/api/stripe/webhook",  // Stripe webhook endpoint (correct path)
  "/api/track-click",
  "/api/health",
  "/api/ai/agent",      // Public AI agent for public profiles
  "/:username",
  "/preview/:username",
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
