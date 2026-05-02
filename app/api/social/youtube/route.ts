import { NextResponse } from "next/server"

interface YouTubeSearchItem {
  id: { videoId?: string }
  snippet: {
    title: string
    publishedAt: string
    channelTitle: string
    thumbnails: {
      maxres?: { url: string }
      high?: { url: string }
      medium?: { url: string }
      default?: { url: string }
    }
  }
}

interface YouTubeVideoItem {
  id: string
  statistics?: { viewCount?: string }
  contentDetails?: { duration?: string }
}

// ISO 8601 PT#H#M#S -> H:MM:SS or M:SS
function formatDuration(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return undefined
  const h = parseInt(match[1] || "0", 10)
  const m = parseInt(match[2] || "0", 10)
  const s = parseInt(match[3] || "0", 10)
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 })
    }

    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}` +
      `&channelId=${encodeURIComponent(channelId)}` +
      `&part=snippet&order=date&maxResults=1&type=video`

    const searchRes = await fetch(searchUrl, { next: { revalidate: 600 } })
    if (!searchRes.ok) {
      return NextResponse.json(
        { error: "YouTube API request failed" },
        { status: 502 }
      )
    }

    const searchData: { items?: YouTubeSearchItem[] } = await searchRes.json()
    const item = searchData.items?.[0]
    const videoId = item?.id?.videoId

    if (!item || !videoId) {
      return NextResponse.json(
        { error: "No videos found for this channel" },
        { status: 404 }
      )
    }

    const videoUrl =
      `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}` +
      `&id=${videoId}&part=statistics,contentDetails`

    const videoRes = await fetch(videoUrl, { next: { revalidate: 600 } })
    let viewCount: string | undefined
    let duration: string | undefined
    if (videoRes.ok) {
      const videoData: { items?: YouTubeVideoItem[] } = await videoRes.json()
      const v = videoData.items?.[0]
      viewCount = v?.statistics?.viewCount
      duration = formatDuration(v?.contentDetails?.duration)
    }

    const thumbnail =
      item.snippet.thumbnails.maxres?.url ||
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default?.url ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

    return NextResponse.json({
      videoId,
      title: item.snippet.title,
      thumbnail,
      viewCount: viewCount ? parseInt(viewCount, 10) : undefined,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      duration,
    })
  } catch (error) {
    console.error("YouTube social card error:", error)
    return NextResponse.json(
      { error: "Failed to load latest video" },
      { status: 500 }
    )
  }
}
