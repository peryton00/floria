"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  List,
  X,
  ArrowRight,
  Storefront,
  Plant,
  SignIn,
} from "@phosphor-icons/react";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Why Floria", href: "#why-floria" },
  { label: "Categories", href: "#categories" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Top Businesses", href: "#top-businesses" },
  { label: "Tools", href: "#workspace" },
  { label: "FAQs", href: "#faq" },
];

export function BusinessNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-cream-50/95 backdrop-blur-md shadow-xs border-b border-cream-300/80 py-3"
            : "bg-cream-100/90 backdrop-blur-xs border-b border-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Brand Logo & Tag */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-800 rounded-lg p-1 -m-1"
              aria-label="Floria Business Home"
            >
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-forest-900 group-hover:text-forest-700 transition-colors">
                FLORIA
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-forest-100 text-forest-800 border border-forest-200/70">
                Business
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-ink-700 hover:text-forest-800 transition-colors py-1 focus:outline-none focus-visible:text-forest-800"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop Action CTAs */}
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-semibold text-ink-700 hover:text-forest-900 px-3 py-2 rounded-lg hover:bg-cream-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-800"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-cream-50 text-sm font-semibold rounded-xl shadow-xs transition-all hover:shadow-md active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-800"
              >
                <span>Become a Seller</span>
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>

            {/* Mobile Header Buttons (Become a Seller compact + Menu hamburger) */}
            <div className="flex sm:hidden items-center gap-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-forest-800 text-cream-50 text-xs font-semibold rounded-lg shadow-xs active:scale-98"
              >
                <span>Sell</span>
                <ArrowRight size={13} weight="bold" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-ink-700 hover:text-forest-900 rounded-lg hover:bg-cream-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-800"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X size={24} weight="bold" />
                ) : (
                  <List size={24} weight="bold" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-forest-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-cream-50 shadow-2xl p-6 flex flex-col justify-between border-l border-cream-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-cream-300">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-2xl font-bold tracking-tight text-forest-900">
                    FLORIA
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-forest-100 text-forest-800">
                    Business
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-ink-600 hover:text-forest-900 rounded-lg focus:outline-none"
                  aria-label="Close menu"
                >
                  <X size={22} weight="bold" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium text-ink-800 hover:bg-cream-200 hover:text-forest-900 transition-colors"
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={16} className="text-ink-400" />
                  </a>
                ))}
              </nav>
            </div>

            {/* Bottom CTA Block */}
            <div className="pt-6 border-t border-cream-300 space-y-3">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-forest-800 active:bg-forest-900 text-cream-50 text-base font-semibold rounded-xl shadow-sm transition-all"
              >
                <span>Become a Seller</span>
                <ArrowRight size={18} weight="bold" />
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-cream-400 text-ink-800 text-sm font-semibold rounded-xl hover:bg-cream-200 transition-colors"
              >
                <SignIn size={17} />
                <span>Already a seller? Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
