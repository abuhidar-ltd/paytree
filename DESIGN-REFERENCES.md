# Design References for Paytree

## Inspirations
- Linear.app — clean dark SaaS, perfect spacing
- Vercel dashboard — glass cards, minimal chrome
- Raycast — obsidian aesthetic, keyboard-first
- Apple — spring animations, cinematic transitions
- Stripe — data visualization, professional dark

## What Makes Our Cards Special
1. Glass top reflection (inset 0 1px 0 rgba(255,255,255,0.06))
2. Hover lift (translateY -1px, 150ms ease)
3. Active/selected: green glow border
4. Bottom bar: type label + toggle + menu
5. Stagger entrance animations

## Animation Principles
- Spring stiffness: 280-350, damping: 24-30
- Hover: 150ms ease (not spring — too slow)
- Entrance: spring with 0.05s stagger
- Exit: fade + scale 0.95, 150ms
- Page transitions: framer AnimatePresence mode="wait"
- Collection open: Apple iOS folder transition

## Typography Scale
- Page title: text-2xl font-bold text-white
- Card title: text-sm font-medium text-[#d8d8d8]
- Label: text-[10px] font-mono uppercase tracking-widest text-[#444]
- Subtitle: text-xs text-[#555]
- Data/number: font-mono text-[#00ff88]
- Muted: text-xs text-[#333]

## Spacing System
- Card padding: p-4 (16px)
- Card gap: gap-3 (12px)
- Section gap: gap-6 (24px)
- Page padding: px-6 (24px)
- Card border-radius: rounded-2xl (16px)
