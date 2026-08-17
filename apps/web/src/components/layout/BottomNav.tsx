"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";

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
    IconComponent: LayoutGrid,
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
      className="fixed bottom-0 left-0 right-0 z-50 h-[62px] bg-floria-linen/95 backdrop-blur-xl border-t border-floria-border shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-safe md:hidden"
    >
      <ul className="flex h-full items-center justify-around px-1" role="list">
        {NAV_ITEMS.map(({ href, label, IconComponent }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex flex-col items-center justify-center h-full w-full py-1.5",
                  "transition-all duration-200 active:scale-90",
                  "focus-visible:outline-none focus-visible:bg-floria-soft-sand rounded-xl",
                  active ? "text-forest-800" : "text-ink-400 hover:text-ink-800",
                ].join(" ")}
              >
                {/* Icon with Active Pill Container */}
                <div
                  className={[
                    "relative flex items-center justify-center transition-all duration-200",
                    active
                      ? "w-11 h-7 rounded-full bg-forest-100/90 text-forest-800 shadow-2xs"
                      : "w-11 h-7 rounded-full text-ink-500",
                  ].join(" ")}
                >
                  <IconComponent
                    size={19}
                    className={active ? "text-forest-800 stroke-[2.2]" : "text-ink-500 stroke-[1.8]"}
                  />
                </div>

                {/* Micro Label */}
                <span
                  className={[
                    "text-[10px] leading-tight font-ui mt-0.5 tracking-tight transition-all",
                    active ? "font-bold text-forest-800" : "font-medium text-ink-500",
                  ].join(" ")}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
