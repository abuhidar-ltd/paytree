import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/clerk-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const dropSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().optional().nullable(),
  dropAt: z.string().datetime(),
  revealUrl: z.string().url().optional().nullable(),
  revealText: z.string().optional().nullable(),
  status: z.string().optional(),
  limitedSpots: z.number().int().positive().optional().nullable(),
  spotsLeft: z.number().int().min(0).optional().nullable(),
  enabled: z.boolean().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const drops = await prisma.drop.findMany({
      where: { userId: user.id },
      orderBy: { dropAt: "asc" },
    })

    return NextResponse.json(drops)
  } catch (error) {
    console.error("Failed to load drops:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = dropSchema.parse(body)

    // #region agent log
    try {
      const prismaKeys = Object.keys(prisma as unknown as Record<string, unknown>).filter(k => !k.startsWith('_') && !k.startsWith('$'))
      let resolvedClientPath = ''
      try { resolvedClientPath = require.resolve('@prisma/client') } catch {}
      fetch('http://127.0.0.1:7441/ingest/3c6a1684-3cb1-4052-b2b4-537764f95ede', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '66da0d' },
        body: JSON.stringify({
          sessionId: '66da0d',
          runId: 'run1',
          hypothesisId: 'A,B,C',
          location: 'app/api/drops/route.ts:POST',
          message: 'prisma client introspection at runtime',
          data: {
            hasDrop: typeof (prisma as any).drop !== 'undefined',
            hasLink: typeof (prisma as any).link !== 'undefined',
            hasUser: typeof (prisma as any).user !== 'undefined',
            modelKeys: prismaKeys,
            modelCount: prismaKeys.length,
            resolvedClientPath,
            nodeEnv: process.env.NODE_ENV,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
    } catch {}
    // #endregion

    const drop = await prisma.drop.create({
      data: {
        userId: currentUser.id,
        title: data.title,
        description: data.description ?? null,
        dropAt: new Date(data.dropAt),
        revealUrl: data.revealUrl ?? null,
        revealText: data.revealText ?? null,
        status: data.status ?? "scheduled",
        limitedSpots: data.limitedSpots ?? null,
        spotsLeft:
          data.spotsLeft ?? (data.limitedSpots ? data.limitedSpots : null),
        enabled: data.enabled ?? true,
      },
    })

    return NextResponse.json(drop, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Failed to create drop:", error)
    return NextResponse.json(
      { error: "Failed to create drop. Please try again." },
      { status: 500 }
    )
  }
}
