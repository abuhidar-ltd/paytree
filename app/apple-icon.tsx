import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030303",
        }}
      >
        <div
          style={{
            width: 124,
            height: 124,
            borderRadius: 32,
            background: "linear-gradient(135deg, #00ff88, rgba(0,255,136,0.5))",
            boxShadow: "0 0 48px rgba(0,255,136,0.4)",
          }}
        />
      </div>
    ),
    { ...size },
  )
}
