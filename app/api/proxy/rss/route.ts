import { NextRequest, NextResponse } from "next/server"
import { lookup } from "dns/promises"

export const runtime = "nodejs"

// ─── SSRF guard ──────────────────────────────────────────────────────────────
// Block requests to loopback, private, link-local, and reserved ranges so a
// user-supplied feed URL cannot reach internal services or cloud metadata
// endpoints (e.g. 169.254.169.254).

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

  // Resolve the host and reject if ANY resolved address is private/reserved.
  // Catches IP literals and hostnames that point at internal addresses.
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
// against the SSRF guard. fetch's automatic redirect would otherwise bypass it.
// Throws Error("blocked") on a disallowed target, a bad Location, or too many
// hops; lets genuine network/abort errors propagate.
async function fetchWithSafeRedirects(start: URL, signal: AbortSignal): Promise<Response> {
  const MAX_REDIRECTS = 3
  let current = start
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const response = await fetch(current, {
      headers: {
        "User-Agent": "Paytree RSS Fetcher/1.0",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      redirect: "manual",
      signal,
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    // Not a 3xx → this is the final response.
    if (response.status < 300 || response.status >= 400) return response

    const location = response.headers.get("location")
    if (!location) return response // redirect without a target → let caller handle status

    // Resolve relative redirects against the current (already-validated) URL,
    // then re-validate the target before following it.
    let next: URL
    try {
      next = new URL(location, current)
    } catch {
      throw new Error("blocked")
    }
    current = await assertPublicUrl(next.toString())
  }

  // More than MAX_REDIRECTS hops → refuse.
  throw new Error("blocked")
}

interface RSSItem {
  title: string
  link: string
  description?: string
  imageUrl?: string
  pubDate?: string
}

interface RSSFeed {
  title: string
  items: RSSItem[]
}

// Extract image from content or description
function extractImage(content: string): string | null {
  // Try to find an image in the content
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgMatch) return imgMatch[1]
  
  // Try media:content or enclosure
  const mediaMatch = content.match(/<media:content[^>]+url=["']([^"']+)["']/i)
  if (mediaMatch) return mediaMatch[1]
  
  const enclosureMatch = content.match(/<enclosure[^>]+url=["']([^"']+)["']/i)
  if (enclosureMatch) return enclosureMatch[1]
  
  return null
}

// Parse RSS/Atom XML
function parseRSSXML(xml: string): RSSFeed {
  const items: RSSItem[] = []
  
  // Get feed title
  const titleMatch = xml.match(/<title[^>]*>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/i)
  const feedTitle = titleMatch ? titleMatch[1].trim() : "RSS Feed"
  
  // Try RSS 2.0 format first
  const rssItemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  
  while ((match = rssItemRegex.exec(xml)) !== null) {
    const itemContent = match[1]
    
    // Extract title
    const itemTitleMatch = itemContent.match(/<title[^>]*>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/i)
    const title = itemTitleMatch ? itemTitleMatch[1].trim() : ""
    
    // Extract link
    const linkMatch = itemContent.match(/<link[^>]*>([^<]+)<\/link>/i)
    const link = linkMatch ? linkMatch[1].trim() : ""
    
    // Extract description
    const descMatch = itemContent.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)
    const description = descMatch ? descMatch[1].trim().replace(/<[^>]+>/g, "").substring(0, 200) : undefined
    
    // Extract pubDate
    const pubDateMatch = itemContent.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i)
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : undefined
    
    // Extract image
    const imageUrl = extractImage(itemContent)
    
    if (title && link) {
      items.push({ title, link, description, imageUrl: imageUrl || undefined, pubDate })
    }
  }
  
  // Try Atom format if no RSS items found
  if (items.length === 0) {
    const atomEntryRegex = /<entry>([\s\S]*?)<\/entry>/gi
    
    while ((match = atomEntryRegex.exec(xml)) !== null) {
      const entryContent = match[1]
      
      // Extract title
      const itemTitleMatch = entryContent.match(/<title[^>]*>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/i)
      const title = itemTitleMatch ? itemTitleMatch[1].trim() : ""
      
      // Extract link (Atom uses href attribute)
      const linkMatch = entryContent.match(/<link[^>]*href=["']([^"']+)["']/i)
      const link = linkMatch ? linkMatch[1].trim() : ""
      
      // Extract summary/content
      const summaryMatch = entryContent.match(/<(?:summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:summary|content)>/i)
      const description = summaryMatch ? summaryMatch[1].trim().replace(/<[^>]+>/g, "").substring(0, 200) : undefined
      
      // Extract published date
      const pubDateMatch = entryContent.match(/<(?:published|updated)[^>]*>([^<]+)<\/(?:published|updated)>/i)
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : undefined
      
      // Extract image
      const imageUrl = extractImage(entryContent)
      
      if (title && link) {
        items.push({ title, link, description, imageUrl: imageUrl || undefined, pubDate })
      }
    }
  }
  
  return { title: feedTitle, items }
}

// GET - Fetch and parse RSS feed
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")
    
    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }
    
    // Validate URL against SSRF (protocol, credentials, private/internal hosts)
    let safeUrl: URL
    try {
      safeUrl = await assertPublicUrl(url)
    } catch {
      return NextResponse.json({ error: "Invalid or blocked URL" }, { status: 400 })
    }

    // Fetch the feed with a timeout, re-validating every redirect hop against
    // the SSRF guard (fetch's automatic redirects are disabled inside).
    let response: Response
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      response = await fetchWithSafeRedirects(safeUrl, controller.signal)
    } catch (err) {
      if (err instanceof Error && err.message === "blocked") {
        return NextResponse.json({ error: "Invalid or blocked URL" }, { status: 400 })
      }
      throw err // network/abort errors → outer catch → generic 500
    } finally {
      clearTimeout(timeout)
    }
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch feed: ${response.status}` },
        { status: response.status }
      )
    }
    
    const xml = await response.text()
    const feed = parseRSSXML(xml)
    
    return NextResponse.json(feed)
  } catch (error) {
    console.error("RSS proxy error:", error)
    return NextResponse.json(
      { error: "Failed to fetch RSS feed" },
      { status: 500 }
    )
  }
}
