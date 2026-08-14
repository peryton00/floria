// Floria — Footer (server component)
import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "@/components/ui/NewsletterForm";
import { LeafIcon } from "@/components/ui/Icons";

const SHOP_LINKS = [
  { label: "Plants",           href: "/categories/indoor-plants" },
  { label: "Seeds",            href: "/categories/herbs-edibles" },
  { label: "Fertilizers",      href: "/categories/soil-fertilizers" },
  { label: "Pots & Planners",  href: "/categories/planters-pots" },
  { label: "Gardening Tools",  href: "/categories/tools-accessories" },
];

const COMPANY_LINKS = [
  { label: "About Us",     href: "/about" },
  { label: "Nurseries",    href: "/nurseries" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Careers",      href: "/careers" },
];

const HELP_LINKS = [
  { label: "FAQ",                 href: "/faq" },
  { label: "Shipping & Delivery", href: "/shipping" },
  { label: "Returns & Refunds",   href: "/returns" },
  { label: "Terms & Conditions",  href: "/terms" },
  { label: "Privacy Policy",      href: "/privacy" },
  { label: "Contact Us",          href: "/contact" },
];

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com", viewBox: "0 0 24 24", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
  { label: "Facebook", href: "https://facebook.com", viewBox: "0 0 24 24", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  { label: "X/Twitter", href: "https://twitter.com", viewBox: "0 0 24 24", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
];

export function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--color-canopy-900)" }} aria-label="Site footer">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-14">

          {/* Brand + Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5" aria-label="Floria home">
              <Image
                src="/floria-logo.png"
                alt="Floria"
                width={28}
                height={28}
                className="object-contain brightness-0 invert opacity-90"
              />
              <span
                className="font-serif text-lg font-bold tracking-tight"
                style={{ color: "rgba(255,255,255,0.95)" }}
              >
                FLORIA
              </span>
            </Link>

            <p
              className="text-sm leading-relaxed mb-8 max-w-xs"
              style={{ color: "rgba(255,255,255,0.58)" }}
            >
              Your one-stop marketplace for plants and gardening essentials from trusted local nurseries across India.
            </p>

            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.32)", letterSpacing: "0.14em" }}
            >
              NEWSLETTER
            </p>
            <NewsletterForm />

            <div className="flex items-center gap-3 mt-7">
              {SOCIAL.map(({ label, href, viewBox, path }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110"
                  style={{ backgroundColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.60)" }}
                >
                  <svg viewBox={viewBox} width="14" height="14" fill="currentColor" aria-hidden="true">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="SHOP"    links={SHOP_LINKS} />
          <FooterColumn title="COMPANY" links={COMPANY_LINKS} />
          <FooterColumn title="HELP"    links={HELP_LINKS} />
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.32)" }}>
            &copy; {new Date().getFullYear()} Floria Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "rgba(255,255,255,0.22)" }}>
            <span>Grown with care, delivered with love</span>
            <LeafIcon size={12} className="opacity-60" />
          </div>
        </div>
      </div>
    </footer>
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
        className="text-[12px] font-bold uppercase mb-5"
        style={{ color: "var(--color-forest-50)", letterSpacing: "0.13em" }}
      >
        {title}
      </p>
      <ul className="space-y-3">
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-[12.5px] leading-snug transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.62)" }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
