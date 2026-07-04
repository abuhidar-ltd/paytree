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
    // Deliberately excluded from optimizePackageImports:
    //   @prisma/client — history of tree-shaking generated types out of the
    //     client bundle in Next 15/16, surfacing as "Model X does not exist".
    //   framer-motion  — same category. Occasional SSR/CSR mismatches on
    //     animated components have been reported when this is on. We run
    //     framer-motion throughout the app; a subtle hydration break would
    //     silently look like "the animations are broken" to real users.
    // Cost of exclusion is a few KB, worth the reliability.
    optimizePackageImports: [
      "recharts",
      "lucide-react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },
};

export default nextConfig;
