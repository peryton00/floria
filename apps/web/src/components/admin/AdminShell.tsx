"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
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
    { label: "System Diagnostics", href: "/admin/system-health", icon: <AlertIcon size={18} /> },
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-[#0F172A]">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#0F172A] text-slate-400 flex-col flex-shrink-0 border-r border-slate-800" aria-label="Admin panel navigation">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Admin dashboard home">
            <div className="w-8 h-8 rounded bg-[#1B4D3E] flex items-center justify-center p-1.5 flex-shrink-0">
              <Image src="/floria-logo.png" alt="Floria Logo" width={20} height={20} className="object-contain brightness-[5]" />
            </div>
            <div>
              <span className="font-sans text-sm font-bold text-white tracking-tight block leading-tight">Floria Console</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-semibold block leading-none mt-0.5">Admin Cockpit v2</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold tracking-wide transition-all",
                  isActive
                    ? "bg-[#1B4D3E] text-white font-bold shadow-xs border-l-2 border-emerald-400"
                    : "hover:bg-slate-800/60 hover:text-slate-200",
                ].join(" ")}
              >
                <span className={isActive ? "text-emerald-300" : "text-slate-400"}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-white truncate leading-tight">{userName}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-medium truncate mt-0.5 leading-none">{userRole}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <LogoutIcon size={16} />
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden flex">
          <div className="w-72 bg-[#0F172A] text-slate-400 flex flex-col h-full shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#1B4D3E] flex items-center justify-center p-1.5">
                  <Image src="/floria-logo.png" alt="Floria Logo" width={20} height={20} className="object-contain brightness-[5]" />
                </div>
                <div>
                  <span className="font-sans text-sm font-bold text-white">Floria Console</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 block mt-0.5">Admin Cockpit</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-white font-bold"
                aria-label="Close navigation drawer"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={[
                      "flex items-center gap-3 px-3 py-2.5 rounded text-xs font-semibold tracking-wide transition-all",
                      isActive
                        ? "bg-[#1B4D3E] text-white font-bold border-l-2 border-emerald-400"
                        : "hover:bg-slate-800/60 hover:text-slate-200",
                    ].join(" ")}
                  >
                    <span className={isActive ? "text-emerald-300" : "text-slate-400"}>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-white truncate">{userName}</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 truncate">{userRole}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <LogoutIcon size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Header */}
        <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-1.5 rounded border border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
              aria-label="Open mobile navigation menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className={[
              "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border",
              isStaging
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-[#1B4D3E] border-emerald-200"
            ].join(" ")}>
              ● {isStaging ? "Staging Sandbox" : "Production Node"}
            </span>
          </div>

          {/* Search bar on desktop */}
          <div className="hidden md:flex items-center relative w-72 max-w-sm">
            <input
              type="text"
              placeholder="Quick search orders, nurseries, SKUs..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] bg-[#F8FAFC] font-sans placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.currentTarget.value.trim();
                  if (target) {
                    router.push(`/admin/orders?search=${encodeURIComponent(target)}`);
                  }
                }
              }}
            />
            <SearchIcon size={12} className="absolute left-2.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-3.5">
            <NotificationBell userRole="admin" />
            <div className="h-4 w-px bg-[#E2E8F0]" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#0F172A] leading-tight">{userName}</p>
              <p className="font-mono text-[9px] text-[#1B4D3E] font-bold uppercase tracking-wider mt-0.5 leading-none">{userRole}</p>
            </div>
            <div className="w-7 h-7 rounded bg-[#1B4D3E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page View */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
