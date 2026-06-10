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
      return null;
    }

    // First, try to find user by clerkId (fastest)
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (user) {
      return {
        id: user.id,
        clerkId: userId,
        email: user.email,
        username: user.username,
        name: user.name,
        image: user.image,
        subscriptionStatus: user.subscriptionStatus,
        pageStatus: user.pageStatus,
        onboarded: user.onboarded,
      };
    }

    // User not in DB yet, fetch from Clerk and create
    const clerkUser = await currentUser();

    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    // Check if user exists by email (might be from old auth system)
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      // User exists but without clerkId - update it
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkId: userId,
          image: clerkUser.imageUrl,
        }
      });

      return {
        id: user.id,
        clerkId: userId,
        email: user.email,
        username: user.username,
        name: user.name,
        image: user.image,
        subscriptionStatus: user.subscriptionStatus,
        pageStatus: user.pageStatus,
        onboarded: user.onboarded,
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
    } catch (createError: any) {
        if (createError.code === 'P2002') {
          // Race condition: another request already created the user
          user = await prisma.user.findUnique({ where: { clerkId: userId } });
          if (!user) {
            user = await prisma.user.findUnique({ where: { email: email } });
          }
          if (!user) {
            throw new Error("User creation failed and retry fetch failed");
          }
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
      onboarded: user.onboarded,
    };
  } catch (error: any) {
    console.error("[clerk-auth] Error in getCurrentUser:", error.message);
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
