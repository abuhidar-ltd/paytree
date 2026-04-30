import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Optimize for Vercel
  experimental: {
    optimizePackageImports: ['@prisma/client', 'recharts', 'framer-motion', 'lucide-react'],
  },
};

export default nextConfig;
