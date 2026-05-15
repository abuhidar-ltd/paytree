# Paytree — Project Overview

Paytree is a **bio link platform for creators who monetize**. Unlike generic link-in-bio tools (Linktree, Beacons), Paytree is built for creators who sell: courses, coaching, templates, digital downloads, memberships. Every feature exists to convert profile visitors into paying customers.

**Core value prop:** One link that holds your entire creator business — paid products, gated content (Vault), crypto tips, live status broadcasts, authority stats, bento modules, and a full analytics dashboard.

**Target users:** Online educators, trading/finance creators, coaches, digital product sellers, newsletter writers, podcasters.

**Domain:** paytree.to  
**Positioning tagline:** "Your payment links, elegantly organized."

---

# Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.0.10 |
| UI runtime | React | 19.2.1 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 (via `@tailwindcss/postcss`) |
| Auth | Clerk (`@clerk/nextjs`) | latest |
| Database | PostgreSQL via Supabase | — |
| ORM | Prisma | 7.x |
| Prisma adapter | `@prisma/adapter-pg` | — |
| Payments | Stripe | latest |
| Email | Resend | latest |
| File storage | Vercel Blob | — |
| AI | OpenAI API | — |
| Analytics charts | Recharts | — |
| Animations | Framer Motion | — |
| Toasts | Sonner | — |
| Icons | lucide-react | ^0.561.0 |
| Drag and drop | dnd-kit suite | — |
| Validation | Zod | v4 (^4.2.1) |
| Deployment | Vercel | — |

**Key scripts:**
```
npm run dev          # next dev
npm run build        # next build
npm run db:push      # prisma db push
npm run db:studio    # prisma studio
npm run seed:demo    # tsx scripts/seed-demo.ts
```

---

# Design System

## Aesthetic

**Obsidian Terminal** — dark, minimal, monochromatic with a single neon accent. Inspired by developer tools and trading terminals. Not skeuomorphic, not colorful, not glassmorphic in a trendy way — serious, focused, premium.

## Colors

| Token | Value | Use |
|---|---|---|
| Page background | `#030303` | Public profile, root wrapper |
| Dashboard/card bg | `#080808` | Dashboard, sidebar, cards |
| Card surface | `bg-white/[0.03]` | Panel cards |
| Card border | `border-white/[0.07]` | Standard card border |
| Accent (neon green) | `#00ff88` | CTAs, active states, highlights |
| Accent glow | `rgba(0,255,136,0.3)` | Shadows, glows |
| Body text | `#e0e0e0` | Primary readable text |
| Muted text | `#888` | Secondary info |
| Faint text | `#444` | Labels, inactive nav items |
| Danger | `red-400` / `red-500/30` | Delete, warning |

**NEVER use:** blue, navy, indigo, purple, champagne, rose-gold, platinum. These were from an old design system and must be replaced if encountered.

## Typography

- **Titles/headings:** sans-serif (`font-sans`, `--font-inter`)
- **Data, labels, buttons, code, nav items:** monospace (`font-mono`)
- **Section headings inside cards:** `text-xs font-mono uppercase tracking-widest text-white/30`

## Card Patterns

```tsx
// Standard panel card
<div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">

// Section heading inside a card
<h2 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-3">

// Primary button
<button className="bg-[#00ff88] text-black font-mono font-semibold rounded-xl px-5 py-3 text-sm hover:opacity-90 transition-opacity">

// Secondary button
<button className="bg-white/[0.03] border border-white/[0.08] text-[#e0e0e0] font-mono rounded-xl px-4 py-2.5 hover:border-white/20 transition-colors">

// Active/selected state
className="bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]"

// Inactive/unselected state
className="bg-white/[0.03] border border-white/[0.07] text-[#444] hover:border-white/20 hover:text-[#888]"

// Input field
<input className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#e0e0e0] text-sm font-mono focus:border-[#00ff88]/30 outline-none w-full">

// Pro badge
<span className="bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-xs font-mono px-2 py-0.5 rounded-full">

// Free badge
<span className="bg-white/5 border border-white/10 text-[#888] text-xs font-mono px-2 py-0.5 rounded-full">
```

## CSS Classes (globals.css)

Defined in `app/globals.css` using Tailwind v4 `@theme` and raw CSS:
- `.obsidian-card` — glass blur, white border, 32px radius, razor-rim `::before` highlight
- `.obsidian-card-static` — same without tilt/hover
- `.glass-card-hover` — used on link cards (hover lift)
- `.kinetic-shimmer` — animated shimmer text effect
- `.safe-top` / `.safe-bottom` — iOS safe area padding (use sparingly; prefer Tailwind)

