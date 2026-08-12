import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface CustomerShellProps {
  children: ReactNode;
  cartCount?: number;
}

/**
 * CustomerShell — wraps all customer-facing pages.
 * Provides: sticky header, scrollable main content area, mobile bottom nav.
 * Desktop: no bottom nav, wider content max-width.
 */
export function CustomerShell({ children, cartCount = 0 }: CustomerShellProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header cartCount={cartCount} />
      <main
        id="main-content"
        className="flex-1 w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6"
        tabIndex={-1}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
