"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FloriaIcon, type FloriaIconName } from "@floria/icons";

interface NavItem {
  href: string;
  label: string;
  iconName: FloriaIconName;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/",
    label: "Home",
    iconName: "home",
  },
  {
    href: "/categories",
    label: "Categories",
    iconName: "categories",
  },
  {
    href: "/search",
    label: "Search",
    iconName: "search",
  },
  {
    href: "/orders",
    label: "Orders",
    iconName: "orders",
  },
  {
    href: "/account",
    label: "Account",
    iconName: "profile",
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
      className="fixed bottom-0 left-0 right-0 z-50 h-[58px] bg-white/95 backdrop-blur-xl border-t border-stone-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe md:hidden"
    >
      <ul className="flex h-full items-center justify-around px-2" role="list">
        {NAV_ITEMS.map(({ href, label, iconName }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href} className="flex-1 h-full">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center h-full w-full py-1 transition-transform duration-150 active:scale-95 focus-visible:outline-none"
              >
                {/* Zomato/Swiggy Active Top Indicator Line */}
                {active && (
                  <span className="absolute top-0 w-8 h-0.75 bg-forest-800 rounded-b-full shadow-xs animate-in fade-in zoom-in-75 duration-200" />
                )}

                {/* Icon Container */}
                <div className="relative flex items-center justify-center transition-colors duration-200 mb-0.5">
                  <FloriaIcon
                    name={iconName}
                    size={20}
                    weight={active ? "fill" : "regular"}
                    className={
                      active
                        ? "text-forest-800 scale-105 transition-transform"
                        : "text-stone-400 hover:text-stone-600"
                    }
                  />
                </div>

                {/* Text Label */}
                <span
                  className={[
                    "text-[10px] leading-none font-ui tracking-tight transition-colors",
                    active
                      ? "font-bold text-forest-800"
                      : "font-medium text-stone-500",
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
