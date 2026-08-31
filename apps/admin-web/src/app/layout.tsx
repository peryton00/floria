import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import { AdminAuthProvider } from "@/lib/contexts/AdminAuthContext";

export const metadata: Metadata = {
  title: "Floria Admin Console — Marketplace Governance & Oversight",
  description:
    "Floria platform administration, seller verifications, catalog moderation, orders, and system health.",
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
          <AdminAuthProvider>{children}</AdminAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
