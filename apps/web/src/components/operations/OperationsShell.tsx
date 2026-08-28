"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  GridIcon,
  OrderIcon,
  LeafIcon,
  LockIcon,
  LogoutIcon,
} from "@/components/ui/Icons";

interface OperationsShellProps {
  children: React.ReactNode;
}

export function OperationsShell({ children }: OperationsShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [userName, setUserName] = useState("Operations Officer");
  const [userRole, setUserRole] = useState<string>("operations");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/operations/login");
          return;
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .maybeSingle();

        const role =
          profile?.role || session.user.user_metadata?.role || "customer";
        setUserRole(role);
        setUserName(
          profile?.full_name || session.user.email || "Operations Officer",
        );

        if (
          role === "operations" ||
          role === "admin" ||
          role === "super_admin"
        ) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (e) {
        console.error("Operations auth check failed:", e);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/operations/login");
  };

  const navLinks = [
    { label: "Dashboard", href: "/operations", icon: <GridIcon size={18} /> },
    {
      label: "Master Orders",
      href: "/operations/orders",
      icon: <OrderIcon size={18} />,
    },
    {
      label: "Pickups",
      href: "/operations/pickups",
      icon: <LeafIcon size={18} />,
    },
    {
      label: "Packing",
      href: "/operations/packing",
      icon: <GridIcon size={18} />,
    },
    {
      label: "Deliveries",
      href: "/operations/deliveries",
      icon: <OrderIcon size={18} />,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1C15] text-white flex items-center justify-center font-ui">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-forest-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-bold text-white/70">
            Verifying Operations Access...
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 font-ui">
        <div className="bg-white rounded-2xl border border-ink-100 p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-full bg-error-50 text-error-600 flex items-center justify-center mx-auto">
            <LockIcon size={24} />
          </div>
          <h1 className="font-serif text-xl font-bold text-ink-900">
            403 — Access Denied
          </h1>
          <p className="text-xs text-ink-500">
            Your account ({userRole}) does not have permission to access the
            Floria Fulfillment Operations Portal.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Return to Storefront
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold text-ink-500 hover:text-ink-900"
            >
              Sign out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex font-ui">
      {/* DESKTOP SIDEBAR */}
      <aside
        className="hidden md:flex w-64 bg-[#1E3A2B] text-white/80 flex-col flex-shrink-0 border-r border-white/10"
        aria-label="Operations panel navigation"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/operations" className="flex items-center gap-2">
            <Image
              src="/floria-logo.png"
              alt="Floria Logo"
              width={22}
              height={22}
              className="object-contain brightness-[5] opacity-90"
            />
            <div>
              <span className="font-serif text-sm font-bold text-white tracking-tight block leading-tight">
                Floria Ops
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#DDE7DD] font-bold block leading-none mt-0.5">
                Fulfillment & Delivery
              </span>
            </div>
          </Link>
        </div>

        {/* Links */}
        <nav className="p-4 flex-1 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-[#274D39] text-white shadow-xs border-l-2 border-[#DDE7DD]"
                    : "hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span className={isActive ? "text-[#DDE7DD]" : "text-white/70"}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info (Desktop) */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between mt-auto bg-black/10">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {userName}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-[#DDE7DD] truncate mt-0.5 leading-none">
              {userRole}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <LogoutIcon size={16} />
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden flex">
          <div className="w-72 bg-[#0F1C15] text-white/80 flex flex-col h-full shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/floria-logo.png"
                  alt="Floria Logo"
                  width={22}
                  height={22}
                  className="object-contain brightness-[5]"
                />
                <span className="font-serif text-sm font-bold text-white">
                  Floria Ops
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 text-white/70 hover:text-white font-bold"
                aria-label="Close navigation drawer"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={[
                      "flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                      isActive
                        ? "bg-forest-700 text-white shadow-sm"
                        : "hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-white truncate">
                  {userName}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-forest-300 truncate">
                  {userRole}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              >
                <LogoutIcon size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-ink-100 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg border border-ink-200 text-ink-700 hover:bg-cream-100"
              aria-label="Open mobile navigation menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse" />
              <span className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                Operations Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell userRole="operations" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-ink-900 leading-tight">
                {userName}
              </p>
              <p className="text-[10px] text-forest-700 font-bold uppercase tracking-wider mt-0.5 leading-none">
                {userRole}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-forest-700 text-white flex items-center justify-center font-bold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
