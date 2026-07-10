# Paytree Design System — As-Implemented Export

> Extracted from actual code on 2026-07-08 for design critique ahead of a native iOS rebuild.
> This documents what IS shipped, not what CLAUDE.md prescribes. Where the two diverge, this file wins.
> Sources: `app/globals.css`, `lib/glass.ts`, `app/layout.tsx`, `components/ui/**` (55 files), `components/sign-up-screen.tsx`, `components/sign-in-screen.tsx`, `app/[username]/profile-client.tsx`, `app/dashboard/page.tsx`.
>
> **The single most important fact:** there are TWO competing glass systems live in the codebase (see Known Inconsistencies §1), plus a third light-theme shadcn scaffold that was never deleted.

---

## Colors

There is no Tailwind config file — Tailwind 4 with an inline `@theme` block in `app/globals.css`, plus a second token set in `lib/glass.ts`, plus hundreds of hardcoded arbitrary values in components.

### Background layers
| Role | Value | Where |
|---|---|---|
| Page base | `#030303` | `html`, `body`, dashboard root |
| Dashboard canvas | `#060606` | canvas area only |
| Chrome surface (top bar, sidebars, preview panel) | `#080808` | dashboard chrome, orb base |
| Panels / sheets / dialogs | `#0a0a0a` | edit rail, BottomSheet, ConfirmDialog, AI bio sheet, glass.panel |
| Popovers / toasts | `#0f0f0f` | add-card picker, social-proof toast, dropdown/tooltip patterns |
| AI chat panel | `#0c0c0c` | ai-agent-chat only (one-off) |
| Elevated (declared, rarely used) | `#111111`, `#1a1a1a` | `@theme` vars `--color-obsidian-elevated/card` |

### Glass overlays (white-alpha)
| Value | Role |
|---|---|
| `rgba(255,255,255,0.01)` | **legacy** glass base (`.obsidian-card`, `.glass-brick`, `.glass-card`) |
| `rgba(255,255,255,0.02)` | subtle panels, block-canvas cards, history rows |
| `rgba(255,255,255,0.03)` | **canonical** glass card base (`lib/glass.ts`, BioCard, checklist, celebration) |
| `rgba(255,255,255,0.04)` | inputs (glass.input), glass button-style cards |
| `rgba(255,255,255,0.05)` | hover state, `.input-obsidian`, `.btn-obsidian`, Google button |
| `rgba(255,255,255,0.06)–0.08` | icon tiles, active states |

### Accent (green)
| Value | Role |
|---|---|
| `#00ff88` | THE accent. Solid CTAs, data, active nav, progress fills, live dots |
| `#00cc6a` | gradient endpoint (`from-[#00ff88] to-[#00cc6a]`) and hover on solid green — used in bento modules, module-editor, upgrade-prompt |
| Alpha ladder (hex suffix) | `--accent-faint` +`08` (~3%), `--accent-soft` +`1a` (10%), `--accent-dim` +`22` (13%), `--accent-border` +`40` (25%), `--accent-glow` +`4d` (30%), `--accent-strong` +`66` (40%) — set per-profile in profile-client.tsx |
| Common rgba uses | `rgba(0,255,136,0.05)` pill bg · `0.06` notice bg · `0.08` sidebar active · `0.1` icon tiles/btn-accent · `0.2` borders/toggles · `0.3` borders/glows · `0.35` CTA shadow `0 0 40px` |
| Text on green | `#000` / `#030303` (black), `font-mono font-semibold/bold` — except upgrade-prompt which wrongly puts white on green |

### Semantic colors
| Semantic | Values actually found (multiple!) |
|---|---|
| Error / destructive red | `#ff5555` (token; auth errors, char counter) · `#ff7777` (confirm button) · `#ff8888` (ai-bio error) · Tailwind `red-400` `#f87171` · `red-500` `#ef4444` (live-stream, delete hovers) · `red-600` `#dc2626` · custom `rgba(255,60,60,*)` `#ff3c3c` (youtube-channel module) · `rgba(255,85,85,0.06–0.1)` bgs |
| Warning / vault amber | `#f59e0b` (token = amber-500; verify banner, confirm badge, retry button) · amber-400 `#fbbf24` (vault text/spots badge) · amber-300 `#fcd34d` (podcast play icon) · `rgba(255,180,0,0.04/0.12)` (podcast container — matches NO token) · `amber-500/[0.04]` + `/[0.15]` (vault card) |
| Info blue | `#378add` (token — barely used) · `#635BFF` (Stripe brand, connect banner) · Tailwind `blue-400/500` (product card, file-upload dropzone, toast action, button-variations — all off-token) |
| Purple | `#9146ff` (token = Twitch) · Tailwind `purple-400/500` (twitch cards) · `#5865F2` Discord · brand gradients in social-hub |
| Success | same green as accent |

### Text colors (actual usage, most → least bright)
| Value | Role |
|---|---|
| `#ffffff` / `text-white` | headings, card titles, primary content |
| `#f0f0f0` | text-primary token — bottom-sheet titles, checklist current step |
| `#e0e0e0` | input text, revealed content, table values |
| `#d8d8d8` | export button, tooltips (DESIGN-SYSTEM.md patterns) |
| `#d4d4d8` | `--color-text-secondary`, checklist future steps |
| `#c9c9d1` | secondary text — the de-facto workhorse (subtitles, meta, table headers) |
| `#b8b8b8` | `--color-text-muted`, labels, countdown units |
| `#b0b0b0` | text blocks, sign-in secondary |
| `#888888` | `.text-body` color, bento-module secondary — the OTHER workhorse |
| `#8a8a8a` | completed checklist items (strikethrough) |
| `#555555` | placeholders (`.input-obsidian`), footnotes, gated states |
| `#444` | CLAUDE.md "muted" token — rarely appears in code |
| `#2e2e2e` | AI chat placeholder + timestamps |
| Tailwind `zinc-400` `#a1a1aa`, `gray-300/400/500` | link-card badges, legacy components |

