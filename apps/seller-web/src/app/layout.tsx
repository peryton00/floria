import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import { SellerAuthProvider } from "@/lib/contexts/SellerAuthContext";
import { SellerProductProvider } from "@/lib/contexts/SellerProductContext";
import { SellerShell } from "@/components/seller/SellerShell";

export const metadata: Metadata = {
  title: "Floria Seller Portal — Nursery Store & Order Management",
  description:
    "Manage your nursery store, products, inventory, and order fulfillment on Floria.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream-100 text-ink-900 antialiased font-sans">
        <ToastProvider>
          <SellerAuthProvider>
            <SellerProductProvider>
              <SellerShell>{children}</SellerShell>
            </SellerProductProvider>
          </SellerAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
