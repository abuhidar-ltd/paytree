import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import { Resend } from "resend"

const sendCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  linkId: z.string().min(1).optional(),
  blockId: z.string().min(1).optional(),
  ownerId: z.string().min(1, "Owner ID required"),
}).refine((d) => d.linkId || d.blockId, {
  message: "linkId or blockId required",
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, linkId, blockId, ownerId } = sendCodeSchema.parse(body)

    let itemId: string
    let itemTitle: string

    if (linkId) {
      const link = await prisma.link.findFirst({
        where: { id: linkId, userId: ownerId, isEmailLocked: true },
        select: { id: true, title: true },
      })
      if (!link) {
        return NextResponse.json({ error: "Locked link not found" }, { status: 404 })
      }
      itemId = link.id
      itemTitle = link.title
    } else {
      const block = await prisma.block.findFirst({
        where: { id: blockId!, userId: ownerId, lockType: "email" },
        select: { id: true, title: true },
      })
      if (!block) {
        return NextResponse.json({ error: "Locked block not found" }, { status: 404 })
      }
      itemId = block.id
      itemTitle = block.title
    }

    // Check if already verified
    const existingToken = await prisma.linkUnlockToken.findUnique({
      where: { linkId_email: { linkId: itemId, email: email.toLowerCase() } },
    })

    if (existingToken?.verified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Email already verified for this content.",
      })
    }

    const code = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Use raw query to bypass FK constraint when itemId is a blockId
    await prisma.$executeRaw`
      INSERT INTO "LinkUnlockToken" ("id", "linkId", "email", "token", "expiresAt", "verified")
      VALUES (${crypto.randomUUID()}, ${itemId}, ${email.toLowerCase()}, ${code}, ${expiresAt}, false)
      ON CONFLICT ("linkId", "email")
      DO UPDATE SET "token" = ${code}, "expiresAt" = ${expiresAt}, "verified" = false
    `

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: "Paytree <noreply@paytree.to>",
      to: email,
      subject: `Your unlock code for "${itemTitle}"`,
      html: `
        <div style="background:#080808;padding:40px;border-radius:12px;font-family:monospace;max-width:480px;margin:0 auto;">
          <div style="color:#00ff88;font-size:20px;font-weight:600;margin-bottom:8px;">PayTree</div>
          <div style="color:#888;font-size:13px;margin-bottom:32px;">Vault unlock code</div>
          <div style="color:#e0e0e0;font-size:14px;margin-bottom:24px;">
            Here is your code to unlock <strong style="color:#fff;">${itemTitle}</strong>
          </div>
          <div style="background:#111;border:0.5px solid rgba(0,255,136,0.2);border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
            <div style="color:#00ff88;font-size:36px;font-weight:700;letter-spacing:0.15em;">${code}</div>
            <div style="color:#444;font-size:12px;margin-top:8px;">Expires in 10 minutes</div>
          </div>
          <div style="color:#444;font-size:12px;line-height:1.6;">
            If you didn't request this code, you can safely ignore this email.
          </div>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }

    console.error("Send code error:", error)
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    )
  }
}