### Borders
| Value | Role |
|---|---|
| `0.5px solid rgba(255,255,255,0.08)` | canonical card border (lib/glass.ts) |
| `1px solid rgba(255,255,255,0.12)` | legacy glass border (`.obsidian-card`, `.glass-brick`) |
| `rgba(255,255,255,0.06)` | chrome dividers (sidebar/top bar borders) |
| `rgba(255,255,255,0.07)` | profile stat cards, FAQ, contact form (1px Tailwind default) |
| `rgba(255,255,255,0.1)` | inputs inside cards (`border-white/10`), BottomSheet top |
| `rgba(255,255,255,0.14)` | glass.cardHover border |
| `rgba(0,255,136,0.25)` | glass.cardSelected, celebration card |
| `1.2px` razor rim | `.obsidian-card::before` top highlight |
| `1.5px` | neon button-style, orb ring, phone frame |
| `2px` | upgrade-prompt, neon link variant, shadcn Card, avatar ring |

### Shadows
```
inset 0 1px 0 rgba(255,255,255,0.06)        canonical card inner reflection
0 10px 30px rgba(0,0,0,0.3)                 legacy obsidian-card drop (.shadow-medium)
0 4px 20px rgba(0,0,0,0.25)                 .shadow-soft
0 20px 50px rgba(0,0,0,0.4)                 .shadow-heavy
0 24px 64px rgba(0,0,0,0.8)                 add-picker popover
0 -32px 64px rgba(0,0,0,0.6)                bottom sheet
0 32px 80px rgba(0,0,0,0.8)                 AI chat panel
0 0 20px/30px/40px rgba(0,255,136,0.1–0.5)  green glow ladder (buttons, badges, celebration)
0 0 64px rgba(0,255,136,0.15)               publish celebration card
4px 6px 0 rgba(255,255,255,0.06)            "3d" link variant (hard offset shadow)
```

### Reflection line (the signature top highlight)
Two versions coexist:
- **Canonical** (`lib/glass.ts glassReflection`): 1px, `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)` — rendered as absolutely-positioned div, inset `left-3 right-3` in GlassShell.
- **Legacy razor rim** (`.obsidian-card::before`): 1.2px, `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)` — 3.3× brighter.
- Green variants: ai-bio sheet `rgba(0,255,136,0.3)`, celebration `rgba(0,255,136,0.35)`, drop card `var(--accent-glow)`.
- completion-meter omits it entirely; go-live-checklist includes it (adjacent components).

---

## Typography

### Families (app/layout.tsx)
- **Inter** (`next/font/google`, variable `--font-inter`) → `--font-sans` with `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto` fallbacks. Body default.
- **Space Mono** weights 400 + 700 (`--font-mono`) — labels, numbers, data, ALL button text on green CTAs, event-ish micro-copy. ⚠️ `@theme` in globals.css defines `--font-mono: ui-monospace, "SF Mono", Menlo…` — the layout variable overrides it on the html element, but the theme token is stale.
- Public profiles can swap body font to **Syne, Outfit, Plus Jakarta Sans** (lazy-loaded Google Fonts) via user setting.

### Sizes actually used
| Size | Usage |
|---|---|
| `text-[8px]` | drop countdown unit labels (block-renderer) |
| `text-[9px]` | featured badge, "NEW ·" chip, v2 badge |
| `text-[10px]` font-mono uppercase tracking-widest | THE micro-label pattern (~40+ uses): section labels, kickers, checklist labels, stat labels |
| `text-[11px]` | link meta rows, suggestion chips, action pills, char counters |
| `text-xs` (12px) | subtitles, meta, descriptions, errors, footer |
| `text-[13px]` | auth error blocks, step subs |
| `text-sm` (14px) | card titles (`font-medium`), body, buttons, inputs-in-cards |
| `text-base` (16px) | link-card titles (mobile), CTA text, bottom-sheet title |
| `text-lg` (18px) | countdown digits, sidebar wordmark, vault code input |
| `text-xl` (20px) | drop title, auth input text (`text-[20px]`), portal headers |
| `text-2xl` (24px) | profile name, celebration title, text-block headings, stat values |
| `text-3xl` (30px) | stats card value, tip amount |
| `text-[32px]` | auth step titles (`leading-[1.05]`) |
| `text-4xl` (36px) | cinematic hero name, paywall emoji |
| `.heading-xl` | 2.5rem → 3.5rem@640 → 4.5rem@1024, weight 800, `letter-spacing: -0.03em` (marketing) |
| `.heading-lg` | 2rem → 2.5rem@640, weight 700, `-0.02em` |

### Weights
400 (body), 500 (`font-medium` card titles), 600 (`font-semibold` CTAs, titles), 700 (`font-bold` headings, mono CTAs), 800 (`.label`, `.heading-xl`, toast, btn-accent-solid).

### Letter-spacing / line-height
- `tracking-widest` (0.1em) on every mono micro-label; `.label` class uses `letter-spacing: 2px`.
- `tracking-[0.3em]` on 6-digit code inputs.
- `leading-[1.05]` auth titles; `leading-relaxed` bios/text blocks; `tabular-nums` on all counters/timers.

### iOS zoom prevention
Global, platform-layer (globals.css:87–99): `input, textarea, select { font-size: 16px }` reverted to `inherit` at `min-width: 768px`. No per-input handling needed.

---

## Spacing & Layout

### Padding actually used in cards
- Card content: `p-4` (16px) most block cards · `p-5` (20px) vault/FAQ/contact/checklist · `p-6` (24px) obsidian-card/dialogs · `p-7` (28px) celebration.
- Link-row cards: `px-4` with fixed `height: 60` (links) / `height: 72` (collections).
- `.glass-brick`: 24px desktop → **16px on ≤640px**.
- BottomSheet content: `16px 20px 24px`; header title `8px 24px 12px`.

### Gaps (four different card-grid gaps live!)
- Dashboard canvas grid: `gap: 12px` (gap-3), 2 cols, `max-w-[800px]`.
- Public profile card grid: `gap-2.5` (**10px**), 2 cols, `max-w-[480px] px-4`.
- Profile stats grid: `gap-3` (12px).
- BentoGrid (modules): `gap-4` (16px); `.bento-grid` CSS 16px → 10px ≤640px.
- Row internals: `gap-3` (icon–text), `gap-2` (chips).

