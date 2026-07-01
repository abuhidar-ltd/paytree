import { ImageResponse } from "next/og"
import { OgCard, ogFonts, OG_ALT, OG_SIZE } from "./og/card"

export const runtime = "edge"
export const alt = OG_ALT
export const size = OG_SIZE
export const contentType = "image/png"

export default async function TwitterImage() {
  return new ImageResponse(<OgCard />, { ...OG_SIZE, fonts: await ogFonts() })
}
