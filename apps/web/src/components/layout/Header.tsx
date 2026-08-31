// Floria — Header
// Reference: White background, 64px height, FLORIA logo left, full nav center, icons right
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Image from "next/image";
import { CountBadge } from "@/components/ui/Badge";
import {
  SearchIcon,
  UserIcon,
  BagIcon,
  BellIcon,
  WishlistIcon,
} from "@/components/ui/Icons";
import { useCart } from "@/lib/contexts/CartContext";
import { useWishlist } from "@/lib/contexts/WishlistContext";

import { api } from "@/lib/api";
import type { Category } from "@floria/types";

export function Header() {
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems.length;
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (e) {
        console.warn("[Header] Failed to fetch categories", e);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isHome) {
      setIsScrolled(false);
      return;
    }
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  const navItems = [
    ...categories.slice(0, 5).map((cat) => ({
      label: cat.name,
      href: `/categories/${cat.slug}`,
      hasChevron: true,
    })),
    { label: "Offers", href: "/search?q=offer", hasChevron: false },
  ];

  const headerClass = [
    isHome ? "fixed" : "sticky",
    "top-0 left-0 right-0 z-40",
    "flex items-center transition-all duration-400",
    isHome && !isScrolled
      ? "h-20 bg-transparent border-b border-transparent"
      : "h-16 bg-floria-linen/95 backdrop-blur-md border-b border-floria-border shadow-xs",
  ].join(" ");

  const logoTextClass = [
    "font-serif font-bold text-forest-800 tracking-tight select-none transition-all duration-300",
    isHome && !isScrolled ? "text-xl" : "text-lg",
  ].join(" ");


  const navLinkClass = [
    "font-medium text-ink-500 hover:text-ink-900 whitespace-nowrap transition-all duration-300 rounded-md hover:bg-floria-soft-sand flex items-center gap-1",
    isHome && !isScrolled
      ? "text-[14px] px-3.5 py-2.5"
      : "text-[13px] px-3 py-2",
  ].join(" ");

  const iconLinkClass = [
    "rounded-lg text-ink-500 hover:text-ink-900 hover:bg-floria-soft-sand transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-800",
    isHome && !isScrolled ? "p-2.5" : "p-2",
  ].join(" ");

  return (
    <header className={headerClass}>
      <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 flex items-center gap-4">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Floria — go to home"
          className="flex items-center gap-2 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-800 rounded"
        >
          <Image
            src="/brand_logo.svg"
            alt="Floria"
            width={6}
            height={8}
            priority
            style={{ height: "32px" }}
            className="w-auto object-contain transition-all duration-300"
          />
          <span className={logoTextClass}>FLORIA</span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1 flex-1 justify-center"
        >
          {navItems.map(({ label, href, hasChevron }) => {
            return (
              <Link key={href} href={href} className={navLinkClass}>
                <span>{label}</span>
                {hasChevron && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-70 mt-0.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-1 ml-auto md:ml-0 flex-shrink-0">
          {/* Search */}
          <Link href="/search" aria-label="Search" className={iconLinkClass}>
            <SearchIcon />
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishlistCount > 0 ? ` — ${wishlistCount} item${wishlistCount === 1 ? "" : "s"}` : ""}`}
            className={["relative", iconLinkClass].join(" ")}
          >
            <WishlistIcon />
            <CountBadge count={wishlistCount} />
          </Link>

          {/* Notifications */}
          <NotificationBell userRole="customer" />

          {/* Account (Desktop only) */}
          <Link
            href="/account"
            aria-label="My account"
            className={[iconLinkClass, "hidden md:block"].join(" ")}
          >
            <UserIcon />
          </Link>

          {/* Cart (Desktop only, mobile uses bottom nav) */}
          <Link
            href="/cart"
            aria-label={`Cart${cartCount > 0 ? ` — ${cartCount} item${cartCount === 1 ? "" : "s"}` : ""}`}
            className={["relative hidden md:inline-flex", iconLinkClass].join(
              " ",
            )}
          >
            <BagIcon />
            <CountBadge count={cartCount} />
          </Link>
        </div>
      </div>
    </header>
  );
}
