"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  GridIcon,
  UserGroupIcon,
  LeafIcon,
  SproutIcon,
  PlanterIcon,
  OrderIcon,
  ToolsIcon,
  PayoutIcon,
  StarIcon,
  VerifiedIcon,
  ShieldIcon,
  SettingsIcon,
  AlertIcon,
  SearchIcon,
  BellIcon,
  LockIcon,
  LogoutIcon,
} from "@/components/ui/Icons";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [userName, setUserName] = useState("Admin User");
  const [userRole, setUserRole] = useState<string>("admin");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isStaging, setIsStaging] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host.includes("localhost") || host.includes("vercel.app") || host.includes("staging")) {
        setIsStaging(true);
      }
    }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .maybeSingle();

        const role = profile?.role || session.user.user_metadata?.role || "customer";
        setUserRole(role);
        setUserName(profile?.full_name || session.user.email || "Admin User");

        if (role === "admin" || role === "super_admin") {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (e) {
        console.error("Admin auth check failed:", e);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  const navLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <GridIcon size={18} /> },
    { label: "Users", href: "/admin/users", icon: <UserGroupIcon size={18} /> },
    { label: "Sellers", href: "/admin/sellers", icon: <LeafIcon size={18} /> },
    { label: "Products", href: "/admin/products", icon: <SproutIcon size={18} /> },
    { label: "Categories", href: "/admin/categories", icon: <PlanterIcon size={18} /> },
    { label: "Orders", href: "/admin/orders", icon: <OrderIcon size={18} /> },
    { label: "Inventory", href: "/admin/inventory", icon: <ToolsIcon size={18} /> },
    { label: "Finance & Commission", href: "/admin/finance", icon: <PayoutIcon size={18} /> },
    { label: "Payouts", href: "/admin/payouts", icon: <PayoutIcon size={18} /> },
    { label: "Operations Overview", href: "/admin/operations", icon: <GridIcon size={18} /> },
    { label: "Reviews", href: "/admin/reviews", icon: <StarIcon size={18} /> },
    { label: "Promotions", href: "/admin/promotions", icon: <VerifiedIcon size={18} /> },
    { label: "Reports", href: "/admin/reports", icon: <AlertIcon size={18} /> },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: <ShieldIcon size={18} /> },
    { label: "Settings", href: "/admin/settings", icon: <SettingsIcon size={18} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A2B1A] text-white flex items-center justify-center font-ui">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-forest-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-bold text-white/70">Verifying Admin Permissions...</p>
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
          <h1 className="font-serif text-xl font-bold text-ink-900">403 — Access Denied</h1>
          <p className="text-xs text-ink-500">
            Your account ({userRole}) does not have permission to access the Floria Admin Control Center.
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
    <div className="min-h-screen bg-cream-50 flex font-ui">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#1A2B1A] text-white/70 flex-col flex-shrink-0" aria-label="Admin panel navigation">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Admin dashboard home">
            <Image src="/floria-logo.png" alt="Floria Logo" width={24} height={24} className="object-contain brightness-[5] opacity-80" />
            <div>
              <span className="font-serif text-sm font-semibold text-white tracking-tight block leading-tight">Admin Console</span>
              <span className="text-[9px] uppercase tracking-widest text-forest-400 font-bold block leading-none mt-0.5">Platform Operations</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
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

        {/* User Info Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-white truncate leading-tight">{userName}</p>
            <p className="text-[9px] uppercase tracking-widest text-forest-300 truncate mt-0.5 leading-none">{userRole}</p>
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
          <div className="w-72 bg-[#1A2B1A] text-white/70 flex flex-col h-full shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/floria-logo.png" alt="Floria Logo" width={22} height={22} className="object-contain brightness-[5]" />
                <span className="font-serif text-sm font-bold text-white">Admin Console</span>
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
                <p className="text-xs font-bold text-white truncate">{userName}</p>
                <p className="text-[9px] uppercase tracking-widest text-forest-300 truncate">{userRole}</p>
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

      {/* MAIN CONTENT AREA */}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className={[
              "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border",
              isStaging
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-forest-50 text-forest-700 border-forest-200"
            ].join(" ")}>
              {isStaging ? "Staging Sandbox" : "Production System"}
            </span>
          </div>

          {/* Search bar on desktop */}
          <div className="hidden md:flex items-center relative w-64 max-w-xs">
            <input
              type="text"
              placeholder="Search users, orders, products..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-cream-50/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.currentTarget.value.trim();
                  if (target) {
                    router.push(`/admin/orders?search=${encodeURIComponent(target)}`);
                  }
                }
              }}
            />
            <SearchIcon size={12} className="absolute left-2.5 text-ink-300" />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-1.5 text-ink-400 hover:text-ink-950 transition-colors"
              onClick={() => alert("Notification center: No new alerts.")}
            >
              <BellIcon size={18} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-error-500 ring-2 ring-white animate-ping" />
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-ink-900 leading-tight">{userName}</p>
              <p className="text-[10px] text-forest-700 font-bold uppercase tracking-wider mt-0.5 leading-none">{userRole}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-forest-700 text-white flex items-center justify-center font-bold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page View */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