React components wrapping these: `ObsidianCard`, `GlassBrick` (from `components/ui/obsidian-card.tsx`).

---

# Architecture

## App Router Structure

```
app/
├── page.tsx                        # Landing page
├── layout.tsx                      # Root layout (Clerk, fonts, Toaster)
├── globals.css                     # Tailwind v4 + design tokens
├── [username]/                     # Public profile (ISR, revalidate=60)
│   ├── page.tsx                    # Server: fetches full user data from Prisma
│   ├── profile-client.tsx          # Client: renders profile interactively
│   ├── profile-locked.tsx          # Shown when page is draft
│   └── publish-banner.tsx          # Owner-only "publish your page" CTA
├── preview/[username]/page.tsx     # Preview mode (identical to public, no tracking)
├── dashboard/
│   ├── layout.tsx                  # Shared sidebar layout (server → DashboardSidebar)
│   ├── page.tsx                    # Main dashboard (client, link editor, modules, products)
│   ├── analytics/page.tsx          # Analytics dashboard (views, clicks, vault, referrals, audience)
│   └── studio/
│       ├── page.tsx                # Server: fetches initial data → StudioEditor
│       └── studio-editor.tsx       # Client: design customizer with phone preview
├── settings/page.tsx               # Account/subscription management
├── pricing/page.tsx                # Pricing comparison page
├── login/[[...rest]]/page.tsx      # Clerk-managed login
├── register/[[...rest]]/page.tsx   # Clerk-managed registration
├── checkout/page.tsx               # Stripe checkout redirect
├── upgrade/page.tsx                # Upgrade flow
├── purchase/success/page.tsx       # Post-purchase confirmation
├── terms/page.tsx                  # Terms of service
└── privacy/page.tsx                # Privacy policy
```

## Dashboard Layout

`app/dashboard/layout.tsx` is a **server component** that calls `getCurrentUser()` and passes user data to `DashboardSidebar` (client component at `components/ui/dashboard-sidebar.tsx`).

The sidebar renders:
- Fixed 220px left column on desktop
- Slide-in drawer on mobile with hamburger toggle
- Nav: Dashboard → `/dashboard`, Design → `/dashboard/studio`, Analytics → `/dashboard/analytics`, Settings → `/settings`
- Footer: user avatar + `@username`, View Live link to public profile

## Middleware

`middleware.ts` uses Clerk's `clerkMiddleware`. Public routes (no auth required):
- `/`, `/login(.*)`, `/register(.*)`, `/sign-in(.*)`, `/sign-up(.*)`
- `/pricing`, `/privacy`, `/terms`
- `/:username`, `/preview/:username`
- `/api/stripe/webhook`, `/api/track-click`, `/api/health`

All other routes call `auth.protect()`.

## Auth Helper

`lib/clerk-auth.ts` exports:
- `getCurrentUser()` — resolves Clerk JWT → finds DB user by `clerkId`, returns full user object with subscription fields
- `getUserId()` — lightweight, returns DB user ID only
- `requireAuth()` — throws if unauthenticated

Always use `getCurrentUser()` in API routes and server components. Do not use Clerk's raw `auth()` directly.

## API Routes (58 total)

**Profile & Auth**
- `GET/PATCH /api/profile` — profile fields + theme (Zod-validated, rejects extra fields to prevent `pageStatus` injection)
- `POST /api/register` — initial user creation post-Clerk signup
- `DELETE /api/account/delete` — full account teardown including Stripe

**Links**
- `GET/POST /api/links` — list/create links; plan-gated limits
- `GET/PATCH/DELETE /api/links/[id]` — single link CRUD
- `POST /api/links/reorder` — drag-drop order sync
- `POST /api/links/folder` — create folder/Deep Portal

**Social Links**
- `GET/POST /api/social-links` — list/create
- `PATCH/DELETE /api/social-links/[id]`
- `POST /api/social-links/reorder`

**Publishing**
- `POST /api/publish` — sets `pageStatus: "published"`, Pro/Starter required

**Analytics**
- `GET /api/analytics/overview` — aggregate stats
- `GET /api/analytics/views?period=` — views time series
- `GET /api/analytics/clicks?period=` — clicks time series
- `GET /api/analytics/referrals?period=` — **Pro only**
- `GET /api/analytics/vault?period=` — vault unlock stats
- `POST /api/track-click` — public, increments click count

