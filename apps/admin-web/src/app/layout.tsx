import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import { AdminAuthProvider } from "@/lib/contexts/AdminAuthContext";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Floria Admin Console — Marketplace Governance & Oversight",
  description:
    "Floria platform administration, seller verifications, catalog moderation, orders, and system health.",
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
          <AdminAuthProvider>
            <AdminShell>{children}</AdminShell>
          </AdminAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
