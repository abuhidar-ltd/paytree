"use client"

import dynamic from "next/dynamic"

const HomeScrollStory = dynamic(
  () => import("./home-scroll-story").then((mod) => mod.HomeScrollStory),
  { ssr: false }
)

export function HomeScrollStoryLoader() {
  return <HomeScrollStory />
}
