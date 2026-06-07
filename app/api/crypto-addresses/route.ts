// DEPRECATED — use /api/blocks with type="crypto". The CryptoAddress table
// is no longer queried by the public profile; route preserved for legacy
// integrations and existing user data.
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/clerk-auth"

// GET - List all crypto addresses
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const addresses = await prisma.cryptoAddress.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error("Error getting crypto addresses:", error)
    return NextResponse.json({ error: "Failed to get addresses" }, { status: 500 })
  }
}

// POST - Add new crypto address
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { currency, address, label } = body

    if (!currency || !address) {
      return NextResponse.json({ error: "Currency and address are required" }, { status: 400 })
    }

    // Validate currency
    const validCurrencies = ["BTC", "ETH", "SOL", "USDT", "USDC", "BNB", "XRP", "ADA", "DOGE", "MATIC"]
    if (!validCurrencies.includes(currency.toUpperCase())) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 })
    }

    // Get max order
    const maxOrder = await prisma.cryptoAddress.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const newAddress = await prisma.cryptoAddress.create({
      data: {
        userId: user.id,
        currency: currency.toUpperCase(),
        address: address.trim(),
        label: label?.trim() || null,
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    return NextResponse.json(newAddress, { status: 201 })
  } catch (error) {
    console.error("Error adding crypto address:", error)
    return NextResponse.json({ error: "Failed to add address" }, { status: 500 })
  }
}

