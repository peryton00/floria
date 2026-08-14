"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Search, ShoppingBag, User } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  IconComponent: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/",
    label: "Home",
    IconComponent: Home,
  },
  {
    href: "/categories",
    label: "Categories",
    IconComponent: Grid,
  },
  {
    href: "/search",
    label: "Search",
    IconComponent: Search,
  },
  {
    href: "/orders",
    label: "Orders",
    IconComponent: ShoppingBag,
  },
  {
    href: "/account",
    label: "Account",
    IconComponent: User,
  },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className={[
        // Fixed bottom, full width, above content
        "fixed bottom-0 left-0 right-0 z-50",
        // Height and background
        "h-16 bg-cream-50",
        // Border top
        "border-t border-ink-100",
        // Safe area for iOS home indicator
        "pb-safe",
        // Hide on md+
        "md:hidden",
        // Backdrop for glass effect
        "backdrop-blur-sm bg-cream-50/95",
      ].join(" ")}
    >
      <ul className="flex h-full" role="list">
        {NAV_ITEMS.map(({ href, label, IconComponent }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center justify-center h-full",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:bg-sage-100",
                  active ? "text-forest-700" : "text-ink-300 hover:text-ink-500",
                ].join(" ")}
              >
                <span className="flex-shrink-0">
                  <IconComponent
                    size={24}
                    className={active ? "fill-forest-700/10 text-forest-700" : "text-ink-400"}
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