### Border radius (the full zoo, by frequency)
| Radius | Where |
|---|---|
| `var(--block-radius, 16px)` | public profile cards — user-configurable: 0 / 8 / 12 / 16 (default) / 999px |
| 12px `rounded-xl` | the most common fixed radius: inputs-in-cards, buttons-in-cards, icon tiles, banners, countdown tiles, nav items |
| 16px `rounded-2xl` | block cards (vault/drop/product/FAQ/etc.), ConfirmDialog, celebration, BioCard, auth inputs/CTA |
| 8px `rounded-lg` | chips, top-bar buttons, price badge, small tiles |
| 20px | add-picker popover, AI chat panel (desktop), glass-brick mobile, link-card hover-glow overlay |
| 24px `rounded-3xl` | BottomSheet top corners, ai-bio sheet, bento-canvas, paywall (legacy) |
| 32px | `.obsidian-card` / `.glass-brick` / `.glass-card` — entire legacy glass family, link-card, link-card-3d |
| 40px | dashboard phone frame |
| 50px / `rounded-full` | pills, `.btn-obsidian`/`.btn-accent`, Button primitive, status pill, toggles, avatars |
| 4px `rounded` | video duration chips |

### The glass card recipe — as implemented (canonical, lib/glass.ts)
```ts
glass.card       bg rgba(255,255,255,0.03) · border 0.5px solid rgba(255,255,255,0.08)
                 · radius var(--block-radius, 16px) · shadow inset 0 1px 0 rgba(255,255,255,0.06)
glass.cardHover  bg 0.05 · border 0.5px @ 0.14 · inset reflection 0.1
glass.cardSelected  bg rgba(0,255,136,0.03) · border 0.5px rgba(0,255,136,0.25)
                    · shadow inset 0 1px 0 rgba(0,255,136,0.1), 0 0 0 2px rgba(0,255,136,0.08)
glass.input      bg 0.04 · border 0.5px @ 0.08 · radius 10px
glass.panel      bg #0a0a0a · border 0.5px @ 0.06 · inset 0 1px 0 @ 0.04
```
GlassShell (block-renderer) wraps every non-bare card: reflection line div (`left-3 right-3 h-px`, glassReflection gradient) + `whileHover={{ y: -1 }}` + `transition: all 150ms ease`.

### The LEGACY glass recipe (globals.css, still live on bento/link/vault-portal surfaces)
```css
.glass-brick / .obsidian-card / .glass-card
  bg rgba(255,255,255,0.01) · backdrop-filter blur(40px) saturate(220%)
  · border 1px solid rgba(255,255,255,0.12) · radius 32px · padding 24px
  · shadow 0 10px 30px rgba(0,0,0,0.3)
  · ::before razor rim 1.2px, peak rgba(255,255,255,0.4)
  :hover → translateY(-5px) scale(1.02), bg 0.05, border 0.2
  ≤640px → padding 16px, radius 20px
```

### Dashboard layout (app/dashboard/page.tsx)
```
Top bar      h-12 (48px) fixed, z-50, bg #080808, border-b white/[0.06],
             inset 0 -1px 0 rgba(255,255,255,0.04)
Sidebar      w-[200px] fixed left, z-40, bg #080808, border-r white/[0.06]
Canvas       fixed inset, lg:ml-[200px] lg:mr-[360px], bg #060606,
             px-3 sm:px-6 pt-14 pb-10; grid 2 cols gap 12px max-w-[800px]
Preview      w-[360px] fixed right, z-40, bg #080808, p-6;
             phone frame 280×560 radius 40 border 1.5px white/0.1;
             iframe 375×812 scaled 0.747
Edit rail    w-[360px] fixed right z-50, bg #0a0a0a, border-l 1px white/0.06,
             slides x:360→0 spring 350/32; mobile = BottomSheet 85vh
Z-index      sidebar 40 · drawer/top-bar/rail 50 · picker 60 · mobile preview 80
             · modals 100 · ConfirmDialog 200 · lightbox 200 · toast 1000
```

### Safe areas & touch
`.pt-safe`, `.pb-safe`, `.pb-safe-12/16` utilities; body gets `padding-bottom: env(safe-area-inset-bottom)`; `.btn-touch` min 48×48; Button primitive sizes enforce 44px+ (Apple HIG); `.tap-feedback` `scale(0.97)` 120ms `cubic-bezier(0.2,0.8,0.2,1)`.

---

## Every Card/Block Type (block-renderer.tsx — public profile)

All wrapped by **GlassShell** (reflection line + hover y:-1) except bare types `social_link`, `text`. Shared springs in this file: `spring = 400/30`, `gentleSpring = 300/24`. Starred priority adds a pulsing 1px `rgba(0,255,136,0.4)` border overlay (`opacity [0.4,1,0.4]`, 2s ∞). `config.animation` maps to Tailwind `animate-pulse`/`animate-bounce`.

### Link card
- Standard row: `getButtonCardStyles(buttonStyle)` background (see below), fixed **height 60**, `px-4 gap-3`. Icon tile `w-8 h-8 rounded-lg`, bg = `{brandColor}15` (8% hex-alpha), colored brand icon. Title `text-sm font-medium truncate`; sublabel `text-[11px] font-mono opacity-50`. Trailing `ArrowUpRight size 14, opacity 50→80` on hover. `whileTap scale 0.98`, spring 400/30.
- **Button styles** (user-selectable, applies to link/whatsapp rows):
  - `glass` (default): bg `rgba(255,255,255,0.04)`, border 0.5px @0.12, inset reflection 0.08, `backdrop-filter: blur(8px)`, text `#f0f0f0`. Hover: bg 0.08, border 0.2.
  - `gradient`: `linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,100,255,0.1) 50%, rgba(150,0,255,0.1))`, animated `gradientShift 4s ease infinite`, `backgroundSize 200% 200%`.
  - `glow`: accent-tinted — bg `rgba(accent,0.06)`, border 0.5px @0.3, shadow `0 0 20px rgba(accent,0.15)` → hover `0 0 32px @0.25`; text = accent.
  - `neon`: transparent bg, `1.5px solid rgba(accent,0.6)`, `text-shadow 0 0 8px`, shadow `0 0 12px @0.4 + inset 0 0 12px @0.05` → hover doubles.
