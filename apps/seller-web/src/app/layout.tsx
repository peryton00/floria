import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import { SellerAuthProvider } from "@/lib/contexts/SellerAuthContext";
import { SellerProvider } from "@/lib/contexts/SellerContext";
import { SellerProductProvider } from "@/lib/contexts/SellerProductContext";
import { SellerShell } from "@/components/seller/SellerShell";

export const metadata: Metadata = {
  title: "Floria Seller Cockpit — Nursery & Partner Portal",
  description:
    "Floria Nursery Partner Portal — Manage catalog listings, orders queue, earnings ledger, and logistics fulfillment.",
  icons: {
    icon: "/brand_logo.svg",
    shortcut: "/brand_logo.svg",
    apple: "/brand_logo.svg",
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
        <link rel="icon" href="/brand_logo.svg" type="image/svg+xml" />
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
