import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import { AdminAuthProvider } from "@/lib/contexts/AdminAuthContext";

export const metadata: Metadata = {
  title: "Floria Admin Console — Marketplace Governance & Oversight",
  description:
    "Floria platform administration, seller verifications, catalog moderation, orders, and system health.",
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
          <AdminAuthProvider>{children}</AdminAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