**Stripe / Payments**
- `POST /api/create-checkout-session` — subscription upgrade
- `POST /api/stripe/webhook` — handles all Stripe events; sends delivery email via Resend on purchase
- `POST /api/subscription/cancel` / `reactivate`
- `POST /api/products/[id]/checkout` — digital product purchase (Stripe Checkout)
- `POST /api/tips/checkout` — tip jar Stripe session

**Vault**
- `GET/POST /api/vault/items` — vault item management
- `GET/PATCH/DELETE /api/vault/items/[id]`
- `POST /api/vault/send-code` — email unlock code via Resend
- `POST /api/vault/verify-code` — validates unlock token
- `GET /api/vault/check` — checks if viewer has unlocked
- `POST /api/vault/unlock` — records unlock

**AI** (Pro-gated)
- `POST /api/ai/generate-bio` — OpenAI bio generation
- `POST /api/ai/optimize-links` — link title/order suggestions
- `GET /api/ai/insights` — AI insights for the dashboard
- `POST /api/ai/bio-history` — save/list bio versions
- `POST /api/ai/email-followups` — draft follow-up sequences

**Audience / CRM**
- `GET/POST /api/audience` — email capture list
- `GET /api/audience/stats`
- `GET /api/audience/export` — CSV export (Pro)
- `DELETE /api/audience/[id]`

**Modules & Products**
- `GET/POST /api/modules` — bento grid modules
- `PATCH/DELETE /api/modules/[id]`, `POST /api/modules/reorder`
- `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/[id]`

**Other**
- `GET /api/health` — service status check
- `POST /api/upload/profile-image` — Vercel Blob upload
- `POST /api/upload/background-image`
- `GET /api/stats` — public profile stats
- `GET /api/oembed` — oEmbed endpoint for YouTube/Spotify embed
- `GET /api/proxy/rss` — RSS feed proxy for RSS modules
- `POST /api/cron/optimize-links` — scheduled AI optimization

## Database Models (Prisma)

| Model | Key Purpose |
|---|---|
| `User` | Core user + profile + theme + subscription + live/stats fields |
| `Link` | Link tree items; supports folders, vault items, scheduling, starring |
| `Click` | Per-link click analytics with geo/UA/referrer |
| `View` | Profile view tracking with uniqueness fingerprinting |
| `SocialLink` | Platform + URL (YouTube, Spotify, Twitch, Podcast, etc.) |
| `CryptoAddress` | BTC/ETH/SOL tip addresses (Pro feature) |
| `Audience` | Email capture CRM — tied to vault unlocks |
| `Module` | Bento grid tiles (type, config JSON, span, order) |
| `Product` | Digital products with Stripe integration |
| `Purchase` | Stripe purchase records + delivery tracking |
| `LinkUnlockToken` | Time-limited email unlock tokens for locked links |
| `BioHistory` | AI-generated bio versions with prompts |
| `AiInsight` | AI-generated profile insights |

`User.heroStyle` — `"classic"` (circular avatar + ObsidianCard) or `"cinematic"` (full-bleed hero image fading to dark, content overlaps).

## Lib Utilities

- `lib/clerk-auth.ts` — auth helpers (`getCurrentUser`, `requireAuth`)
- `lib/prisma.ts` — Prisma client singleton with `@prisma/adapter-pg`
- `lib/plans.ts` — plan definitions, limits, feature flags, `resolveUserPlan()`
- `lib/link-type.ts` — auto-detects link type from URL (YouTube, Spotify, etc.)
- `lib/theme-utils.ts` — theme/color utilities
- `lib/upload.ts` — Vercel Blob upload helper
- `lib/ai-optimizer.ts` — OpenAI integration for link/bio optimization
- `lib/utils.ts` — general utilities (`cn`, etc.)

---

# Subscription Plans

| | Free | Starter | Pro |
|---|---|---|---|
| Price | $0 | $4.99/mo or $39.99/yr | $29/mo or $249/yr |
| Links | 5 | Unlimited | Unlimited |
| Modules | 3 | Unlimited | Unlimited |
| Products | 0 | 1 | Unlimited |
| Vault items | 0 | 5 | Unlimited |
| Folders | 1 | Unlimited | Unlimited |
| Publish | ✗ | ✓ | ✓ |
| Analytics | ✗ | Basic | Advanced + Referrals |
| AI features | ✗ | ✗ | ✓ |
| Scheduling | ✗ | ✓ | ✓ |
| Locked links | ✗ | ✓ | ✓ |
| Audience CSV export | ✗ | ✓ | ✓ |
| Crypto Vault | ✗ | ✗ | ✓ |
| Custom themes | ✗ | ✗ | ✓ |

