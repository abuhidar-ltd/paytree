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

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 })
    }

    const vaultItems = await prisma.link.findMany({
      where: { userId: user.id, isVaultItem: true, isEmailLocked: true, enabled: true },
      select: { title: true },
    })

    const name = user.name || username

    const linksList = user.links
      .map((l) => `- ${l.title}${l.url ? ` → ${l.url}` : ""}`)
      .join("\n") || "(none)"

    const productsList = user.products
      .map((p) => `- ${p.title}: $${(p.price / 100).toFixed(2)}${p.description ? ` — ${p.description}` : ""}`)
      .join("\n") || "(none)"

    const dropsList = user.drops
      .map((d) => `- ${d.title} (drops ${new Date(d.dropAt).toLocaleDateString()})${d.description ? `: ${d.description}` : ""}`)
      .join("\n") || "(none)"

    const vaultList = vaultItems
      .map((v) => `- ${v.title} (email-gated)`)
      .join("\n") || "(none)"

    const systemPrompt = `You are ${name}'s personal AI assistant on their Paytree page. Help visitors find what they need and guide them toward ${name}'s products and content. Be friendly and conversational. Never make up information.

Creator: ${name}
Bio: ${user.bio || "(none)"}
Links:
${linksList}
Products:
${productsList}
Active drops:
${dropsList}
Vault content:
${vaultList}

Always end with a clear next step. Keep responses concise — under 3 sentences.`

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10).map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!openaiRes.ok || !openaiRes.body) {
      console.error("[ai/agent] OpenAI error:", await openaiRes.text().catch(() => "unknown"))
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const upstreamReader = openaiRes.body.getReader()

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
              if (data === "[DONE]") {
                controller.close()
                return
              }
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  controller.enqueue(encoder.encode(content))
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
  } catch (error: any) {
    console.error("[ai/agent] Error:", error.message)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
