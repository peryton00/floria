import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Floria — Plants & Gardening Marketplace",
    template: "%s | Floria",
  },
  description:
    "Discover premium plants and gardening products from local nurseries. Floria coordinates packing and delivery direct to your door.",
  keywords: [
    "plants",
    "nursery",
    "gardening",
    "indoor plants",
    "outdoor plants",
    "Floria",
  ],
  openGraph: {
    siteName: "Floria",
    type: "website",
    locale: "en_IN",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#245718",
};

import { Providers } from "@/components/ui/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          className={[
            "sr-only focus:not-sr-only",
            "fixed top-2 left-2 z-[100]",
            "bg-forest-700 text-white",
            "px-4 py-2 rounded-lg text-sm font-medium",
            "focus:outline-none focus:ring-2 focus:ring-white",
          ].join(" ")}
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
