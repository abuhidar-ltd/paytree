import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { getUserFeatures } from "@/lib/plans"

/**
 * POST /api/ai/generate-bio
 *
 * Uses OpenAI to generate a professional bio based on the user's
 * profile data, links, and an optional prompt/tone.
 *
 * Body: { tone?: "professional" | "casual" | "bold" | "minimal", prompt?: string }
 *
 * Saves the generated bio in BioHistory for versioning.
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check Pro plan
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        links: {
          where: { enabled: true, isVaultItem: false },
          select: { title: true, url: true, type: true },
          take: 10,
        },
        socialLinks: {
          where: { enabled: true },
          select: { platform: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const features = getUserFeatures(user)
    if (!features.hasAiFeatures) {
      return NextResponse.json(
        { error: "AI Bio Generator requires a Pro plan.", code: "UPGRADE_REQUIRED" },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const tone = body.tone || "professional"
    const customPrompt = body.prompt || ""

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Set OPENAI_API_KEY in .env" },
        { status: 500 }
      )
    }

    // Build context about the user
    const linkSummary = user.links
      .map((l) => `${l.title} (${l.type})`)
      .join(", ")
    const platforms = user.socialLinks.map((s) => s.platform).join(", ")

    const systemPrompt = `You are a professional bio writer for a link-in-bio platform called PayTree. Write short, punchy bios (2-3 sentences max, under 160 characters preferred). The bio should feel authentic and engaging.`

    const userPrompt = `Write a ${tone} bio for:
Name: ${user.name || user.username}
Current bio: ${user.bio || "(none)"}
Links: ${linkSummary || "(none)"}
Social platforms: ${platforms || "(none)"}
${customPrompt ? `\nAdditional instructions: ${customPrompt}` : ""}

Return ONLY the bio text, nothing else.`

    // Call OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.text()
      console.error("[ai/generate-bio] OpenAI error:", err)
      return NextResponse.json({ error: "Failed to generate bio" }, { status: 502 })
    }

    const openaiData = await openaiRes.json()
    const generatedBio = openaiData.choices?.[0]?.message?.content?.trim()

    if (!generatedBio) {
      return NextResponse.json({ error: "No bio generated" }, { status: 500 })
    }

    // Save to history
    await prisma.bioHistory.create({
      data: {
        userId: user.id,
        bio: generatedBio,
        prompt: `tone=${tone}${customPrompt ? ` | ${customPrompt}` : ""}`,
      },
    })

    return NextResponse.json({
      success: true,
      bio: generatedBio,
      tone,
    })
  } catch (error: any) {
    console.error("[ai/generate-bio] Error:", error.message)
    return NextResponse.json({ error: "Failed to generate bio" }, { status: 500 })
  }
}