- Featured layout (thumbnail): height 120, full-bleed `<img>` + `bg-gradient-to-t from-black/80 via-black/20`, "FEATURED" badge `text-[9px] font-mono bold px-2 py-0.5 rounded-full` in `${accent}33`/accent.
- Brand detection: YouTube `#ff0000`, Instagram `#E1306C`, X `#ffffff`, Discord `#5865F2`, Spotify `#1DB954`, TikTok `#ffffff`, Twitch `#9146FF`, GitHub `#ffffff` — all inline SVGs (16px), not lucide.

### Collection card
- Row on `glass.card`, **height 72**. Icon tile `w-9 h-9 rounded-xl bg-white/[0.06]` + lucide `Folder size 16 text-[#c9c9d1]`. "{n} links inside" `text-[11px] font-mono text-[#c9c9d1]`. ChevronRight in accent, rotates 90° when inline-expanded (spring 500/30).
- Two open modes: full-page Apple-style transition (via `onOpenCollection`) OR inline expand: `height 0→auto` gentleSpring, children indented `pl-4 border-l white/[0.07] ml-5`, staggered `delay i*0.06`.

### Vault card (email-gated) — amber identity
- Container: `bg-amber-500/[0.04] border border-amber-500/[0.15] rounded-2xl`; top accent line `h-[2px] gradient via-amber-500/40`.
- **Locked**: lock badge `w-9 h-9 rounded-full bg-amber-500/[0.08] border-amber-500/[0.2]`, inline padlock SVG `text-amber-400/80`, wiggle on hover `rotate [-3,3,0]` 0.3s. "Email gated" `text-[10px] text-amber-400/60 font-mono`. Content teaser: first 50 chars with `filter: blur(4px)`.
- **Email step**: input `bg-black/40 border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-amber-500/30`; submit = solid accent, full-width, `rounded-xl py-3 font-mono font-semibold`, "Send unlock code →".
- **Code step**: slides in `{opacity 0, x:20}` spring 400/30; 6-digit input `font-mono text-lg tracking-widest text-center`, digits colored accent.
- **Unlocked**: scale `0.95→1` spring 400/30. Check badge on `var(--accent-soft)`; "Unlocked" in accent mono. Revealed text `font-mono whitespace-pre-wrap text-[#e0e0e0]`; Download/Access buttons solid accent `rounded-xl px-4 py-2.5`.
- Unlock persisted per-block in `localStorage vault_unlocked_{id}`. If `revealBlock` attached → RevealedPayload instead (see below).

### Drop card (countdown) — accent-tinted identity
- Container: bg `${accent}0a` (~4%), `1px solid ${accent}33`, rounded-2xl; top line `h-[2px]` accent gradient.
- **Scheduled**: "DROP · SCHEDULED" `text-[10px] font-mono bold tracking-wider` accent. Countdown grid 3–4 cols `gap-2`: tiles `bg-black/40 rounded-lg px-2 py-2`, digits `font-mono font-bold text-lg` accent, tick animation per-value `{scale 1.1, opacity 0.7}→{1,1}` spring **500/20**; labels `text-[8px] font-mono text-[#c9c9d1]`.
- **Live**: pulsing 2px accent dot (`opacity [1,0.3,1]` 1.5s ∞) + "DROP · LIVE". CTA "Access now →" solid accent full-width `rounded-xl px-4 py-3 font-mono font-semibold text-black`. Reveal-text panel `bg-black/40 border-white/[0.06] rounded-xl font-mono`.
- **Limited spots**: badge `text-[10px] font-mono px-2 py-0.5 rounded-full` — live: `${accent}14` bg / `${accent}40` border; sold out: `rgba(255,85,85,0.1)` / `#ff5555`. Claim button → claim API → reveal.
- **Ended/sold out**: `bg-white/[0.02] border-white/[0.06] rounded-xl text-[#c9c9d1] font-mono text-center` panel.
- (Separate `drop-card.tsx` dashboard variant uses CSS vars `--accent-faint/border/glow`, countdown tiles `bg-white/[0.03] border-white/[0.07] rounded-xl`, digits `text-lg sm:text-2xl tabular-nums`, tick = 0.2s easeOut tween — NOT spring.)

### Product card — blue identity
- `bg-blue-500/[0.03] border border-blue-500/[0.15] rounded-2xl`. Thumbnail region h-90 with `from-[#0a0a0a]/90` scrim + "SHOP" badge `bg-blue-500/20 text-blue-400 text-[9px] font-mono bold rounded-full`; no-image fallback h-60 `from-blue-500/10` gradient + `ShoppingBag size 20 text-blue-400/40`.
- Price `text-base font-mono font-bold` in accent. Buy CTA solid accent `rounded-xl px-4 py-2.5`. If Stripe not connected: inline setup notice `bg white/0.02 border 0.5px white/0.06 rounded-xl` + "Go to Payments →" accent link (owner-facing).

### YouTube card — red identity
- **Video mode** (pinned URL): `bg-red-500/[0.03] border-red-500/[0.15] rounded-2xl hover:border-red-500/30`; thumb h-160 (`maxresdefault.jpg` → `hqdefault` fallback), `whileHover scale 1.02` 0.3s; center play `w-14 h-14 rounded-full bg-red-600/90`.
- **Channel mode** (API): thumb h-100, play `w-10 h-10`; "NEW · {timeAgo}" and duration chips `bg-black/70 text-[9px] font-mono px-1.5 py-0.5 rounded`; views `text-[10px] text-[#c9c9d1] font-mono`.
- Fallback (API dead): `linear-gradient(135deg, rgba(255,0,0,0.12), rgba(255,0,0,0.04))`, `1px solid rgba(255,0,0,0.2)`, solid `#ff0000` play circle, "Visit channel →" in `#ff5555`.
- Loading: container + `h-[120px] animate-pulse`.

