import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";

interface CustomerShellProps {
  children: ReactNode;
  cartCount?: number;
  /** Set true on pages that need full-width sections (homepage). Shell still constrains inner px. */
  fullWidth?: boolean;
}

/**
 * CustomerShell — wraps all customer-facing pages.
 * Provides: sticky header, scrollable main, footer, mobile bottom nav.
 */
export function CustomerShell({
  children,
  fullWidth = false,
}: CustomerShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-floria-page text-floria-text-primary">
      <Header />
      <main
        id="main-content"
        className={[
          "flex-1 w-full",
          fullWidth
            ? ""
            : "max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6",
        ].join(" ")}
        tabIndex={-1}
      >
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
