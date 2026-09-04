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
  LockIcon,
  LogoutIcon,
  ImageIcon,
  CloseIcon,
  TruckIcon,
} from "@/components/ui/Icons";

interface AdminShellProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [userName, setUserName] = useState("Admin User");
  const [userRole, setUserRole] = useState<string>("admin");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [envLabel, setEnvLabel] = useState<"production" | "staging" | "local">("production");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const explicitEnv = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NEXT_PUBLIC_APP_ENV;

      if (explicitEnv === "production") {
        setEnvLabel("production");
      } else if (explicitEnv === "staging" || host.startsWith("staging.") || host.startsWith("sandbox.") || host.includes("-preview")) {
        setEnvLabel("staging");
      } else if (host === "localhost" || host === "127.0.0.1") {
        setEnvLabel("local");
      } else {
        // Any deployed domain defaults to Production Node unless explicitly staging/preview
        setEnvLabel("production");
      }
    }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .maybeSingle();

        const role = profile?.role || session.user.user_metadata?.role;
        if (role !== "admin" && role !== "super_admin") {
          setAuthorized(false);
        } else {
          setAuthorized(true);
          setUserName(profile?.full_name || session.user.email?.split("@")[0] || "Admin");
          setUserRole(role);
        }
      } catch (e) {
        console.error("Auth check failed:", e);
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

  // Structured Botanical Nav Groups
  const navSections: NavGroup[] = [
    {
      group: "Core Control",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: <GridIcon size={16} /> },
        { label: "System Diagnostics", href: "/admin/system-health", icon: <AlertIcon size={16} /> },
        { label: "Operations Overview", href: "/admin/operations", icon: <GridIcon size={16} /> },
      ],
    },
    {
      group: "Catalog & Taxa",
      items: [
        { label: "Products", href: "/admin/products", icon: <SproutIcon size={16} /> },
        { label: "Categories", href: "/admin/categories", icon: <PlanterIcon size={16} /> },
        { label: "Media & Images", href: "/admin/media", icon: <ImageIcon size={16} /> },
        { label: "Inventory", href: "/admin/inventory", icon: <ToolsIcon size={16} /> },
      ],
    },
    {
      group: "Commerce & Ledger",
      items: [
        { label: "Orders", href: "/admin/orders", icon: <OrderIcon size={16} /> },
        { label: "Finance & Commission", href: "/admin/finance", icon: <PayoutIcon size={16} /> },
        { label: "Payouts", href: "/admin/payouts", icon: <PayoutIcon size={16} /> },
        { label: "Promotions", href: "/admin/promotions", icon: <VerifiedIcon size={16} /> },
        { label: "Reviews", href: "/admin/reviews", icon: <StarIcon size={16} /> },
      ],
    },
    {
      group: "Directory & Policy",
      items: [
        { label: "Users", href: "/admin/users", icon: <UserGroupIcon size={16} /> },
        { label: "Sellers", href: "/admin/sellers", icon: <LeafIcon size={16} /> },
        { label: "Delivery Partners", href: "/admin/delivery-partners", icon: <TruckIcon size={16} /> },
        { label: "Reports", href: "/admin/reports", icon: <AlertIcon size={16} /> },
        { label: "Audit Logs", href: "/admin/audit-logs", icon: <ShieldIcon size={16} /> },
        { label: "Business Policies", href: "/admin/settings", icon: <SettingsIcon size={16} /> },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1B13] text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/60">
            Verifying Authority...
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 font-sans">
        <div className="p-1.5 rounded-[2rem] bg-cream-200/80 border border-cream-400/60 shadow-2xl max-w-md w-full text-center">
          <div className="bg-white rounded-[calc(2rem-0.375rem)] p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-error-50 text-error-600 border border-error-100 flex items-center justify-center mx-auto shadow-xs">
              <LockIcon size={24} />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-ink-900">403 — Restricted Entry</h1>
            <p className="text-xs text-ink-600 leading-relaxed">
              Your account ({userRole}) does not have administrative privileges in the Floria Database.
            </p>
            <div className="pt-3 flex flex-col gap-2.5">
              <Link
                href="/"
                className="w-full py-2.5 rounded-full bg-forest-800 hover:bg-forest-900 text-white font-medium text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                Return to Storefront
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 text-xs font-mono text-ink-500 hover:text-ink-900 transition-colors cursor-pointer"
              >
                Sign Out & Switch Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex font-sans antialiased text-[#212529]">
      {/* DESKTOP SIDEBAR — Machined Botanical Luxury Enclosure */}
      <aside
        className="hidden md:flex w-64 h-screen sticky top-0 bg-[#0E1B13] text-white flex-col flex-shrink-0 border-r border-emerald-950/60 shadow-[8px_0_32px_-8px_rgba(0,0,0,0.35)] select-none z-20"
        aria-label="Admin panel navigation"
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0 bg-white/[0.015]">
          <Link
            href="/"
            className="group flex items-center gap-3 w-full p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-400/30 hover:bg-white/[0.06] transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
            aria-label="Admin dashboard home"
          >
            {/* Medallion Logo Frame */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-600 via-forest-700 to-forest-900 border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-center p-2 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/brand_logo.svg"
                alt="Floria Logo"
                width={18}
                height={18}
                className="w-auto h-5 object-contain brightness-0 invert"
              />
            </div>
            <div className="min-w-0">
              <span className="font-serif text-[15px] font-semibold text-white tracking-tight block leading-tight group-hover:text-emerald-300 transition-colors">
                Floria Console
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400 font-semibold block leading-none mt-1">
                Root Authority
              </span>
            </div>
          </Link>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto min-h-0 custom-scrollbar">
          {navSections.map((sec) => (
            <div key={sec.group} className="space-y-1">
              {/* Group Eyebrow */}
              <div className="px-3 pt-2 pb-1 text-[9px] font-mono font-medium uppercase tracking-[0.22em] text-emerald-200/40">
                {sec.group}
              </div>

              {/* Group Items */}
              <div className="space-y-0.5">
                {sec.items.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`group/nav relative flex items-center justify-between px-3.5 py-2 rounded-xl text-xs tracking-wide transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-500/15 via-white/[0.08] to-transparent text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.2)] border-l-2 border-emerald-400"
                          : "text-white/65 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`flex-shrink-0 transition-colors ${
                            isActive ? "text-emerald-400" : "text-white/50 group-hover/nav:text-white/90"
                          }`}
                        >
                          {link.icon}
                        </span>
                        <span className="truncate">{link.label}</span>
                      </div>

                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Identity Footer Capsule */}
        <div className="p-3 border-t border-white/[0.06] bg-black/25 flex-shrink-0">
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-700 to-forest-800 text-white font-serif font-bold text-xs flex items-center justify-center flex-shrink-0 border border-white/20 shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-snug">{userName}</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-medium truncate">
                  {userRole}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <LogoutIcon size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs md:hidden flex animate-in fade-in duration-200">
          <div className="w-72 bg-[#0E1B13] text-white flex flex-col h-full shadow-2xl border-r border-white/10">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forest-600 to-forest-800 border border-white/20 flex items-center justify-center p-1.5">
                  <Image
                    src="/brand_logo.svg"
                    alt="Floria Logo"
                    width={18}
                    height={18}
                    className="w-auto h-5 object-contain brightness-0 invert"
                  />
                </div>
                <div>
                  <span className="font-serif text-sm font-semibold text-white">Floria Console</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400 block mt-0.5">
                    Root Authority
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Close navigation drawer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
              {navSections.map((sec) => (
                <div key={sec.group} className="space-y-1">
                  <div className="px-3 pt-2 pb-1 text-[9px] font-mono font-medium uppercase tracking-[0.22em] text-emerald-200/40">
                    {sec.group}
                  </div>
                  <div className="space-y-0.5">
                    {sec.items.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs tracking-wide transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-emerald-500/20 via-white/[0.08] to-transparent text-white font-semibold border-l-2 border-emerald-400"
                              : "text-white/65 hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={isActive ? "text-emerald-400" : "text-white/50"}>
                              {link.icon}
                            </span>
                            <span>{link.label}</span>
                          </div>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-white/[0.08] bg-black/25">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold text-white truncate">{userName}</p>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 truncate">
                    {userRole}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
                >
                  <LogoutIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* MAIN CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F9F8F3]">
        {/* Top App Header */}
        <header className="h-14 bg-white/95 backdrop-blur-md border-b border-cream-400/60 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-cream-400/80 text-ink-900 hover:bg-cream-100 transition-colors cursor-pointer"
              aria-label="Open mobile navigation menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Environmental Indicator Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-semibold uppercase tracking-[0.16em] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] ${
                envLabel === "production"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300/70"
                  : envLabel === "staging"
                  ? "bg-amber-50 text-amber-900 border-amber-300/70"
                  : "bg-sage-50 text-forest-900 border-forest-200/80"
              }`}
            >
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    envLabel === "production"
                      ? "bg-emerald-400"
                      : envLabel === "staging"
                      ? "bg-amber-400"
                      : "bg-forest-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    envLabel === "production"
                      ? "bg-emerald-600"
                      : envLabel === "staging"
                      ? "bg-amber-600"
                      : "bg-forest-600"
                  }`}
                />
              </span>
              <span>
                {envLabel === "production"
                  ? "Production Node"
                  : envLabel === "staging"
                  ? "Staging Sandbox"
                  : "Local Node"}
              </span>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex items-center relative w-72 max-w-sm">
            <SearchIcon size={14} className="absolute left-3 text-ink-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Quick search orders, nurseries, SKUs..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-cream-400/80 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 bg-cream-50/50 font-sans text-ink-900 placeholder:text-ink-400 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.currentTarget.value.trim();
                  if (target) {
                    router.push(`/admin/orders?search=${encodeURIComponent(target)}`);
                  }
                }
              }}
            />
          </div>

          {/* Top Right Status & Profile Capsule */}
          <div className="flex items-center gap-3.5">
            <NotificationBell userRole="admin" />
            <div className="h-4 w-px bg-cream-300" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-ink-900 leading-tight">{userName}</p>
              <p className="font-mono text-[9px] text-forest-700 font-bold uppercase tracking-wider mt-0.5 leading-none">
                {userRole}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forest-800 to-forest-900 text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs border border-forest-700">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