### Stats card
`bg-white/[0.03] border-white/[0.07] rounded-2xl p-5 text-center`; value `text-3xl font-bold font-mono` accent; label `text-xs font-mono uppercase tracking-widest text-[#b8b8b8] mt-2`.

### FAQ card
`bg-white/[0.03] border-white/[0.07] rounded-2xl`, items divided `border-t white/[0.05]`. Question row `px-5 py-4 text-sm font-medium text-[#e0e0e0]`; chevron SVG rotates 180° (0.2s tween). Answer expand `height 0→auto, 0.25s easeInOut` (tween, not spring); answer `text-sm text-[#b0b0b0] leading-relaxed`.

### Discount code card
`bg-white/[0.03] border-white/[0.07] rounded-2xl p-4`. Code box `bg-black/40 border-white/[0.1] rounded-xl p-4 font-mono text-xl tracking-widest` in accent. Copy button `p-3 rounded-xl` glass; copies to clipboard + sonner "Copied!". Expiry `text-xs text-[#b8b8b8] font-mono`.

### Text / Image cards (bare — no GlassShell)
- Text heading: `text-2xl font-bold text-[#f0f0f0] text-center py-4`; body: `text-[#b0b0b0] text-sm leading-relaxed`.
- Image: plain `<img>` `rounded-2xl object-cover` (next/image avoided — kills GIFs); caption `text-xs text-[#c9c9d1] font-mono text-center`; empty: dashed `border-white/[0.08]` placeholder.

### Podcast card — amber identity
`bg-amber-500/[0.03] border-amber-500/[0.12] rounded-2xl p-4`. Artwork 52×52 `rounded-xl`. Show label `text-[10px] font-mono uppercase tracking-widest text-amber-400/60`; episode `text-sm font-medium line-clamp-2`; native `<audio controls>` with `colorScheme: dark`. Loading: `h-[120px] animate-pulse`.

### Twitch card — purple identity
- **Live**: `bg-purple-500/[0.04] border-purple-500/[0.2]`; LIVE pill `bg-purple-500/[0.15] border-purple-500/[0.3] rounded-full` with pulsing dot (`opacity [1,0.4,1]` 1.5s); viewers `text-purple-400/80 font-mono`; footer link `border-t purple-500/[0.15] text-purple-300`.
- **Offline**: neutral glass `white/[0.02]` + `w-2 h-2 bg-[#555]` dot + "Currently offline".

### Contact form card
`bg-white/[0.03] border-white/[0.07] rounded-2xl p-5 space-y-3`. Inputs `bg-white/[0.03] border-white/[0.08] rounded-xl px-3 py-2.5 text-sm font-mono focus:border-white/20`. Submit solid accent. Sent state: check circle on `var(--accent-soft)` + "Message sent!".

### WhatsApp card
Same row anatomy as link card (height 60, button styles apply); icon tile `rgba(37,211,102,0.15)` bg + `MessageCircle` in WhatsApp green `#25D366`.

### Live status pill
`rounded-full bg-[rgba(0,255,136,0.05)] border-[rgba(0,255,136,0.2)]`; beeping dot `#00ff88` with shadow `0 0 10px + 0 0 20px #00ff88`, pulse `opacity [1,0.5,1]` 1.5s ∞ + ping ring `scale [1,2] opacity [0.5,0]`; text `font-bold uppercase tracking-wider`. Entrance `{opacity 0, scale 0.9, y:-10}` spring 300/25. Sizes sm/md/lg (`px-3 py-1.5` → `px-6 py-4`).

### Lock wrapper states (any card, lockType ≠ none)
- **email**: identical to vault amber recipe.
- **payment**: neutral glass `white/[0.02]` p-5, 💰 emoji, price `text-lg font-mono bold` accent, "Buy to unlock →" solid accent.
- **password**: 🔑 emoji, inline row form — input `bg-white/[0.03] border-white/[0.08] rounded-xl px-3 py-2.5 font-mono` + accent "Unlock" button; error "Wrong password" `text-red-400`.
- **age**: 🔞 emoji `text-2xl`, centered, "I am 18 or older" solid accent `px-6 py-3`.

### Reveal system (RevealedPayload)
Fade-in `{opacity 0, scale 0.95, y:10}` spring 300/24; green divider — two 1px gradient lines flanking "UNLOCKED" `text-[10px] font-mono uppercase tracking-widest` in accent. Payload renders with `isReveal=true` (skips lock/glow/animation chrome).

### Bento modules (dashboard "modules" system — LEGACY glass)
All on `.glass-brick` (bg 0.01, 1px border 0.12, radius 32→20 mobile) except podcast + youtube-channel (bespoke tinted rounded-2xl, no framer). Notable exact values:
- **Payment**: buy CTA `bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-bold rounded-xl px-6 py-3`; hover green ring `rounded-[32px] border-[#00ff88]` at opacity 0.3; price badge `bg-[#00ff88] text-black text-xs font-bold rounded-lg`.
- **Quick tip**: 1×1 pulsing ring `scale [1,1.05,1] opacity [0.3,0,0.3]` 2s ∞; amount `text-3xl font-bold text-[#00ff88]`; pills selected `bg-[#00ff88] text-black`.
- **Vault teaser**: lock tile `w-16 h-16 rounded-2xl from-[rgba(0,255,136,0.2)] to-[0.05]`, pulse ring `border-2 border-[#00ff88] scale [1,1.1,1]`; blurred bg image `blur-xl opacity-30`; Unlock pill `rounded-full bg-[#00ff88] hover:bg-[#00cc6a]`.
- **Live stream**: live avatar `from-red-500 to-red-600` + `shadow 0 0 20px rgba(239,68,68,0.5)`; LIVE badge `bg-red-500/20 text-red-400 border-red-500/30`.
- **Social hub**: 4-col tile grid, brand gradients (IG `purple-500→pink-500→orange-500`, TikTok `black→#69C9D0→#EE1D52`, Discord `#5865F2→#7289DA`, LinkedIn `#0077B5→#00A0DC`); tiles `whileHover {scale 1.1, y:-2}`.
- **Spotify**: art tile `from-[#1DB954] to-[#191414]` + glow `0 0 20px rgba(29,185,84,0.3)`; embed heights 80/152/352.
- **YouTube-channel**: custom red `rgba(255,60,60,*)` family; play `w-14 h-14 bg-[rgba(255,60,60,0.9)]` glow `0 0 20px rgba(255,60,60,0.4)`; thumb zoom `group-hover:scale-105 duration-500`.
- **Image**: aspect square/3-4/video; hover caption slides up `translate-y-full→0 duration-300`; lightbox `z-[200] bg-black/90 backdrop-blur-xl`.

