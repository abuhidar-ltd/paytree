import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const unlockSchema = z.object({
  email: z.string().email("Invalid email address"),
  vaultItemId: z.string().min(1, "Vault item ID required"),
  ownerId: z.string().min(1, "Owner ID required"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, vaultItemId, ownerId } = unlockSchema.parse(body)
    
    // Verify the vault item exists and belongs to the owner
    const vaultItem = await prisma.link.findFirst({
      where: {
        id: vaultItemId,
        userId: ownerId,
        isVaultItem: true,
        isEmailLocked: true,
      },
      select: {
        id: true,
        title: true,
        url: true,
        downloadUrl: true,
        downloadName: true,
        vaultContent: true,
      }
    })
    
    if (!vaultItem) {
      return NextResponse.json(
        { error: "Vault item not found or not locked" },
        { status: 404 }
      )
    }
    
    // Check if email already exists for this user (upsert)
    const existingAudience = await prisma.audience.findUnique({
      where: {
        userId_email: {
          userId: ownerId,
          email: email.toLowerCase(),
        }
      }
    })
    
    if (existingAudience) {
      // Update existing record with this vault item if different
      if (existingAudience.vaultItemId !== vaultItemId) {
        await prisma.audience.update({
          where: { id: existingAudience.id },
          data: { vaultItemId }
        })
      }
    } else {
      // Create new audience record
      await prisma.audience.create({
        data: {
          userId: ownerId,
          email: email.toLowerCase(),
          source: "vault",
          vaultItemId,
          // Could add IP/userAgent from request headers
        }
      })
    }
    
    // Return the unlocked content
    return NextResponse.json({
      success: true,
      content: {
        url: vaultItem.url,
        downloadUrl: vaultItem.downloadUrl,
        downloadName: vaultItem.downloadName,
        vaultContent: vaultItem.vaultContent,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error("Vault unlock error:", error)
    return NextResponse.json(
      { error: "Failed to unlock vault item" },
      { status: 500 }
    )
  }
}