**Transaction fees: 0% on all plans.** Stripe's standard processing fees apply.

Subscription statuses in DB: `free`, `trial`, `active`, `canceling`, `canceled`. Use `resolveUserPlan(user)` from `lib/plans.ts` — never check `subscriptionStatus` directly.

---

# Environment Variables

All required unless noted:

```env
# Database
DATABASE_URL=postgresql://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRODUCT_ID=prod_...
STRIPE_PRICE_ID=price_...          # Legacy single-price (kept for backward compat)
STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...

# Email
RESEND_API_KEY=re_...
# From address used in all emails: 'Paytree <noreply@paytree.to>'

# File Storage
BLOB_READ_WRITE_TOKEN=...          # Vercel Blob; images fall back to base64 if missing

# AI
OPENAI_API_KEY=sk-...              # Required for Pro AI features

# App
NEXT_PUBLIC_APP_URL=https://paytree.to
CRON_SECRET=...                    # Used by /api/cron/optimize-links
```

---

# Current State

## What's Working

- **Full auth flow** — Clerk login/register, middleware protection
- **Dashboard** — link CRUD with drag-drop reorder, folders (Deep Portals), vault items, social links, crypto addresses, bento modules, digital products
- **Studio editor** — design customizer with live phone preview; hero style selector (Classic/Cinematic); button style selector (3D, Gradient, Glass, Glow, Neon); social icon position toggle
- **Public profile** (`/[username]`) — ISR with 60s revalidation; Classic (ObsidianCard + circular avatar) and Cinematic (full-bleed hero image fading to dark) header modes; `LinkCard3D` with variant styles; Vault gating with email unlock flow; bento grid modules; product purchase
- **Left sidebar navigation** — `app/dashboard/layout.tsx` server component + `DashboardSidebar` client component; 220px fixed on desktop, slide-in drawer on mobile; active route highlighting
- **Stripe integration** — subscription checkout, webhooks, post-purchase delivery email via Resend, cancel/reactivate
- **Analytics dashboard** — views, clicks, CTR, referrals (Pro), vault unlocks, audience CRM, CSV export
- **Settings page** — subscription management, cancel/reactivate, account deletion
- **Onboarding flow** — 5-step wizard at `/onboarding`; identity, accent color, category, first link, publish; live phone preview; auto-redirects new users from `/dashboard`; marks `user.onboarded=true` on completion

## Recently Fixed / Changed

- Prisma migrated from Neon adapter to `@prisma/adapter-pg` (Supabase)
- `heroStyle` field added to `User` model and wired through API + studio + public profile
- `LinkCard3D` now applies `variant` prop styles (3D, gradient, glow, neon, outline)
- Studio editor: `links` and `socialLinks` state unfrozen; fresh data fetched on mount; placeholder cards when no real data
- Silent error handling in `dashboard/page.tsx` replaced with `toast.error` notifications
- `from` email standardized to `'Paytree <noreply@paytree.to>'` across all Resend calls
- Dashboard navigation converted from top nav to left sidebar
- Settings page restyled to Obsidian design system (removed glass-elegant, btn-elegant-press, etc.)
- Studio editor restyled to Obsidian design system
- Post-purchase delivery email implemented in Stripe webhook handler

## Known Issues / Limitations

- `safe-top` and `safe-bottom` CSS classes referenced in dashboard but may produce linter warnings (custom, not standard Tailwind)
- `.env.example` file does not exist — env vars must be inferred from code or this document

---

# Coding Rules

## Model Selection (for Claude Code)

- **Claude Sonnet** — simple fixes, styling changes, adding `toast.error`, swapping imports, single-file edits
- **Claude Opus** — new features, multi-file architectural changes, database schema changes, complex debugging

## Prompting Rules

- One focused task per prompt — don't bundle styling + logic + architecture together
- Always specify which files to touch; the agent should not touch files not mentioned
- When only styling is requested, do NOT change TypeScript logic, hooks, API calls, or conditional rendering
- Always show a summary of every file changed when the task is complete

