import Link from "next/link";
import { CountBadge } from "@/components/ui/Badge";

interface HeaderProps {
  cartCount?: number;
}

export function Header({ cartCount = 0 }: HeaderProps) {
  return (
    <header
      className={[
        "sticky top-0 z-40",
        "h-14 flex items-center",
        "px-4 md:px-6 lg:px-8",
        "bg-cream-50/95 backdrop-blur-sm",
        "border-b border-ink-100",
      ].join(" ")}
    >
      {/* Wordmark */}
      <Link
        href="/"
        aria-label="Floria — go to home"
        className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 rounded"
      >
        {/* Botanical leaf mark + wordmark */}
        <BotanicalMark />
        <span
          className="font-serif text-xl font-semibold text-ink-900 tracking-tight select-none"
          aria-hidden="true"
        >
          Floria
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Desktop nav links */}
      <nav
        aria-label="Desktop navigation"
        className="hidden md:flex items-center gap-6 mr-6"
      >
        <NavLink href="/categories">Categories</NavLink>
        <NavLink href="/search">Search</NavLink>
        <NavLink href="/orders">Orders</NavLink>
        <NavLink href="/account">Account</NavLink>
      </nav>

      {/* Cart icon */}
      <Link
        href="/cart"
        aria-label={`Cart${cartCount > 0 ? ` — ${cartCount} item${cartCount === 1 ? "" : "s"}` : ""}`}
        className="relative p-2 rounded-lg text-ink-700 hover:text-forest-700 hover:bg-sage-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
      >
        <CartIcon />
        <CountBadge count={cartCount} />
      </Link>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
    >
      {children}
    </Link>
  );
}

/** Temporary botanical leaf SVG mark — replace with final logo asset when available */
function BotanicalMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Leaf shape */}
      <path
        d="M14 3C14 3 4 8 4 16C4 21.523 8.477 26 14 26C19.523 26 24 21.523 24 16C24 8 14 3 14 3Z"
        fill="#245718"
      />
      {/* Stem */}
      <path
        d="M14 26V13"
        stroke="#faf7f0"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Vein left */}
      <path
        d="M14 17C12 15 9 15 9 15"
        stroke="#faf7f0"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Vein right */}
      <path
        d="M14 14C16 12 19 12 19 12"
        stroke="#faf7f0"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