---

## Buttons

### Button primitive (components/ui/button.tsx) — pill-shaped
Base: `rounded-full font-semibold gap-2 transition-all duration-150 active:scale-[0.97]`, focus ring `ring-2 ring-[#00ff88] ring-offset-2 ring-offset-[#030303]`, `disabled:opacity-50`, `.btn-touch`.
Sizes: default `h-12 px-7 min-h-[48px] text-sm` · sm `h-11 px-5 min-h-[44px]` · lg `h-14 px-10 min-h-[56px] text-base`.
| Variant | Style |
|---|---|
| default/obsidian | `bg-white/0.05 backdrop-blur-xl border white/0.15 text-white`, hover `bg 0.1 border 0.25 -translate-y-1`; obsidian adds ::before razor rim |
| outline | transparent, `border white/0.2`, hover bg 0.05 |
| ghost | transparent, `text-[#888]`, hover `bg white/0.05 text-white` |
| destructive | `bg-red-600 hover:bg-red-700 text-white` |
| accent | `bg-[rgba(0,255,136,0.1)] border-[rgba(0,255,136,0.3)] text-[#00ff88]`, glow `0 0 20px @0.1` → hover `0 0 40px @0.2`, `-translate-y-1` |
| accent-solid | `bg-[#00ff88] text-[#030303] font-bold`, glow `0 0 30px @0.3` → hover `0 0 50px @0.5, scale 1.02` |

### The de-facto in-card CTA (used ~30×, NOT the primitive)
```
w-full bg-[#00ff88] (or var(--accent)) text-black font-mono font-semibold
rounded-xl px-4 py-3 text-sm hover:opacity-90 disabled:opacity-50
```
This inline pattern — mono font, 12px radius, black text, opacity hover — is what block cards, vault forms, auth CTAs (rounded-2xl, minHeight 56, glow `0 0 40px @0.35`), and dashboards actually use. The pill Button primitive is mostly marketing pages.

### CSS button classes (globals.css, marketing/legacy surfaces)
`.btn-obsidian` / `.btn-accent` / `.btn-accent-solid`: `padding 14px 28px, radius 50px, min-height 48px`, hover `translateY(-3px)`, active `translateY(-1px) scale(0.98)`, 0.3s `cubic-bezier(0.2,0.8,0.2,1)`. `.back-btn`: transparent, `1px white/0.2` border, full-width.

### Top-bar buttons (dashboard)
Ghost: `text-xs font-mono px-3 rounded-lg hover:bg-white/[0.04] active:scale-[0.97] minHeight 36`. Primary "+ Add link": `bg-[#00ff88] text-black font-mono font-semibold text-xs rounded-lg minHeight 36`.

### button-variations.tsx — off-system (blue/cyan Tailwind, CSS-only transitions; likely dead code)

---

## Inputs & Forms

### Auth inputs (BigInput — sign-up/sign-in screens)
```
bg rgba(255,255,255,0.03) · border 0.5px solid rgba(255,255,255,0.1)
radius 16 · padding 18px · minHeight 60 · text-[20px] font-semibold text-white
placeholder #b8b8b8 · outline-none
```
⚠️ **No focus state at all** — `outline-none` with no replacement ring/border. Uncontrolled inputs (`defaultValue` + refs) by hard rule (Jul 4 hydration outage). Password variant: `paddingRight 56` for Eye/EyeOff toggle. Attrs: `autoCapitalize/autoCorrect off, spellCheck false, translate no, enterKeyHint`.

### In-card inputs (block renderer, dashboards)
`bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#e0e0e0] font-mono outline-none focus:border-white/20` — focus is a border-brighten only. Vault variant: `bg-black/40 border-white/10 focus:border-amber-500/30`. AI-bio: `focus:border-[#00ff88]/30`. Datetime: `focus:border-[#00ff88]/30`.

### `.input-obsidian` (legacy CSS class — vault-portal, module/product editors)
`bg white/0.05 · 1px border white/0.15 · radius 16px · padding 14px 20px · 1rem · min-height 48px`; focus: `border rgba(0,255,136,0.5)` + glow `0 0 20px rgba(0,255,136,0.1)` — the only input with a real focus glow.

### Error / status blocks (auth)
- Error: `rounded-xl px-4 py-3 text-[13px]`, bg `rgba(255,85,85,0.08)`, border `0.5px rgba(255,85,85,0.25)`, `#ff5555`.
- Network retry (tappable): amber — bg `rgba(245,158,11,0.08)`, border `@0.3`, `#f59e0b`, minHeight 48.
- Password strength: `h-1` bar, `#00ff88`/`#f59e0b`/`#ff5555` at ≥8/≥6/<6 chars, glow at strong.

### shadcn primitives (input.tsx / textarea.tsx / card.tsx) — **LIGHT THEME, DO NOT COPY**
`bg-white border-2 border-gray-300 focus:border-blue-500` — unused scaffold contradicting the entire system. Real inputs are inline-styled everywhere.

---

## Motion / Animation Patterns

