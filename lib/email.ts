/**
 * Transactional email — account-level emails sent through Resend.
 *
 * Profile-scoped sends (vault unlock codes, contact-form relays) live in
 * their own API routes; this module is for emails the AUTH layer triggers,
 * where a throw would bubble into Better Auth and fail the signup or the
 * resend endpoint. Every sender here catches internally and logs instead —
 * a Resend outage must never block account creation.
 */

import { Resend } from "resend"
import { trackServer } from "@/lib/analytics-server"

const FROM = "Paytree <noreply@paytree.to>"

// User-controlled values (name) go into HTML — escape them.
function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
}: {
  to: string
  name: string | null | undefined
  verificationUrl: string
}): Promise<void> {
  const firstName = (name || "").trim().split(/\s+/)[0]
  const greeting = firstName ? `Hey ${escapeHtml(firstName)},` : "Hey,"

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Verify your email — Paytree",
      html: `
        <div style="background:#030303;padding:24px 12px;">
          <div style="background:#080808;padding:40px;border-radius:12px;font-family:monospace;max-width:480px;margin:0 auto;">
            <div style="color:#00ff88;font-size:20px;font-weight:600;margin-bottom:8px;">Paytree</div>
            <div style="color:#888;font-size:13px;margin-bottom:32px;">Email verification</div>
            <div style="color:#e0e0e0;font-size:14px;line-height:1.6;margin-bottom:28px;">
              ${greeting} verify your email to secure your account and unlock all features.
            </div>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${verificationUrl}" style="display:inline-block;background:#00ff88;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;padding:14px 32px;">
                Verify email &rarr;
              </a>
            </div>
            <div style="color:#444;font-size:12px;line-height:1.6;">
              If you didn't create a Paytree account, ignore this email.
            </div>
          </div>
        </div>
      `,
    })
    console.log(`[email] verification sent to=${to}`)
    await trackServer("send_verification_email")
  } catch (err) {
    console.error(
      `[email] verification send FAILED to=${to} err=${err instanceof Error ? err.message : String(err)}`
    )
  }
}
