import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import { SellerAuthProvider } from "@/lib/contexts/SellerAuthContext";
import { SellerProvider } from "@/lib/contexts/SellerContext";
import { SellerProductProvider } from "@/lib/contexts/SellerProductContext";
import { SellerShell } from "@/components/seller/SellerShell";

export const metadata: Metadata = {
  title: "Floria Business | Grow Your Business with Floria",
  description:
    "Join Floria Business. Connect your nursery, flower shop, plant boutique, pottery workshop, or gardening business with local customers across India.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-cream-100 text-ink-900 antialiased font-sans">
        <ToastProvider>
          <SellerAuthProvider>
            <SellerProvider>
              <SellerProductProvider>
                <SellerShell>{children}</SellerShell>
              </SellerProductProvider>
            </SellerProvider>
          </SellerAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
