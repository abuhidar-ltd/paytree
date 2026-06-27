import { NextResponse } from "next/server"
import { lookup } from "dns/promises"

export const runtime = "nodejs"

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

// ─── SSRF guard (mirrors app/api/proxy/rss/route.ts) ─────────────────────────
// Block requests to loopback, private, link-local, and reserved ranges so a
// user-supplied feed URL cannot reach internal services or cloud metadata.

function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split(".")
  if (parts.length !== 4) return true
  const o = parts.map((p) => Number(p))
  if (o.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = o
  if (a === 0) return true                          // 0.0.0.0/8
  if (a === 10) return true                         // 10.0.0.0/8
  if (a === 127) return true                        // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true           // 169.254.0.0/16 link-local + metadata
  if (a === 172 && b >= 16 && b <= 31) return true  // 172.16.0.0/12
  if (a === 192 && b === 168) return true           // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 CGNAT
  return false
}

function isBlockedIPv6(ip: string): boolean {
  const addr = ip.toLowerCase()
  if (addr === "::" || addr === "::1") return true                // unspecified / loopback
  if (/^fe[89ab]/.test(addr)) return true                         // fe80::/10 link-local
  if (/^f[cd]/.test(addr)) return true                            // fc00::/7 unique-local
  const mapped = addr.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/) // IPv4-mapped
  if (mapped) return isBlockedIPv4(mapped[1])
  return false
}

// Validates a user-supplied URL is safe to fetch server-side. Throws on any
// blocked URL; returns the parsed URL when safe.
async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error("blocked")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("blocked")
  if (url.username || url.password) throw new Error("blocked") // reject credentials

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("blocked")
  }

  let addresses: { address: string; family: number }[]
  try {
    addresses = await lookup(host, { all: true })
  } catch {
    throw new Error("blocked") // unresolvable → refuse
  }
  for (const { address, family } of addresses) {
    if (family === 4 ? isBlockedIPv4(address) : isBlockedIPv6(address)) {
      throw new Error("blocked")
    }
  }

  return url
}

// Fetch a feed while following redirects MANUALLY so every hop is re-validated
// against the SSRF guard. Throws Error("blocked") on a disallowed target, a bad
// Location, or too many hops; lets genuine network/abort errors propagate.
async function fetchWithSafeRedirects(start: URL, signal: AbortSignal): Promise<Response> {
  const MAX_REDIRECTS = 3
  let current = start
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const response = await fetch(current, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Paytree/1.0; +https://paytree.to)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
      redirect: "manual",
      signal,
      next: { revalidate: 600 },
    })

    if (response.status < 300 || response.status >= 400) return response

    const location = response.headers.get("location")
    if (!location) return response

    let next: URL
    try {
      next = new URL(location, current)
    } catch {
      throw new Error("blocked")
    }
    current = await assertPublicUrl(next.toString())
  }

  throw new Error("blocked")
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

    // SSRF validation — protocol, credentials, private/internal hosts (DNS-checked)
    let safeUrl: URL
    try {
      safeUrl = await assertPublicUrl(url.toString())
    } catch {
      return NextResponse.json({ error: "Invalid rssUrl" }, { status: 400 })
    }

    // Fetch with a timeout, re-validating every redirect hop against the guard.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    let res: Response
    try {
      res = await fetchWithSafeRedirects(safeUrl, controller.signal)
    } catch (err) {
      if (err instanceof Error && err.message === "blocked") {
        return NextResponse.json({ error: "Invalid rssUrl" }, { status: 400 })
      }
      throw err // network/abort errors → outer catch → generic 500
    } finally {
      clearTimeout(timeout)
    }

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
