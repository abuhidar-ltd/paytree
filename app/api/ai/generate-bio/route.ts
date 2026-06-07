import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/ai/generate-bio
 *
 * Generates 3 short bio variations via Anthropic Claude Haiku 4.5.
 * Available to all plans. Rate-limited to 10 generations per user per UTC day.
 *
 * Body: { currentBio?: string, name?: string, username?: string, niche?: string }
 * Returns: { bios: string[], remaining: number }
 */
const DAILY_LIMIT = 10

interface AnthropicTextBlock { type: "text"; text: string }
interface AnthropicResponse { content?: AnthropicTextBlock[] }

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 503 },
      )
    }

    // ── Rate limit: count today's generations ────────────────────
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    const usedToday = await prisma.bioHistory.count({
      where: {
        userId: currentUser.id,
        createdAt: { gte: startOfDay },
      },
    })

    if (usedToday >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `You've used all ${DAILY_LIMIT} AI generations today. Try again tomorrow.`,
          code: "RATE_LIMITED",
          remaining: 0,
        },
        { status: 429 },
      )
    }

    // ── Inputs ───────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const currentBio: string = typeof body.currentBio === "string" ? body.currentBio.slice(0, 500) : ""
    const name: string = typeof body.name === "string" ? body.name.slice(0, 80) : ""
    const username: string = typeof body.username === "string" ? body.username.slice(0, 60) : ""
    const niche: string = typeof body.niche === "string" ? body.niche.slice(0, 120) : ""

    const systemPrompt =
      "You are a professional copywriter specializing in creator bio pages. " +
      "Write compelling, authentic bios that convert visitors."

    const userPrompt = `Write 3 different bio variations for a creator with these details:
Name: ${name || "(unknown)"}
Username: @${username || "creator"}
Current bio: ${currentBio || "none"}
Niche/focus: ${niche || "content creator"}

Requirements:
- Each bio max 160 characters
- Conversational and authentic tone
- Mention what they do and what value they provide
- No generic phrases like "passionate about"
- Format as JSON array: ["bio1", "bio2", "bio3"]
- Return ONLY the JSON array, nothing else`

    // ── Anthropic call ───────────────────────────────────────────
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown")
      console.error("[ai/generate-bio] Anthropic error:", errText)
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 },
      )
    }

    const data = (await res.json()) as AnthropicResponse
    const rawText = data.content?.find((b) => b.type === "text")?.text?.trim() ?? ""

    // Robust JSON extraction — accept code fences or raw array
    const arrayMatch = rawText.match(/\[[\s\S]*\]/)
    if (!arrayMatch) {
      console.error("[ai/generate-bio] No JSON array in model output:", rawText)
      return NextResponse.json({ error: "Failed to parse bios" }, { status: 500 })
    }

    let bios: unknown
    try {
      bios = JSON.parse(arrayMatch[0])
    } catch (e) {
      console.error("[ai/generate-bio] JSON parse failed:", e, arrayMatch[0])
      return NextResponse.json({ error: "Failed to parse bios" }, { status: 500 })
    }

    if (!Array.isArray(bios) || bios.length === 0) {
      return NextResponse.json({ error: "No bios generated" }, { status: 500 })
    }

    const cleanBios = bios
      .filter((b): b is string => typeof b === "string")
      .map((b) => b.trim())
      .filter((b) => b.length > 0)
      .slice(0, 3)

    if (cleanBios.length === 0) {
      return NextResponse.json({ error: "No valid bios generated" }, { status: 500 })
    }

    // ── Persist to history ───────────────────────────────────────
    const promptTag = niche ? `ai | niche=${niche}` : "ai"
    await prisma.bioHistory.createMany({
      data: cleanBios.map((bio) => ({
        userId: currentUser.id,
        bio,
        prompt: promptTag,
      })),
    })

    const remaining = Math.max(0, DAILY_LIMIT - usedToday - 1)
    return NextResponse.json({ bios: cleanBios, remaining })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[ai/generate-bio] Error:", message)
    return NextResponse.json({ error: "Failed to generate bio" }, { status: 500 })
  }
}
