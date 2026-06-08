import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { name, email, message, creatorUsername } = body

    if (!name || !email || !message || !creatorUsername) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      )
    }

    const creator = await prisma.user.findUnique({
      where: { username: creatorUsername },
      select: { email: true, name: true },
    })

    if (!creator || !creator.email) {
      return NextResponse.json(
        { error: "Creator not found." },
        { status: 404 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: "Paytree <noreply@paytree.to>",
      to: creator.email,
      subject: `New message from ${name} via your Paytree`,
      html: `
        <div style="background:#080808;padding:40px;border-radius:12px;font-family:monospace;max-width:480px;margin:0 auto;">
          <div style="color:#00ff88;font-size:20px;font-weight:600;margin-bottom:8px;">Paytree</div>
          <div style="color:#888;font-size:13px;margin-bottom:32px;">New contact form message</div>
          <div style="background:#111;border:0.5px solid rgba(255,255,255,0.08);border-radius:10px;padding:24px;margin-bottom:24px;">
            <div style="color:#444;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">From</div>
            <div style="color:#e0e0e0;font-size:14px;margin-bottom:16px;">${name} &lt;${email}&gt;</div>
            <div style="color:#444;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Message</div>
            <div style="color:#e0e0e0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div>
          </div>
          <div style="color:#444;font-size:12px;line-height:1.6;">
            Reply directly to ${email} to respond.
          </div>
        </div>
      `,
      replyTo: email,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    )
  }
}
