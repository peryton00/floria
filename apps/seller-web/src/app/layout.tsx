import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import { SellerProvider } from "@/lib/contexts/SellerContext";
import { SellerProductProvider } from "@/lib/contexts/SellerProductContext";
import { SellerShell } from "@/components/seller/SellerShell";

export const metadata: Metadata = {
  title: "Floria Seller Cockpit — Nursery & Partner Portal",
  description:
    "Floria Nursery Partner Portal — Manage catalog listings, orders queue, earnings ledger, and logistics fulfillment.",
  icons: {
    icon: "/floria-logo.png",
    shortcut: "/floria-logo.png",
    apple: "/floria-logo.png",
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
        <link rel="icon" href="/floria-logo.png" type="image/png" />
      </head>
      <body className="bg-cream-100 text-ink-900 antialiased font-sans">
        <ToastProvider>
          <SellerProvider>
            <SellerProductProvider>
              <SellerShell>{children}</SellerShell>
            </SellerProductProvider>
          </SellerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
