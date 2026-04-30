import { NextRequest, NextResponse } from "next/server"

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
    
    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }
    
    // Fetch the RSS feed
    const response = await fetch(url, {
      headers: {
        "User-Agent": "PayTree RSS Fetcher/1.0",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })
    
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
