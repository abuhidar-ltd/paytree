import { NextResponse } from "next/server"

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function stripCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return m ? m[1].trim() : s.trim()
}

function pickTag(scope: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  const m = scope.match(re)
  if (!m) return undefined
  return decodeEntities(stripCdata(m[1]))
}

function pickAttr(scope: string, tag: string, attr: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["']`, "i")
  const m = scope.match(re)
  return m?.[1]
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rssUrl = searchParams.get("rssUrl")

    if (!rssUrl) {
      return NextResponse.json({ error: "rssUrl is required" }, { status: 400 })
    }

    let url: URL
    try {
      url = new URL(rssUrl)
    } catch {
      return NextResponse.json({ error: "Invalid rssUrl" }, { status: 400 })
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid rssUrl protocol" }, { status: 400 })
    }

    const isLikelyRss =
      /\.(rss|xml)(\?|$)/i.test(url.pathname + url.search) ||
      /\/(feed|rss)(\/|$|\?)/i.test(url.pathname) ||
      /podcasts\.apple\.com|feeds\.|anchor\.fm|buzzsprout|podbean|libsyn|simplecast|transistor\.fm|spotify\.com\/show/i.test(url.hostname + url.pathname)

    if (!isLikelyRss) {
      return NextResponse.json(
        { error: "Please provide a valid podcast RSS feed URL" },
        { status: 400 }
      )
    }

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Paytree/1.0; +https://paytree.to)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 600 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not load podcast feed" },
        { status: 400 }
      )
    }

    const xml = await res.text()

    // Channel-level scope: from <channel> up to first <item> (or end)
    const firstItemIdx = xml.search(/<item[\s>]/i)
    const channelScope = firstItemIdx >= 0 ? xml.slice(0, firstItemIdx) : xml

    const showTitle = pickTag(channelScope, "title")
    const showImage =
      pickAttr(channelScope, "itunes:image", "href") ||
      (() => {
        const imageBlock = channelScope.match(/<image[^>]*>([\s\S]*?)<\/image>/i)
        return imageBlock ? pickTag(imageBlock[1], "url") : undefined
      })()

    // First item
    const itemMatch = xml.match(/<item[\s>][\s\S]*?<\/item>/i)
    if (!itemMatch) {
      return NextResponse.json(
        { error: "No episodes found in feed" },
        { status: 404 }
      )
    }
    const itemScope = itemMatch[0]

    const episodeTitle = pickTag(itemScope, "title")
    const audioUrl = pickAttr(itemScope, "enclosure", "url")
    const duration = pickTag(itemScope, "itunes:duration")
    const pubDate = pickTag(itemScope, "pubDate")

    if (!audioUrl) {
      return NextResponse.json(
        { error: "Latest episode has no audio enclosure" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      showTitle: showTitle || "Podcast",
      showImage,
      episode: {
        title: episodeTitle || "Latest episode",
        audioUrl,
        duration,
        pubDate,
      },
    })
  } catch (error) {
    console.error("Podcast social card error:", error)
    return NextResponse.json(
      { error: "Failed to load podcast feed" },
      { status: 500 }
    )
  }
}
