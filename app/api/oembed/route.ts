import { NextRequest, NextResponse } from "next/server"

interface OEmbedResponse {
  type: string
  version: string
  title?: string
  author_name?: string
  author_url?: string
  provider_name?: string
  provider_url?: string
  thumbnail_url?: string
  thumbnail_width?: number
  thumbnail_height?: number
  html?: string
  width?: number
  height?: number
}

// oEmbed endpoints for different providers
const OEMBED_PROVIDERS: Record<string, { endpoint: string; format: string }> = {
  youtube: {
    endpoint: "https://www.youtube.com/oembed",
    format: "json",
  },
  spotify: {
    endpoint: "https://open.spotify.com/oembed",
    format: "json",
  },
  soundcloud: {
    endpoint: "https://soundcloud.com/oembed",
    format: "json",
  },
  vimeo: {
    endpoint: "https://vimeo.com/api/oembed.json",
    format: "json",
  },
  twitter: {
    endpoint: "https://publish.twitter.com/oembed",
    format: "json",
  },
}

// Detect provider from URL
function detectProvider(url: string): string | null {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("spotify.com")) return "spotify"
  if (url.includes("soundcloud.com")) return "soundcloud"
  if (url.includes("vimeo.com")) return "vimeo"
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter"
  return null
}

// GET - Fetch oEmbed data for a URL
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")
    const maxWidth = request.nextUrl.searchParams.get("maxwidth") || "480"
    const maxHeight = request.nextUrl.searchParams.get("maxheight") || "270"
    
    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }
    
    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }
    
    // Detect provider
    const provider = detectProvider(url)
    if (!provider) {
      return NextResponse.json(
        { error: "Unsupported provider. Supported: YouTube, Spotify, SoundCloud, Vimeo, Twitter" },
        { status: 400 }
      )
    }
    
    const providerConfig = OEMBED_PROVIDERS[provider]
    
    // Build oEmbed URL
    const oembedUrl = new URL(providerConfig.endpoint)
    oembedUrl.searchParams.set("url", url)
    oembedUrl.searchParams.set("format", providerConfig.format)
    oembedUrl.searchParams.set("maxwidth", maxWidth)
    oembedUrl.searchParams.set("maxheight", maxHeight)
    
    // Fetch oEmbed data
    const response = await fetch(oembedUrl.toString(), {
      headers: {
        "User-Agent": "PayTree oEmbed Fetcher/1.0",
        "Accept": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch oEmbed: ${response.status}` },
        { status: response.status }
      )
    }
    
    const data: OEmbedResponse = await response.json()
    
    // Add provider info
    return NextResponse.json({
      ...data,
      provider: provider,
    })
  } catch (error) {
    console.error("oEmbed proxy error:", error)
    return NextResponse.json(
      { error: "Failed to fetch oEmbed data" },
      { status: 500 }
    )
  }
}
