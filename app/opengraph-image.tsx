import { ImageResponse } from "next/og"

// edge runtime: ImageResponse (Satori) bundles its system font loader for
// edge; on Node it tries to fetch dynamic fonts at build time, which fails
// in the sandbox. The "Using edge runtime ... disables static generation"
// warning is benign for image routes (CDN caches them anyway).
export const runtime = "edge"
export const alt = "Paytree — The bio link for creators who monetize"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // Satori rejects `background: <gradient>, <color>` shorthand —
          // it parses the trailing color as `background-image` and errors.
          // Split into explicit properties.
          backgroundColor: "#030303",
          backgroundImage:
            "radial-gradient(circle at 30% 30%, rgba(0,255,136,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,255,136,0.06) 0%, transparent 55%)",
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: 80,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #00ff88, rgba(0,255,136,0.5))",
              boxShadow: "0 0 32px rgba(0,255,136,0.4)",
            }}
          />
          <span style={{ color: "#f0f0f0", fontSize: 32, fontWeight: 700 }}>Paytree</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(0,255,136,0.08)",
            border: "2px solid rgba(0,255,136,0.2)",
            color: "#00ff88",
            padding: "10px 22px",
            borderRadius: 9999,
            fontSize: 22,
            fontFamily: "monospace",
            marginBottom: 36,
          }}
        >
          ✦ 0% platform fees · AI sells for you
        </div>

        <div
          style={{
            color: "#f0f0f0",
            fontSize: 86,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.05,
            letterSpacing: -2,
            marginBottom: 28,
            maxWidth: 1000,
          }}
        >
          The bio link for creators{" "}
          <span style={{ color: "#00ff88" }}>who monetize.</span>
        </div>

        <div
          style={{
            color: "#888",
            fontSize: 30,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          0% fees · AI agent · Globe analytics · Drop countdowns
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 56,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#666",
            fontSize: 22,
            fontFamily: "monospace",
          }}
        >
          paytree.to
        </div>
      </div>
    ),
    { ...size },
  )
}