## Code Patterns

**Toasts** — always use Sonner (`import { toast } from "sonner"`). Patterns in use:
```ts
toast.error("Failed to load data. Please refresh.")
toast.success("Saved!")
const id = toast.loading("Saving...")
toast.success("Done!", { id })
toast.error("Failed", { id })
```

**API calls** — always handle errors with toast, never fail silently:
```ts
if (!res.ok) {
  toast.error("Something went wrong. Please try again.")
  return
}
```

**Auth in API routes** — always use `getCurrentUser()`:
```ts
const user = await getCurrentUser()
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
```

**Plan gating** — always use `resolveUserPlan(user)` or `getUserFeatures(user)` from `lib/plans.ts`:
```ts
const plan = resolveUserPlan(user)
if (plan === "free") return NextResponse.json({ error: "Upgrade required" }, { status: 403 })
```

**Zod validation** — always use `.strict()` on PATCH schemas to prevent field injection.

**Prisma** — import from `@/lib/prisma`, never instantiate directly.

**Design system** — always follow the Obsidian system. Never introduce:
- Blue, navy, indigo, purple, violet color classes
- `glass-elegant`, `shadow-elegant-md`, `btn-elegant-press`, `heading-luxury-lg`
- `bg-navy-deep`, `text-platinum`, `text-champagne`, `from-champagne`, `to-rose-gold`

**Images** — all remote images are allowed (`next.config.ts` has wildcard `remotePatterns`). Use `object-cover` and `object-top` for profile hero images.

---

# Roadmap (Priority Order)

1. **AI "Ask [Creator]'s AI"** — Pro feature; embedded chat agent trained on creator's content/links
2. **Email follow-up sequences** — after vault unlock, product purchase; use `ai/email-followups` API (already exists, needs UI)
3. **Custom domain support** — map `mycreator.com` to `paytree.to/username`
4. **Mobile app** (PWA enhancement) — improve installability and push notifications
5. **Link click heatmap** — visual breakdown of which links convert by position
6. **Affiliate/referral system** — creator referral tracking with commission payouts
7. **Tip jar on public profile** — visible quick-tip button (backend already exists at `/api/tips/checkout`)
8. **Scheduled broadcasts** — auto-post live status messages on a schedule

---

# Key Decisions Made

| Decision | Rationale |
|---|---|
| **0% transaction fees on all plans** | Competitive differentiator vs Beacons (9% on free), Stan Store |
| **Cinematic vs Classic hero style** | Gives creators expressive control; mirrors Spotify/Apple Music aesthetic |
| **Sidebar navigation over top nav** | More scalable as we add features; standard SaaS dashboard pattern |
| **Left sidebar is 220px, fixed on desktop** | Narrow enough to not compete with content; wide enough to show labels |
| **Obsidian Terminal aesthetic** | Differentiates from pastel/colorful competition; resonates with trading/finance creators |
| **Modular bento card system** | YouTube, Spotify, Twitch, RSS, Stats, Payment, Vault Teaser, Quick Tip, Social Hub, Live Stream |
| **Deep Portals (nested folders)** | Link organizations beyond flat lists; unique to Paytree |
| **Vault with email unlock** | Email capture as gating mechanism — every unlock grows the audience list |
| **Crypto Vault (Pro)** | BTC/ETH/SOL tip addresses for crypto-native creators |
| **Stats counters (students, win rate, followers)** | Authority signals baked into the profile card; creator credibility at a glance |
| **ISR revalidate=60** | Public profiles cached at CDN edge; fresh within 60s without SSR cost |
| **Prisma on Supabase** | Migrated from Neon; Supabase connection pooler required for serverless |
| **`@prisma/adapter-pg` not Neon adapter** | Supabase uses standard `pg`, not Neon's WebSocket protocol |
| **Clerk for auth** | Handles email/password + OAuth + magic links; avoids building auth from scratch |
| **Resend for email** | Simple API, good deliverability; `from` always `Paytree <noreply@paytree.to>` |
| **Vercel Blob for uploads** | Tight Vercel integration; falls back gracefully if `BLOB_READ_WRITE_TOKEN` missing |
| **No `pageStatus` via profile PATCH** | Zod schema uses `.strict()` to block injection; only `/api/publish` can set status |
| **Auto-redirect to onboarding** | New users with `onboarded=false` are redirected from `/dashboard` to `/onboarding` automatically |
