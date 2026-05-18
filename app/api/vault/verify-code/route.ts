import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
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

    // Get the link content and creator info in parallel
    const [link, creator] = await Promise.all([
      prisma.link.findUnique({
        where: { id: linkId },
        select: {
          title: true,
          url: true,
          downloadUrl: true,
          downloadName: true,
          vaultContent: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: ownerId },
        select: { name: true, email: true, username: true },
      }),
    ])

    // Fire follow-up emails — non-blocking so unlock response isn't delayed
    if (link && creator) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to"
      const creatorName = creator.name || creator.username

      const contentSection = link.vaultContent
        ? `<div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:16px;margin-top:20px;font-family:monospace;font-size:13px;color:#e0e0e0;white-space:pre-wrap;">${link.vaultContent}</div>`
        : ""

      const actionButton = link.downloadUrl
        ? `<a href="${link.downloadUrl}" style="display:inline-block;padding:14px 28px;background:#00ff88;color:#080808;font-family:monospace;font-weight:bold;font-size:14px;text-decoration:none;border-radius:6px;margin-top:20px;">&#8595; ${link.downloadName || "Download your file"}</a>`
        : link.url
        ? `<a href="${link.url}" style="display:inline-block;padding:14px 28px;background:#00ff88;color:#080808;font-family:monospace;font-weight:bold;font-size:14px;text-decoration:none;border-radius:6px;margin-top:20px;">Access now →</a>`
        : ""

      Promise.all([
        // Delivery email to the unlocker
        resend.emails.send({
          from: "Paytree <noreply@paytree.to>",
          to: normalizedEmail,
          subject: "You're in — here's what's waiting for you",
          html: `
            <div style="background:#080808;padding:40px 32px;max-width:520px;margin:0 auto;">
              <div style="color:#00ff88;font-size:12px;font-family:monospace;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">${creatorName} sent you something</div>
              <div style="color:#ffffff;font-size:22px;font-weight:bold;font-family:monospace;margin-bottom:24px;">You just unlocked</div>
              <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:14px 16px;font-family:monospace;font-size:15px;color:#e0e0e0;">${link.title}</div>
              ${contentSection}
              ${actionButton}
              <hr style="border:none;border-top:1px solid #1a1a1a;margin:40px 0;" />
              <div style="color:#444;font-size:11px;font-family:monospace;">Delivered via Paytree · paytree.to</div>
            </div>
          `,
        }),
        // Notification email to the creator
        resend.emails.send({
          from: "Paytree <noreply@paytree.to>",
          to: creator.email,
          subject: "Someone unlocked your vault",
          html: `
            <div style="background:#080808;padding:40px 32px;max-width:520px;margin:0 auto;font-family:monospace;">
              <div style="color:#00ff88;font-size:20px;font-weight:bold;margin-bottom:24px;">Vault unlock</div>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="color:#555;font-size:12px;padding:10px 0;border-bottom:1px solid #1a1a1a;">Visitor</td>
                  <td style="color:#e0e0e0;font-size:13px;padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;">${normalizedEmail}</td>
                </tr>
                <tr>
                  <td style="color:#555;font-size:12px;padding:10px 0;border-bottom:1px solid #1a1a1a;">Item</td>
                  <td style="color:#e0e0e0;font-size:13px;padding:10px 0;border-bottom:1px solid #1a1a1a;text-align:right;">${link.title}</td>
                </tr>
                <tr>
                  <td style="color:#555;font-size:12px;padding:10px 0;">Time</td>
                  <td style="color:#e0e0e0;font-size:13px;padding:10px 0;text-align:right;">${new Date().toUTCString()}</td>
                </tr>
              </table>
              <a href="${appUrl}/dashboard/analytics" style="display:inline-block;padding:14px 28px;background:#00ff88;color:#080808;font-family:monospace;font-weight:bold;font-size:14px;text-decoration:none;border-radius:6px;margin-top:32px;">View your audience →</a>
              <hr style="border:none;border-top:1px solid #1a1a1a;margin:40px 0;" />
              <div style="color:#444;font-size:11px;">Paytree · paytree.to</div>
            </div>
          `,
        }),
      ]).catch(() => {})
    }

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
