// Believable fake profile data for the /landing-v4 gallery. Every profile
// mirrors a real Paytree niche (finance/trading/coach/creator) with plausible
// pricing and revenue. Numbers are anchored to what our top public accounts
// actually earn so users can imagine themselves there.
//
// Card `kind` values map 1:1 to production Block types (see
// components/ui/block-renderer.tsx). The visuals in mini-profile.tsx render
// each kind with the same accent and shell the real BlockRenderer uses.

export type MockCard =
  | {
      kind: "product"
      title: string
      price: string
      cta?: string
    }
  | {
      kind: "drop"
      title: string
      hoursUntil: number
      spotsLeft?: number
    }
  | {
      kind: "vault"
      title: string
    }
  | {
      kind: "link"
      title: string
      icon?: "play" | "file" | "video" | "cart"
    }
  | {
      kind: "agent"
      hint: string
    }

export interface MockProfile {
  handle: string
  name: string
  initial: string
  bio: string
  niche: string
  monthly: string
  accent: string
  featured?: boolean
  cards: MockCard[]
}

export const PROFILES: MockProfile[] = [
  {
    handle: "sara.trades",
    name: "Sara Rahman",
    initial: "S",
    bio: "Daily forex signals · Dubai based",
    niche: "trader",
    monthly: "$4.2k/mo",
    accent: "#00ff88",
    featured: true,
    cards: [
      { kind: "product", title: "Pro Signals Group", price: "$49/mo", cta: "JOIN" },
      { kind: "drop", title: "Q3 masterclass", hoursUntil: 2, spotsLeft: 12 },
      { kind: "vault", title: "Free strategy PDF" },
      { kind: "agent", hint: "Ask me anything" },
    ],
  },
  {
    handle: "coach.omar",
    name: "Omar Al-Farsi",
    initial: "O",
    bio: "1:1 business coach · Toronto",
    niche: "coach",
    monthly: "$7.1k/mo",
    accent: "#9146ff",
    cards: [
      { kind: "product", title: "1:1 Coaching Call", price: "$150", cta: "BOOK" },
      { kind: "product", title: "6-week Program", price: "$899", cta: "APPLY" },
      { kind: "link", title: "Free discovery call", icon: "video" },
      { kind: "vault", title: "Client wins pack" },
    ],
  },
  {
    handle: "jenna.pdf",
    name: "Jenna Kim",
    initial: "J",
    bio: "Registered dietitian · meal plans",
    niche: "creator",
    monthly: "$3.4k/mo",
    accent: "#f59e0b",
    cards: [
      { kind: "product", title: "30-day meal plan", price: "$29", cta: "BUY" },
      { kind: "drop", title: "New protein guide", hoursUntil: 14 },
      { kind: "link", title: "Instagram", icon: "play" },
      { kind: "link", title: "Free calorie sheet", icon: "file" },
    ],
  },
  {
    handle: "rana.crypto",
    name: "Rana El-Sayed",
    initial: "R",
    bio: "On-chain alerts · Cairo",
    niche: "trader",
    monthly: "$2.8k/mo",
    accent: "#378add",
    cards: [
      { kind: "product", title: "Alpha Group", price: "$19/mo", cta: "JOIN" },
      { kind: "vault", title: "Wallet tracking sheet" },
      { kind: "link", title: "Latest thread on X", icon: "play" },
      { kind: "agent", hint: "What's the entry?" },
    ],
  },
]
