# Paytree Design System

## Mobile Primitives (94% of traffic is mobile — start here)

### BottomSheet (components/ui/bottom-sheet.tsx)
iOS-style modal sheet. Use instead of centered dialogs on mobile:
backdrop tap closes, drag-handle dismisses with spring release.
```tsx
import { BottomSheet } from "@/components/ui/bottom-sheet"

<BottomSheet
  open={open}
  onClose={() => setOpen(false)}
  title="Edit card"        // optional header
  maxHeight="85vh"          // default; "auto" for content-fit
  fullHeight={false}        // true = 95vh sticky-page mode (pickers)
>
  {children}
</BottomSheet>
```
Pattern used by the dashboard: desktop keeps a right rail
(`hidden lg:flex` slide-in panel), mobile wraps the same content in
`<div className="lg:hidden"><BottomSheet …/></div>`.

### Safe-area utilities (globals.css)
```
.pt-safe      padding-top: max(env(safe-area-inset-top), 0px)
.pb-safe      padding-bottom: max(env(safe-area-inset-bottom), 0px)
.pb-safe-12   padding-bottom: max(env(safe-area-inset-bottom), 12px)
.pb-safe-16   padding-bottom: max(env(safe-area-inset-bottom), 16px)
```
Any fixed top bar gets `.pt-safe`; any fixed bottom bar / sheet footer
gets `.pb-safe-*` so buttons clear the home indicator.

### Sticky CTA (app/home-sticky-cta.tsx)
Mobile-only conversion bar that appears after the user scrolls past the
hero (fires `scroll_hero` once). Fixed bottom, z-50, `.pb-safe`,
spring-slides in, full-width #00ff88 button. Pages with a sticky CTA
need bottom padding on the content (`pb-32 sm:pb-0`) so the last
section is never hidden behind it.

### Go-live checklist (components/ui/go-live-checklist.tsx)
Glass card listing "3 steps to go live" (add card → make it yours →
publish). State derives from live data (blocks/profile) — never stored.
Current step glows #00ff88 with the action chip inline; completed steps
strike through; X (dismiss) appears only when all steps are done and
persists per-account via localStorage (`useStorageFlag`).

### Completion meter (components/ui/completion-meter.tsx)
Slim expandable % bar: photo, bio, 3+ cards, Stripe, published.
Collapsed = label + animated progress bar + %. Expanded = punch list
where every unfinished item is a deep link. Hidden at 100%.

### Publish celebration (components/ui/publish-celebration.tsx)
The reward moment: ~40 confetti particles (framer-motion keyframes, no
extra deps), spring-in glass card, animated check, live URL pill,
one-tap Copy. Inner overlay component owns its state so closing resets
everything. Trigger by state or by landing with `?published=1`.

### localStorage-backed flags (lib/use-storage-flag.ts)
```tsx
const [dismissed, setDismissed] = useStorageFlag("key", true /* SSR fallback */)
```
useSyncExternalStore under the hood — correct on the first client
render, no setState-in-effect lint errors, no hydration flash.

## Component Patterns

### Shimmer Loading State
```tsx
function ShimmerCard() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "0.5px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      height: 80,
      overflow: "hidden",
      position: "relative"
    }}>
      <motion.div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
          backgroundSize: "200% 100%"
        }}
        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}
```

### Empty State
```tsx
function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: "center", padding: "48px 24px" }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ color: "#d8d8d8", fontWeight: 500, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ color: "#444", fontSize: 13, marginBottom: 20 }}>
        {description}
      </div>
      {action}
    </motion.div>
  )
}
```

### Success Animation (use Lottie)
```tsx
import Lottie from "lottie-react"
// Download from lottiefiles.com
// Save to public/animations/success.json
import successAnim from "@/public/animations/success.json"

function SuccessState() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Lottie 
        animationData={successAnim} 
        loop={false}
        style={{ width: 80, height: 80 }}
      />
    </motion.div>
  )
}
```

### Tooltip
```tsx
function Tooltip({ children, label }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1a1a1a",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 11,
              color: "#d8d8d8",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### Dropdown Menu
```tsx
function Menu({ trigger, items }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              background: "#0f0f0f",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 4,
              minWidth: 160,
              zIndex: 100,
              boxShadow: "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
            }}
          >
            {items.map(item => (
              <div
                key={item.label}
                onClick={() => { item.onClick(); setOpen(false) }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  color: item.danger ? "#ff5555" : "#d8d8d8",
                  cursor: "pointer"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {item.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### Toast Notification
Use sonner (already installed):
```tsx
import { toast } from "sonner"

// Success
toast.success("Card saved")

// Error  
toast.error("Something went wrong")

// Custom dark toast
toast("Card added", {
  description: "Edit the title to customize it",
  style: {
    background: "#0f0f0f",
    border: "0.5px solid rgba(255,255,255,0.1)",
    color: "#d8d8d8"
  }
})
```

### Input Field
```tsx
<input
  style={{
    background: "rgba(255,255,255,0.04)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "#d8d8d8",
    fontSize: 13,
    width: "100%",
    outline: "none",
    transition: "border 150ms ease"
  }}
  onFocus={e => e.target.style.border = "0.5px solid rgba(0,255,136,0.4)"}
  onBlur={e => e.target.style.border = "0.5px solid rgba(255,255,255,0.08)"}
/>
```

### Button Variants
```tsx
// Primary (green)
const btnPrimary = {
  background: "#00ff88",
  color: "#000",
  fontFamily: "monospace",
  fontWeight: 600,
  fontSize: 13,
  padding: "10px 20px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer"
}

// Ghost
const btnGhost = {
  background: "transparent",
  color: "#888",
  border: "0.5px solid rgba(255,255,255,0.1)",
  fontFamily: "monospace",
  fontSize: 13,
  padding: "9px 18px",
  borderRadius: 10,
  cursor: "pointer"
}

// Danger
const btnDanger = {
  background: "rgba(255,85,85,0.08)",
  color: "#ff5555",
  border: "0.5px solid rgba(255,85,85,0.2)",
  fontFamily: "monospace",
  fontSize: 13,
  padding: "9px 18px",
  borderRadius: 10,
  cursor: "pointer"
}
```

## Page Transition Pattern
```tsx
// Wrap page content in this
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 8 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
  {children}
</motion.div>
```

## Collection Open (Apple iOS style)
```tsx
const [activeCollection, setActiveCollection] = useState(null)

<AnimatePresence mode="wait">
  {activeCollection ? (
    <motion.div
      key="collection"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
    >
      <button onClick={() => setActiveCollection(null)}>
        ← Back
      </button>
      {activeCollection.children.map((child, i) => (
        <motion.div
          key={child.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 28 }}
        >
          <BlockRenderer block={child} />
        </motion.div>
      ))}
    </motion.div>
  ) : (
    <motion.div key="main" ...>
      {/* main blocks */}
    </motion.div>
  )}
</AnimatePresence>
```
