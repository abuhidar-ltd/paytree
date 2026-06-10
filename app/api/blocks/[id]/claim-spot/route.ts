import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/blocks/[id]/claim-spot
 *
 * Public endpoint — no auth required (visitor action).
 * Atomically decrements spotsLeft on a drop block.
 * When the last spot is claimed the block is deleted automatically.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await prisma.$transaction(async (tx) => {
      const block = await tx.block.findUnique({
        where: { id },
        select: { id: true, type: true, enabled: true, config: true, url: true, salesCount: true },
      })

      if (!block || block.type !== "drop" || !block.enabled) {
        return { notFound: true }
      }

      const cfg = (block.config ?? {}) as Record<string, unknown>
      const limitedSpots = typeof cfg.limitedSpots === "number" ? cfg.limitedSpots : null

      // Unlimited drop — just return reveal content
      if (limitedSpots === null) {
        return {
          ok: true,
          spotsLeft: null,
          revealUrl: (cfg.revealUrl as string | undefined) ?? (block.url ?? undefined),
          revealText: cfg.revealText as string | undefined,
        }
      }

      const currentSpotsLeft = typeof cfg.spotsLeft === "number" ? cfg.spotsLeft : limitedSpots

      if (currentSpotsLeft <= 0) {
        // No spots left — delete the block
        await tx.block.delete({ where: { id } })
        return { soldOut: true }
      }

      const newSpotsLeft = currentSpotsLeft - 1
      const newCfg = { ...cfg, spotsLeft: newSpotsLeft }

      if (newSpotsLeft <= 0) {
        // Last spot claimed — delete block after recording the claim
        await tx.block.delete({ where: { id } })
      } else {
        await tx.block.update({
          where: { id },
          data: {
            salesCount: { increment: 1 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config: newCfg as any,
          },
        })
      }

      return {
        ok: true,
        spotsLeft: newSpotsLeft,
        revealUrl: (cfg.revealUrl as string | undefined) ?? (block.url ?? undefined),
        revealText: cfg.revealText as string | undefined,
      }
    })

    if (result.notFound) {
      return NextResponse.json({ error: "Drop not found" }, { status: 404 })
    }
    if (result.soldOut) {
      return NextResponse.json({ soldOut: true }, { status: 409 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[claim-spot] error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
