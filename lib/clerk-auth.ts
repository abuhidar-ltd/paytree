/**
 * Clerk Authentication Utilities for Paytree
 * 
 * This replaces the old NextAuth implementation with Clerk.
 * Optimized for speed and reliability.
 */

import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Get the current authenticated user from Clerk
 * and sync with our database
 */
export async function getCurrentUser() {
  try {
    const { userId } = await clerkAuth();
    
    if (!userId) {
      console.log("[clerk-auth] No userId found");
      return null;
    }

    console.log("[clerk-auth] Got Clerk userId:", userId);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/1aa88823-29aa-4541-a24e-c599d977b99e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clerk-auth.ts:query',message:'About to query prisma',data:{prismaExists:!!prisma,prismaKeys:Object.keys(prisma||{}).slice(0,10)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5-H7'})}).catch(()=>{});
    // #endregion

    // First, try to find user by clerkId (fastest)
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (user) {
      console.log("[clerk-auth] Found user by clerkId:", user.id);
      return {
        id: user.id,
        clerkId: userId,
        email: user.email,
        username: user.username,
        name: user.name,
        image: user.image,
        subscriptionStatus: user.subscriptionStatus,
        pageStatus: user.pageStatus,
      };
    }

    // User not in DB yet, fetch from Clerk and create
    console.log("[clerk-auth] User not in DB, fetching from Clerk...");
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      console.error("[clerk-auth] Clerk user not found despite having userId");
      return null;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error("[clerk-auth] No email found for Clerk user");
      return null;
    }

    // Check if user exists by email (might be from old auth system)
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      // User exists but without clerkId - update it
      console.log("[clerk-auth] User exists by email, updating clerkId...");
      
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkId: userId,
          image: clerkUser.imageUrl,
        }
      });

      console.log("[clerk-auth] Updated existing user:", user.id);
      
      return {
        id: user.id,
        clerkId: userId,
        email: user.email,
        username: user.username,
        name: user.name,
        image: user.image,
        subscriptionStatus: user.subscriptionStatus,
        pageStatus: user.pageStatus,
      };
    }

    // Generate unique username
    const baseUsername = clerkUser.username || clerkUser.id.toLowerCase().substring(0, 15);
    let username = baseUsername;
    let counter = 1;
    
    // Check if username exists and make it unique
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
      if (counter > 100) {
        username = clerkUser.id.toLowerCase();
        break;
      }
    }

    console.log("[clerk-auth] Creating new user with username:", username);

    // Create user (with race condition handling)
    try {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          username: username,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || username,
          image: clerkUser.imageUrl,
          subscriptionStatus: 'free',
          pageStatus: 'draft',
        }
      });

      console.log("[clerk-auth] Created new user:", user.id);
    } catch (createError: any) {
        // Handle race condition: another request already created the user
        if (createError.code === 'P2002') {
          console.log("[clerk-auth] Race condition detected, fetching existing user...");
          
          // Try to fetch by clerkId first
        user = await prisma.user.findUnique({ where: { clerkId: userId } });
        
        // If still not found, try by email
        if (!user) {
          user = await prisma.user.findUnique({ where: { email: email } });
        }
        
        if (!user) {
          throw new Error("User creation failed and retry fetch failed");
        }
        
        console.log("[clerk-auth] Retrieved user after race condition:", user.id);
      } else {
        throw createError;
      }
    }

    return {
      id: user.id,
      clerkId: userId,
      email: user.email,
      username: user.username,
      name: user.name,
      image: user.image,
      subscriptionStatus: user.subscriptionStatus,
      pageStatus: user.pageStatus,
    };
  } catch (error: any) {
    console.error("[clerk-auth] Error in getCurrentUser:", error.message);
    console.error("[clerk-auth] Full error:", error);
    return null;
  }
}

/**
 * Get current user ID (shorthand)
 */
export async function getUserId() {
  const { userId } = await clerkAuth();
  return userId;
}

/**
 * Require authentication (throw if not authenticated)
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}