### Spring configs by actual frequency (grep-verified)
| stiffness/damping | uses | role |
|---|---|---|
| 120/20 | 17 | homepage marketing reveals (slow, floaty) |
| 300/30 | 16 | dashboard, expands, toasts, bento — de-facto standard |
| 300/28 | 12 | auth step transitions, checklist ("standard" preset) |
| 300/24 / 280/24 | 10 | profile hero + card grid entrances |
| 500/30 | 4 | micro-snaps (chevron rotate, toggle knobs) |
| 400/32 | 3 | "snappy" preset (drawer slide) |
| 380/32 mass 1 | 2 | BottomSheet slide-up |
| 400/30 | — | block-renderer default (`spring` const) |
| 300/24 | — | block-renderer `gentleSpring` |
| ~17 one-offs | 1 each | 500/20 countdown tick, 420/26 orb, 360/28 AI panel, 350/32 edit rail, 350/18 celebration badge, 340/26 chips, 320/32 bio sheet, 320/28 confirm, 200/20 avatar, etc. |

CLAUDE.md presets (snappy 400/32, standard 300/28, gentle 180/24, bouncy 350/20): only `standard` is genuinely common; `bouncy` appears **zero** times; the two most-used springs (120/20, 300/30) aren't in the preset list at all. **28 distinct pairs total.**

### Entrance patterns
- Cards: `{opacity 0, y: 12–16, scale 0.98}` → spring, `delay: i * 0.05` (or 0.06). Profile grid uses `whileInView` + `viewport {once: true, margin: "-40px"}`.
- Steps/pages: `{opacity 0, x: ±20–40}` AnimatePresence `mode="wait"`.
- Modals: `{opacity 0, scale 0.92–0.97, y: 8–24}`; sheets `{y: "100%"}`.
- `staggerChildren` used only twice (0.05); manual delay ladders are the norm (profile hero: 0.1/0.2/0.3/0.35/0.4/0.5+i·0.05).

### Press/hover conventions
`whileTap scale 0.98` (cards) / 0.95 (chips) / 0.9 (orb); `whileHover y: -1` (canonical cards) vs `translateY(-5px) scale(1.02)` (legacy CSS) vs `scale 1.02–1.1` (bento). CSS `active:scale-[0.97]` on buttons.

### Ambient loops
Starred glow `opacity [0.4,1,0.4]` 2s · live dots `opacity [1,0.3–0.5,1]` 1.5s · pulse rings `scale [1,1.05–1.1,1]` 2s · SiriOrb conic spins 7s/11s linear · shimmer `backgroundPosition 200%→-200%` 1.5–2s linear · `.kinetic-shimmer` text 4s.

### BottomSheet drag/dismiss (exact)
`drag="y"`, `dragConstraints {top:0, bottom:0}`, `dragElastic {top:0, bottom:0.4}`; dismiss at `offset.y > 120px` OR `velocity.y > 500`; entry spring 380/32 mass 1; backdrop `rgba(0,0,0,0.5)` blur(4px) fade 0.18s; handle 40×4 `rgba(255,255,255,0.2)`; body scroll locked; Esc closes.

### Non-spring exceptions (violations of the springs-only rule)
FAQ expand 0.25s easeInOut · drop-card.tsx countdown 0.2s easeOut · dashboard-sidebar drawer CSS 200ms · link-card/link-card-3d/media-preview pure CSS 150–300ms · button-variations CSS 300–500ms · paywall/color-picker CSS `animate-scale-in` · all bento-module hover/tap use framer defaults (no spring specified).

### Reduced motion
Global: `prefers-reduced-motion` collapses all animation/transition durations to 0.01ms (deliberately not `animation: none` — avoids frozen-invisible keyframe states).

---

## Navigation Patterns

### Dashboard sidebar (app/dashboard/page.tsx — the live one)
200px, `bg-[#080808] border-r white/[0.06]`. Items `gap-3 px-3 py-2.5 rounded-xl text-sm font-mono`, lucide 16px. Active: `bg-[#00ff88]/[0.08] text-[#00ff88] border-[#00ff88]/[0.15]`; inactive `text-[#b8b8b8] hover:bg-white/[0.03]`. Footer avatar 28px accent-tinted circle. Mobile: drawer slides `x: -200→0` spring 400/32 over `bg-black/60` scrim.
⚠️ A second `dashboard-sidebar.tsx` component exists: **220px**, neutral active state (`bg-white/[0.05]`), CSS-transition drawer, h-14 mobile bar — different from the live one on every axis.

### Tab/segment switching
Segmented chips: selected `bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]`, unselected `bg-white/[0.03] border-white/[0.07] text-[#b8b8b8]` — used for size/style/lock pickers. Pill toggle (deep-portal): container `bg-white/0.05 rounded-full p-1`, active segment `bg-[rgba(0,255,136,0.2)] text-[#00ff88] rounded-full px-4 py-1.5`.

### Toggles (five different sizes exist)
32×18 canvas ToggleSwitch · 36×20 AI banner (`w-9 h-5`, knob spring 500/30) · 32×16 properties panel (`w-8 h-4`, CSS) · 48×28 module/product editors (`w-12 h-7`) · 56×32 live-status (`w-14 h-8`, knob spring 500/30, on-knob glow `0 0 10px #00ff88`).

### Modals hierarchy
Mobile-first: BottomSheet everywhere (85vh default, 95vh fullHeight); desktop keeps right rails (360px, slide spring 350/32) and popovers (`#0f0f0f`, radius 20, spring 400/28). ConfirmDialog: centered, z-200, `#0a0a0a` radius 16, spring 320/28, amber AlertTriangle badge. Celebration/paywall/cropper at z-100.

---

## Icons

