import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for accent color
const accentColorSchema = z.object({
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Invalid hex color format",
  }),
});

// GET - Get current user's accent color
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { accentColor: true },
    });

    return NextResponse.json({
      accentColor: dbUser?.accentColor || "#00ff88",
    });
  } catch (error) {
    console.error("[accent-color] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accent color" },
      { status: 500 }
    );
  }
}

// PATCH - Update user's accent color
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = accentColorSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { accentColor } = validationResult.data;

    // Update user's accent color
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { accentColor },
      select: { accentColor: true },
    });

    return NextResponse.json({
      accentColor: updatedUser.accentColor,
      message: "Accent color updated successfully",
    });
  } catch (error) {
    console.error("[accent-color] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update accent color" },
      { status: 500 }
    );
  }
}
