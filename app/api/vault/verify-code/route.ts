import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const verifyCodeSchema = z.object({
  email: z.string().email(),
  linkId: z.string().min(1),
  ownerId: z.string().min(1),
  code: z.string().length(6),
})

/**
 * POST /api/vault/verify-code
 *
 * Verifies the 6-digit code and unlocks the link for the email.
 * Also captures the email in the Audience table.
 *
 * Returns the locked content on success.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, linkId, ownerId, code } = verifyCodeSchema.parse(body)

    const normalizedEmail = email.toLowerCase()

    // Find the token
    const unlockToken = await prisma.linkUnlockToken.findUnique({
      where: { linkId_email: { linkId, email: normalizedEmail } },
    })

    if (!unlockToken) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 404 }
      )
    }

    // Check expiration
    if (new Date() > unlockToken.expiresAt) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 410 }
      )
    }

    // Check code
    if (unlockToken.token !== code) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      )
    }

    // Mark as verified
    await prisma.linkUnlockToken.update({
      where: { id: unlockToken.id },
      data: { verified: true },
    })

    // Capture email in Audience (upsert)
    await prisma.audience.upsert({
      where: { userId_email: { userId: ownerId, email: normalizedEmail } },
      create: {
        userId: ownerId,
        email: normalizedEmail,
        source: "locked_link",
        vaultItemId: linkId,
      },
      update: {
        // Update source if it was previously from a different source
        vaultItemId: linkId,
      },
    })

    // Get the link content to return
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: {
        url: true,
        downloadUrl: true,
        downloadName: true,
        vaultContent: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Email verified! Content unlocked.",
      content: {
        url: link?.url || undefined,
        downloadUrl: link?.downloadUrl || undefined,
        downloadName: link?.downloadName || undefined,
        vaultContent: link?.vaultContent || undefined,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }

    console.error("Verify code error:", error)
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    )
  }
}