**Library: lucide-react** — but only ~60% adopted.
- Card-type mapping (dashboard picker): Link=link, Folder=collection, Lock=vault, Timer=drop, Youtube=youtube, ShoppingBag=product, Mic=podcast, Tv/Radio=twitch, Music=spotify, Image, AlignLeft=text, HelpCircle=faq, Mail=contact, Tag=discount, MessageCircle=whatsapp, BarChart2=stats, Share2=social.
- Chrome: Menu, X, Plus, Search, Settings, LayoutGrid, Paintbrush, CreditCard, GripVertical (drag), MoreHorizontal, Pencil, Trash2, Copy, CopyPlus, Star, ChevronRight/Down/Up, ArrowUpRight/Right/Left, ExternalLink.
- AI signifier: **Sparkles** (4 files — orb, bio writer, banners). Analytics: Eye, Users, MousePointerClick, TrendingUp, Smartphone/Monitor/Tablet, Globe. Status: Check, AlertCircle, AlertTriangle, Loader2 (spin).
- **Inline SVG instead of lucide**: all 8 brand icons in block-renderer (YouTube/IG/X/Discord/Spotify/TikTok/Twitch/GitHub), GoogleIcon (auth), padlock (vault), checkmarks, play triangles.
- **Emoji as icons** (inconsistency): 🔒 vault (4 files), 🔗 default link, 💰 payment lock, 🔑 password lock, 🔞 age gate, 📦 product placeholder, 🎉 celebrations, 🎙️ podcast fallback, 💸 quick-tip, 🔓 unlocked.

---

## Known Inconsistencies (ranked for the design review)

1. **TWO GLASS SYSTEMS.** Canonical (`lib/glass.ts`: bg 0.03, 0.5px border @0.08, radius 16, subtle inset reflection, hover y:-1) vs legacy (`globals.css` `.obsidian-card`/`.glass-brick`/`.glass-card`: bg 0.01, 1px border @0.12, radius **32px**, blur(40px) saturate(220%), 1.2px razor rim @0.4, hover translateY(-5px) scale(1.02)). Public profile block cards + new dashboard UI use canonical; bento modules, link-card, link-card-3d, vault-portal, deep-portal, marketing pages use legacy. A native rebuild must pick ONE.
2. **Light-theme shadcn scaffold still present**: `card.tsx`, `input.tsx`, `textarea.tsx` are white-bg/gray-border/blue-focus. If any screen imports them, it renders off-brand. `paywall-modal.tsx` (slate gradients, **stale $4.99 price**), `image-cropper.tsx`, `file-upload.tsx` (blue dropzone), `color-picker.tsx`, `button-variations.tsx` (blue/cyan) are pre-Obsidian survivors.
3. **Border-radius zoo**: 4/8/10/12/16/20/24/32/40/50px all live. Most jarring: link-card's hover-glow overlay is `rounded-[20px]` inside a 32px card; bento glow rings hardcode `rounded-[32px]` while the card drops to 20px on mobile.
4. **Four+ error reds** (`#ff5555`, `#ff7777`, `#ff8888`, red-400/500, `rgba(255,60,60)`), **three ambers** (`#f59e0b`, amber-400 text, `rgba(255,180,0)` podcast), **two greens** (`#00ff88` + `#00cc6a` gradient partner not in any token file).
5. **Secondary-gray sprawl**: `#c9c9d1`, `#b8b8b8`, `#b0b0b0`, `#888888`, `#8a8a8a`, `#d4d4d8`, `#d8d8d8`, `#555`, `#444`, `#2e2e2e`, zinc-400, gray-400 — CLAUDE.md's `#888/#555/#444/#222` scale is not what shipped. `#c9c9d1` and `#888888` are the two de-facto secondaries, split roughly by file age.
6. **Spring sprawl**: 28 distinct stiffness/damping pairs; documented presets barely used; `bouncy` never; the two most common springs (120/20, 300/30) are undocumented. Multiple non-spring tweens and CSS transitions violate the "springs ALWAYS" rule (FAQ, countdown tick, sidebar drawer, all legacy components).
7. **Double hover transform**: GlassBrick applies framer `whileHover {y:-5, scale:1.02}` on top of CSS `.glass-brick:hover translateY(-5px) scale(1.02)` — compounding movement.
8. **whileHover on non-interactive elements** persists (bento-stat-card, BentoCard's unconditional `cursor-pointer`) — the exact dead-click pattern the July Clarity audit flagged.
9. **Two sidebars**: live 200px/green-active vs orphaned `dashboard-sidebar.tsx` 220px/neutral-active/CSS-drawer/h-14. Also "Links" (desktop) vs "Cards" (mobile) label mismatch.
10. **Grid gap drift**: dashboard 12px, profile cards 10px, profile stats 12px, bento 16px.
11. **No focus state on auth inputs** (`outline-none`, nothing added) while `.input-obsidian` has a full green focus glow and in-card inputs brighten borders — three focus behaviors.
12. **Auth screens diverge from each other**: sign-in uses `#b0b0b0`/`#c9c9d1` secondary text where sign-up uses white in identical slots; header `py-3` vs `py-4`.
13. **Undefined CSS classes**: `vault-locked` and `vault-overlay` referenced in vault-portal.tsx don't exist in globals.css — the lock overlay panel renders without its intended bg/border.
14. **Toggle-switch zoo**: 5 sizes (32×16, 32×18, 36×20, 48×28, 56×32) with different animation methods (CSS vs framer default vs spring 500/30).
15. **`@theme` token drift**: `--radius-sm: 16px / --radius-md: 24px / --radius-lg: 32px` don't match Tailwind's rounded-* actually used; `--font-mono` in theme (ui-monospace) is overridden by layout's Space Mono; `--color-text-muted: #b8b8b8` disagrees with CLAUDE.md `#444`.
16. **Button duality**: pill `rounded-full` Button primitive (marketing) vs mono `rounded-xl` black-on-green inline CTA (product). The product pattern is the real system.
17. **STYLES mismatch**: properties panel offers `"3d"` where docs say `solid`; drop-card exists twice (block-renderer version + drop-card.tsx) with different countdown tile styling and different tick animations (spring 500/20 vs 0.2s tween).
18. **Native `confirm()`** in module-editor and product-manager bypasses ConfirmDialog.
19. **Toast styling split**: sonner theme (`bg-white/10 blur border-white/20` + off-palette blue-500 action) vs `.toast` CSS class (solid green pill, bottom-center) vs social-proof-toast (solid `#0f0f0f` card).
20. **Icon system split**: lucide (new) vs inline brand SVGs (necessary) vs emoji (🔒🔗💰🔑🔞📦) as functional icons.
