import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 307 (not 308) — TikTok and other in-app WebViews flag 308 chains
      // as untrusted; 307 preserves method and survives WebView intercepts.
      // Destination is /start (not /join) — /start is the TikTok-safe entry
      // because /join is on TikTok's URL safety blocklist for auth keywords.
      {
        source: "/register",
        destination: "/start",
        permanent: false,
      },
      {
        source: "/register/:path*",
        destination: "/start/:path*",
        permanent: false,
      },
      {
        source: "/signup",
        destination: "/start",
        permanent: false,
      },
      {
        source: "/sign-up",
        destination: "/start",
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "media.giphy.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: [
      "@prisma/client",
      "recharts",
      "framer-motion",
      "lucide-react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },
};

export default nextConfig;
