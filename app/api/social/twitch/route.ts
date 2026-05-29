import { NextResponse } from "next/server"

let tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token
  }

  const clientId = process.env.TWITCH_CLIENT_ID!
  const clientSecret = process.env.TWITCH_CLIENT_SECRET!

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  })

  if (!res.ok) {
    throw new Error(`Twitch token request failed: ${res.status}`)
  }

  const data = await res.json()
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return tokenCache.token
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400 })
    }

    const clientId = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Twitch API credentials not configured" },
        { status: 500 }
      )
    }

    const accessToken = await getAccessToken()

    const streamRes = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(username)}`,
      {
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
        },
        next: { revalidate: 120 },
      }
    )

    if (!streamRes.ok) {
      return NextResponse.json(
        { error: "Twitch API request failed" },
        { status: 502 }
      )
    }

    const streamData = await streamRes.json()
    const stream = streamData.data?.[0]

    if (stream) {
      return NextResponse.json({
        isLive: true,
        title: stream.title,
        game: stream.game_name,
        viewers: stream.viewer_count,
        username,
      })
    }

    return NextResponse.json({
      isLive: false,
      username,
    })
  } catch (error) {
    console.error("Twitch social card error:", error)
    return NextResponse.json(
      { error: "Failed to fetch Twitch status" },
      { status: 500 }
    )
  }
}
