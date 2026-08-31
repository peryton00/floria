"use client";

// Floria — Footer (Flipkart & Amazon UX Standard)
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "@/components/ui/NewsletterForm";
import {
  LeafIcon,
  ShieldIcon,
  TruckIcon,
  VerifiedIcon,
} from "@/components/ui/Icons";
import { api } from "@/lib/api";
import type { Category } from "@floria/types";

const COMPANY_LINKS = [
  { label: "About Floria", href: "/about" },
  { label: "Partner Nurseries", href: "/nurseries" },
  { label: "How Floria Works", href: "/how-it-works" },
  { label: "Seller Onboarding", href: "/seller/register" },
  { label: "Careers", href: "/careers" },
];

const HELP_LINKS = [
  { label: "Help & FAQ", href: "/faq" },
  { label: "Shipping & Transit", href: "/shipping" },
  { label: "Freshness & Returns", href: "/returns" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Contact Botanical Support", href: "/contact" },
];

const PORTAL_LINKS = [
  { label: "Seller Dashboard", href: "/seller/login" },
  { label: "Operations Portal", href: "/operations/login" },
  { label: "Admin Portal", href: "/admin/login" },
];

const VALUE_PROPS = [
  {
    icon: VerifiedIcon,
    title: "100% Verified Nurseries",
    description:
      "Sourced directly from certified regional nursery growers across India",
  },
  {
    icon: TruckIcon,
    title: "Climate-Safe Delivery",
    description: "Shockproof, moisture-retaining, eco-friendly plant packaging",
  },
  {
    icon: LeafIcon,
    title: "Freshness Guarantee",
    description:
      "Healthy plant arrival promise with expert care guides & support",
  },
  {
    icon: ShieldIcon,
    title: "Secure Cashfree Payments",
    description: "256-bit encrypted checkout, UPI, cards, and Cash on Delivery",
  },
];

export function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (e) {
        console.warn("[Footer] Failed to load categories:", e);
      }
    }
    loadCategories();
  }, []);

  const shopLinks = categories.map((c) => ({
    label: c.name,
    href: `/categories/${c.slug}`,
  }));

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Amazon-style "Back to Top" Bar */}
      <button
        type="button"
        onClick={scrollToTop}
        className="w-full py-3 bg-[#112218] hover:bg-[#193224] text-white font-bold text-xs uppercase tracking-widest transition-colors font-ui flex items-center justify-center gap-2 border-t border-forest-900/40 cursor-pointer select-none"
      >
        <span>Back to Top</span>
        <span className="text-sm">↑</span>
      </button>

      {/* Flipkart-style Trust Assurance Ribbon */}
      <section
        aria-label="Floria Marketplace Guarantees"
        className="bg-forest-800 text-white border-t border-b border-forest-950/60 shadow-inner"
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-7 md:py-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-white/15">
            {VALUE_PROPS.map((prop, idx) => {
              const Icon = prop.icon;
              return (
                <div
                  key={prop.title}
                  className={`flex items-start gap-3.5 ${
                    idx > 0 ? "lg:pl-6" : ""
                  } ${idx < VALUE_PROPS.length - 1 ? "lg:pr-6" : ""}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white flex-shrink-0 shadow-2xs backdrop-blur-xs">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold font-ui !text-white leading-snug">
                      {prop.title}
                    </p>
                    <p className="text-xs text-white/75 mt-0.5 leading-relaxed">
                      {prop.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Flipkart/Amazon Multi-Column Directory Footer */}
      <footer
        style={{ backgroundColor: "var(--color-canopy-900, #0E1C14)" }}
        aria-label="Site footer"
        className="text-white"
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Column 1: Brand & Newsletter */}
            <div className="lg:col-span-2 space-y-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 group"
                aria-label="Floria home"
              >
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center p-1.5 shadow-2xs group-hover:bg-white/15 transition-colors">
                  <Image
                    src="/brand_logo.svg"
                    alt="Floria Logo"
                    width={6}
                    height={8}
                    className="w-auto h-5 object-contain brightness-0 invert opacity-95"
                  />
                </div>
                <span className="font-serif text-xl font-bold tracking-tight text-white">
                  FLORIA
                </span>
              </Link>

              <p
                className="text-xs sm:text-sm leading-relaxed max-w-sm"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                India&apos;s verified botanical marketplace connecting plant
                enthusiasts directly with certified regional nurseries, artisan
                pottery, and organic plant care.
              </p>

              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-2 font-ui"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  Join the Floria Botanical Newsletter
                </p>
                <NewsletterForm />
              </div>
            </div>

            {/* Column 2: Collections */}
            <FooterColumn
              title="COLLECTIONS"
              links={
                shopLinks.length > 0
                  ? shopLinks
                  : [{ label: "Browse All Shop Products", href: "/shop" }]
              }
            />

            {/* Column 3: Company */}
            <FooterColumn title="COMPANY & GROWERS" links={COMPANY_LINKS} />

            {/* Column 4: Help & Portals */}
            <div className="space-y-6">
              <FooterColumn title="HELP & POLICIES" links={HELP_LINKS} />
              <FooterColumn title="PORTALS" links={PORTAL_LINKS} />
            </div>
          </div>
        </div>

        {/* Bottom Legal & Payment Options Row (Flipkart Style) */}
        <div
          className="border-t"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 font-ui">
            <div
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[11px]"
              style={{ color: "rgba(255,255,255,0.60)" }}
            >
              <span>
                &copy; {new Date().getFullYear()} Floria Technologies Pvt. Ltd.
                All rights reserved.
              </span>
              <span className="hidden sm:inline">|</span>
              <span>Direct Regional Nursery Marketplace</span>
            </div>

            {/* Flipkart-style Payment Method Badges */}
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                UPI
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                RuPay
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                Visa
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                Mastercard
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                Net Banking
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">
                COD
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p
        className="text-[11px] font-bold uppercase mb-3.5 font-ui tracking-widest"
        style={{ color: "#DDE7DD", letterSpacing: "0.14em" }}
      >
        {title}
      </p>
      <ul className="space-y-2 font-ui">
        {links.map(({ label, href }) => {
          const isCrossDomain =
            href.startsWith("/seller") || href.startsWith("/admin");
          if (isCrossDomain) {
            return (
              <li key={href}>
                <a
                  href={href}
                  className="text-xs leading-snug transition-all duration-200 hover:text-white hover:translate-x-0.5 inline-block"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  {label}
                </a>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                className="text-xs leading-snug transition-all duration-200 hover:text-white hover:translate-x-0.5 inline-block"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
