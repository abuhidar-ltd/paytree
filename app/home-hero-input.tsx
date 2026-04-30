"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HomeHeroInput() {
  const [username, setUsername] = useState("")

  return (
    <div className="obsidian-card-static p-2 flex items-center gap-2">
      <span className="text-[#888888] pl-4 font-mono text-sm">paytree.to/</span>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        placeholder="yourname"
        className="flex-1 bg-transparent border-none outline-none text-[#00ff88] font-mono text-lg py-3"
      />
      <Link href={username ? `/register?username=${username}` : "/register"}>
        <Button variant="accent-solid" size="sm" className="px-6">
          Claim
        </Button>
      </Link>
    </div>
  )
}
