import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toast";

// Load Inter for body text
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Load Playfair Display for elegant headings
const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Paytree - Your Payment Links, Elegantly Organized",
  description: "Create a stunning, professional page for all your payment links. Get paid beautifully with Paytree.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Paytree",
  },
  openGraph: {
    title: "Paytree - Your Payment Links, Elegantly Organized",
    description: "Create a stunning, professional page for all your payment links.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paytree - Your Payment Links, Elegantly Organized",
    description: "Create a stunning, professional page for all your payment links.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0A1128",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
        <body className={`${inter.className} antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
