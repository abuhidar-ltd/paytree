import { ImageResponse } from "next/og"
import { OgCard, ogFonts, OG_ALT, OG_SIZE } from "./og/card"

// Edge runtime keeps ImageResponse self-contained (fonts are bundled assets,
// no filesystem or build-time font fetches). CDN caches the result.
export const runtime = "edge"
export const alt = OG_ALT
export const size = OG_SIZE
export const contentType = "image/png"

export default async function OpengraphImage() {
  return new ImageResponse(<OgCard />, { ...OG_SIZE, fonts: await ogFonts() })
}
