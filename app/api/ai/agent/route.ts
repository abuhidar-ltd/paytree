import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFeatures } from "@/lib/plans"

export async function POST(req: Request) {
  try {
    const { username, messages } = await req.json()

    if (!username || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        bio: true,
        aiAgentEnabled: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        socialLinks: {
          where: { enabled: true },
          select: { platform: true, url: true },
          orderBy: { order: "asc" },
        },
        links: {
          where: { enabled: true, isVaultItem: false },
          select: { title: true, url: true, type: true },
          orderBy: { order: "asc" },
          take: 20,
        },
        products: {
          where: { enabled: true },
          select: { title: true, description: true, price: true, currency: true },
        },
        drops: {
          where: { enabled: true },
          select: { title: true, description: true, dropAt: true },
          orderBy: { dropAt: "asc" },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    const features = getUserFeatures(user)
    if (!features.hasAiFeatures) {
      return NextResponse.json({ error: "AI agent not available" }, { status: 403 })
    }

    if (!user.aiAgentEnabled) {
      return NextResponse.json({ error: "AI agent is disabled" }, { status: 403 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 })
    }

    const vaultItems = await prisma.link.findMany({
      where: { userId: user.id, isVaultItem: true, isEmailLocked: true, enabled: true },
      select: { title: true },
    })

    const name = user.name || username

    const socialList = user.socialLinks.length
      ? user.socialLinks.map((s) => `- ${s.platform}: ${s.url}`).join("\n")
      : "(none)"

    const linksList = user.links.length
      ? user.links.map((l) => `- ${l.title}${l.url ? ` → ${l.url}` : ""}`).join("\n")
      : "(none)"

    const productsList = user.products.length
      ? user.products
          .map(
            (p) =>
              `- ${p.title}: $${(p.price / 100).toFixed(2)}${p.description ? ` — ${p.description}` : ""}`,
          )
          .join("\n")
      : "(none)"

    const dropsList = user.drops.length
      ? user.drops
          .map((d) => {
            const dropDate = new Date(d.dropAt)
            const now = new Date()
            const hoursLeft = Math.round((dropDate.getTime() - now.getTime()) / 3_600_000)
            const timeLabel =
              hoursLeft < 0
                ? "already dropped"
                : hoursLeft < 24
                ? `drops in ${hoursLeft}h — very soon!`
                : `drops ${dropDate.toLocaleDateString()}`
            return `- ${d.title} (${timeLabel})${d.description ? `: ${d.description}` : ""}`
          })
          .join("\n")
      : "(none)"

    const vaultList = vaultItems.length
      ? vaultItems.map((v) => `- ${v.title} (unlock with email)`).join("\n")
      : "(none)"

    const isNewSession = messages.length === 1

    const systemPrompt = `You are ${name}'s personal AI sales assistant embedded on their Paytree page. Visitors are landing here to learn about ${name} and potentially buy from them.

YOUR JOB:
- Understand what the visitor wants and match it to ${name}'s actual offerings
- Be warm, confident, and direct — like a knowledgeable friend, not a salesperson
- Create genuine excitement around products, drops, and exclusive content
- Handle objections honestly ("is it worth it?", "what do I get?")
- Always end every response with ONE clear, specific next step
- If drops are coming soon, build urgency around the deadline
- If someone is unsure, ask what they're looking for so you can guide them better
- Never invent information — only discuss what's listed below
- Keep responses under 4 sentences (be concise but warm)

CREATOR PROFILE:
Name: ${name}
Bio: ${user.bio || "(none)"}

SOCIAL PROFILES:
${socialList}

LINKS & CONTENT:
${linksList}

PRODUCTS FOR SALE:
${productsList}

UPCOMING DROPS:
${dropsList}

EXCLUSIVE VAULT CONTENT (email-gated):
${vaultList}

If someone asks about buying a product, tell them the exact name and price, and guide them to scroll down and tap the card to purchase — payments go directly to ${name} with 0% platform fees.
If someone asks about the vault, explain they just need to enter their email to unlock it — it's free.
If drops are listed, create excitement around the exclusivity and timing.
If someone asks how to follow or connect, direct them to ${name}'s social profiles above.`

    // Track sessions and messages asynchronously (don't block the response)
    prisma.user
      .update({
        where: { id: user.id },
        data: {
          aiChatMessages: { increment: 1 },
          ...(isNewSession && { aiChatSessions: { increment: 1 } }),
        },
      })
      .catch(() => {
        // Non-critical — don't fail the request if tracking fails
      })

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        system: systemPrompt,
        messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 1024,
        stream: true,
      }),
    })

    if (!anthropicRes.ok || !anthropicRes.body) {
      console.error("[ai/agent] Anthropic error:", await anthropicRes.text().catch(() => "unknown"))
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const upstreamReader = anthropicRes.body.getReader()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await upstreamReader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue
              const data = line.slice(6).trim()
              try {
                const parsed = JSON.parse(data)
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.type === "text_delta" &&
                  parsed.delta.text
                ) {
                  controller.enqueue(encoder.encode(parsed.delta.text))
                }
              } catch {
                // Skip malformed SSE lines
              }
            }
          }
        } catch {
          // Stream ended unexpectedly
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "unknown"
    console.error("[ai/agent] Error:", msg)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
