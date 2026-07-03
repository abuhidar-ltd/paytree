import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /register is the canonical signup route. Legacy aliases (/start from
      // the TikTok-safe-naming era, /join, /signup, /sign-up) all redirect
      // here so old ads, bios, and DMs keep working.
      // 307 (not 308) — TikTok and other in-app WebViews flag 308 chains
      // as untrusted; 307 preserves method and survives WebView intercepts.
      {
        source: "/start",
        destination: "/register",
        permanent: false,
      },
      {
        source: "/start/:path*",
        destination: "/register/:path*",
        permanent: false,
      },
      {
        source: "/join",
        destination: "/register",
        permanent: false,
      },
      {
        source: "/signup",
        destination: "/register",
        permanent: false,
      },
      {
        source: "/sign-up",
        destination: "/register",
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
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // @prisma/client intentionally excluded — optimizePackageImports has a
    // recurring history of tree-shaking Prisma's generated types out of the
    // client bundle in Next 15/16, which surfaces as "Model X does not exist
    // in the database" at runtime. Costs a few KB, worth the reliability.
    optimizePackageImports: [
      "recharts",
      "framer-motion",
      "lucide-react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },
};

export default nextConfig;
