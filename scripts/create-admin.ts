import "dotenv/config"
import { prisma } from "../lib/prisma"
import { auth } from "../lib/auth"

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const username = process.env.ADMIN_USERNAME || "admin"

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.")
    console.error("   Example: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='<strong-password>' npm run seed:admin")
    process.exitCode = 1
    return
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      const updated = await prisma.user.update({
        where: { email },
        data: {
          subscriptionStatus: "active",
          subscriptionPlan: "pro",
          subscriptionInterval: "yearly",
          name: "Admin User",
        },
      })
      console.log("✅ Updated existing admin user to Pro status")
      console.log("Email:", email)
      console.log("Username:", updated.username)
      return
    }

    // Create via Better Auth (handles password hashing + Account row)
    await auth.api.signUpEmail({
      body: { email, password, name: "Admin User" },
    })

    const adminUser = await prisma.user.update({
      where: { email },
      data: {
        username,
        bio: "Administrator account with full Pro access",
        subscriptionStatus: "active",
        subscriptionPlan: "pro",
        subscriptionInterval: "yearly",
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

    console.log("✅ Admin user created successfully!")
    console.log("Email:", email)
    console.log("Username:", adminUser.username)
    console.log("Status: Pro (Yearly)")
    console.log("\nLog in using the credentials you provided via ADMIN_EMAIL / ADMIN_PASSWORD.")
  } catch (error) {
    console.error("Error creating admin user:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
