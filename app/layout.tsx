import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Space_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/next";
import { InAppBrowserBanner } from "@/components/in-app-browser-banner";

// Body text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

// Elegant display headings
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

// Mono labels, numbers, terminal accents
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://paytree.to";
const TITLE = "Paytree — The bio link for creators who monetize";
const DESCRIPTION =
  "0% platform fees. AI that sells for you. Analytics that show you the world. The only bio link built for creators who earn.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Paytree",
  },
  description: DESCRIPTION,
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Paytree",
  },
  keywords: [
    "bio link",
    "link in bio",
    "linktree alternative",
    "creator monetization",
    "AI bio link",
    "0% fees bio link",
    "creator tools",
  ],
  authors: [{ name: "Paytree" }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Paytree",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@paytree",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#030303",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/start"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang="en" className={`${inter.variable} ${playfair.variable} ${spaceMono.variable}`}>
        <body className={`${inter.className} antialiased bg-[#030303]`}>
          <InAppBrowserBanner />
          {children}
          <Toaster />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
