/**
 * Shared OG/Twitter card. Satori (next/og) rules that MUST hold here:
 *
 * 1. Every element with more than one child needs explicit display:flex —
 *    including divs that mix a text node with an element. Keep every text
 *    string as the ONLY child of its own element.
 * 2. No glyphs outside the bundled latin subset (no ✦ · → em-dash etc.).
 *    A missing glyph makes Satori fetch a dynamic font from Google at
 *    request time, which 400s and throws — that broke 679/1021 og requests
 *    in production (Jun 26 – Jul 2).
 * 3. Fonts are vendored woff files bundled at build time via
 *    `new URL(..., import.meta.url)` — zero network dependencies at runtime.
 */

const interRegular = fetch(
  new URL("./inter-latin-400-normal.woff", import.meta.url)
).then((res) => res.arrayBuffer())

const interBold = fetch(
  new URL("./inter-latin-700-normal.woff", import.meta.url)
).then((res) => res.arrayBuffer())

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_ALT = "Linktree takes 9%. Paytree takes 0%."

export async function ogFonts() {
  const [regular, bold] = await Promise.all([interRegular, interBold])
  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
  ]
}

export function OgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#030303",
        backgroundImage:
          "radial-gradient(circle at 25% 20%, rgba(0,255,136,0.10) 0%, transparent 50%), radial-gradient(circle at 85% 85%, rgba(0,255,136,0.06) 0%, transparent 55%)",
        fontFamily: "Inter",
        padding: 72,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #00ff88, rgba(0,255,136,0.5))",
            boxShadow: "0 0 32px rgba(0,255,136,0.4)",
          }}
        />
        <div style={{ display: "flex", color: "#00ff88", fontSize: 36, fontWeight: 700 }}>
          Paytree
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            color: "#f0f0f0",
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1.1,
          }}
        >
          Linktree takes 9%.
        </div>
        <div
          style={{
            display: "flex",
            color: "#00ff88",
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1.1,
          }}
        >
          Paytree takes 0%.
        </div>
        <div
          style={{
            display: "flex",
            color: "#888888",
            fontSize: 30,
            marginTop: 28,
          }}
        >
          The bio link for creators who monetize.
        </div>
      </div>

      <div style={{ display: "flex", color: "#888888", fontSize: 28 }}>paytree.to</div>
    </div>
  )
}
