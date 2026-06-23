import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { secret } = await req.json()

    // Simple security check
    if (secret !== "create-admin-2024") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = "admin@paytree.com"
    const username = "admin"
    const password = "admin123"

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      const updated = await prisma.user.update({
        where: { email },
        data: {
          subscriptionStatus: "active",
          subscriptionPlan: "yearly",
          name: "Admin User",
        },
      })

      return NextResponse.json({
        success: true,
        message: "Admin user updated to Pro status",
        user: {
          email: updated.email,
          username: updated.username,
          status: updated.subscriptionStatus,
        },
      })
    }

    // Create via Better Auth — handles password hashing + Account row
    await auth.api.signUpEmail({
      body: { email, password, name: "Admin User" },
    })

    // Upgrade to Pro and apply admin defaults
    const adminUser = await prisma.user.update({
      where: { email },
      data: {
        username,
        bio: "Administrator with full Pro access",
        subscriptionStatus: "active",
        subscriptionPlan: "yearly",
        theme: "dark",
        primaryColor: "#3b82f6",
        backgroundColor: "#0f172a",
        backgroundStyle: "mesh",
        buttonStyle: "3d",
        accentColor: "#00ff88",
        textColor: "#ffffff",
        socialIconPosition: "bottom",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      credentials: {
        email: adminUser.email,
        username: adminUser.username,
        password: "admin123",
        status: "Pro (Yearly)",
      },
    })
  } catch (error: any) {
    console.error("Error creating admin user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create admin user" },
      { status: 500 }
    )
  }
}
