"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import {
  SearchIcon,
  CloseIcon,
  EditIcon,
  CopyIcon,
  CheckIcon,
  ShieldIcon,
  UserIcon,
  RefreshIcon,
  UserGroupIcon,
  TruckIcon,
  BagIcon,
  OrderIcon,
  MapPinIcon,
  NurseryIcon,
  WalletIcon,
  AlertIcon,
  LeafIcon,
} from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";
import { TableSkeleton } from "@/components/ui/loading";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [fullUserDetails, setFullUserDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"overview" | "access" | "edit">("overview");
  const [rationale, setRationale] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("customer");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchUsers = async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const res = await api.getAdminUsers({
        limit: 30,
        page: pageNum,
        role: roleFilter !== "all" ? roleFilter : undefined,
        search: search.trim() || undefined,
      });

      if (res.success && res.data) {
        const rows = res.data;
        if (pageNum === 1) {
          setUsers(rows);
        } else {
          setUsers((prev) => {
            const existing = new Set(prev.map((u) => u.id));
            const fresh = rows.filter((u: any) => !existing.has(u.id));
            return [...prev, ...fresh];
          });
        }
        setPage(pageNum);
        setHasMore(rows.length === 30);
      } else {
        if (pageNum === 1) {
          setError(res.error?.message || "Failed to load users");
        }
      }
    } catch (e: any) {
      if (pageNum === 1) {
        setError(e.message || "Failed to connect to API");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreUsers = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchUsers(page + 1);
  };

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: loadMoreUsers,
    hasMore,
    isLoading: loading || loadingMore,
  });

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter]);

  const handleOpenManage = async (u: any) => {
    setSelectedUser(u);
    setFullUserDetails(null);
    setEditName(u.full_name || "");
    setEditPhone(u.phone || "");
    setEditRole(u.role || "customer");
    setActiveModalTab("overview");
    setRationale("");
    try {
      setDetailsLoading(true);
      const res = await api.getAdminUserById(u.id);
      if (res.success && res.data) {
        setFullUserDetails(res.data);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateStatus = async (user: any, newStatus: "active" | "suspended") => {
    try {
      setActionLoading(true);
      const res = await api.updateAdminUserStatus(user.id, newStatus, rationale);
      if (res.success) {
        toast.success("User status updated", `User status updated to ${newStatus}.`);
        await fetchUsers();
        setSelectedUser(null);
        setRationale("");
      } else {
        toast.error("Status update failed", res.error?.message || "Failed to update user status");
      }
    } catch (e: any) {
      toast.error("Status update failed", e.message || "Error performing action");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.updateAdminUser(selectedUser.id, {
        full_name: editName,
        phone: editPhone,
        role: editRole,
      });
      if (res.success) {
        toast.success("User details saved", "User information updated successfully.");
        await fetchUsers();
        setSelectedUser(null);
      } else {
        toast.error("Update failed", res.error?.message || "Failed to update user details");
      }
    } catch (err: any) {
      toast.error("Update failed", err.message || "Error performing update");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("User ID Copied", `Copied "${text.slice(0, 8)}..." to clipboard.`);
    }
  };

  // Metrics calculation
  const totalCount = users.length;
  const sellerCount = users.filter((u) => u.role === "seller").length;
  const customerCount = users.filter((u) => u.role === "customer" || !u.role).length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.phone || "").includes(search) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.id || "").toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || (u.status || "active") === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const getRoleBadgeStyle = (role: string) => {
    switch (role?.toLowerCase()) {
      case "seller":
        return "bg-forest-50 text-forest-800 border-forest-200/90";
      case "admin":
      case "super_admin":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/90";
      case "operations":
        return "bg-sage-50 text-sage-800 border-sage-200/90";
      default:
        return "bg-cream-100/80 text-ink-700 border-cream-300/80";
    }
  };

  return (
    <AdminShell>
      <div className="space-y-8 pb-16 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-cream-300/60">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/[0.04] border border-forest-900/10 text-forest-800 text-[10px] font-mono font-medium tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Identity & Access Management
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-ink-900 leading-none">
              User Administration
            </h1>
            <p className="text-xs sm:text-sm text-ink-600 max-w-xl leading-relaxed">
              Curate member profiles, manage role authorizations (Customers, Sellers, Ops, Admin), and monitor system access guardrails.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchUsers(1)}
              className="p-3 rounded-full bg-white border border-cream-400/60 text-ink-600 hover:text-ink-900 hover:bg-cream-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] focus:outline-none focus:ring-4 focus:ring-forest-700/10 cursor-pointer select-none"
              title="Refresh users"
            >
              <RefreshIcon size={16} className={loading ? "animate-spin" : ""} />
            </button>

            <div className="px-4 py-2 rounded-full bg-forest-900/[0.05] border border-forest-900/10 text-forest-900 font-mono text-xs font-semibold">
              {totalCount} Total Accounts
            </div>
          </div>
        </div>

        {/* Analytics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-1.5 rounded-2xl bg-cream-200/60 border border-cream-400/40">
            <div className="p-3.5 rounded-[calc(1rem-2px)] bg-white/80 border border-white flex flex-col justify-between">
              <span className="text-[10px] font-mono font-medium tracking-wider text-ink-500 uppercase">Customers</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-2xl font-semibold text-ink-900">{customerCount}</span>
                <span className="text-[10px] text-ink-400">buyers</span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-2xl bg-cream-200/60 border border-cream-400/40">
            <div className="p-3.5 rounded-[calc(1rem-2px)] bg-white/80 border border-white flex flex-col justify-between">
              <span className="text-[10px] font-mono font-medium tracking-wider text-forest-700 uppercase">Sellers</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-2xl font-semibold text-forest-800">{sellerCount}</span>
                <span className="text-[10px] text-forest-600">nurseries</span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-2xl bg-cream-200/60 border border-cream-400/40">
            <div className="p-3.5 rounded-[calc(1rem-2px)] bg-white/80 border border-white flex flex-col justify-between">
              <span className="text-[10px] font-mono font-medium tracking-wider text-terracotta-700 uppercase">Suspended</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-2xl font-semibold text-terracotta-800">{suspendedCount}</span>
                <span className="text-[10px] text-terracotta-600">restricted</span>
              </div>
            </div>
          </div>

          <div className="p-1.5 rounded-2xl bg-cream-200/60 border border-cream-400/40">
            <div className="p-3.5 rounded-[calc(1rem-2px)] bg-white/80 border border-white flex flex-col justify-between">
              <span className="text-[10px] font-mono font-medium tracking-wider text-emerald-700 uppercase">Active Status</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-2xl font-semibold text-emerald-800">
                  {totalCount > 0 ? Math.round(((totalCount - suspendedCount) / totalCount) * 100) : 100}%
                </span>
                <span className="text-[10px] text-emerald-600">health</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-error-50 border border-error-100 text-xs text-error-700 flex items-center justify-between font-medium">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-error-600 hover:text-error-900 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters & Search Controls */}
        <div className="p-2 rounded-2xl bg-cream-200/60 border border-cream-400/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Search by name, email, phone, or UUID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-cream-400/70 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] font-sans"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-0.5"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-cream-400/70 text-[11px] text-ink-700 focus:outline-none focus:border-forest-700/60 cursor-pointer shadow-xs font-sans"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller / Nursery</option>
              <option value="operations">Operations</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-cream-400/70 text-[11px] text-ink-700 focus:outline-none focus:border-forest-700/60 cursor-pointer shadow-xs font-sans"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* User Card Layout Grid */}
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-cream-100 border border-dashed border-cream-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-cream-200 text-ink-400 flex items-center justify-center mx-auto">
              <UserGroupIcon size={24} />
            </div>
            <h3 className="font-serif text-lg font-medium text-ink-800">No matching user accounts</h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              Try adjusting your search query or role/status filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              className="inline-block mt-2 px-4 py-1.5 rounded-full bg-white border border-cream-300 text-xs text-ink-700 font-medium hover:bg-cream-50 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((u) => {
              const isSuspended = u.status === "suspended";
              const isCopied = copiedId === u.id;
              const initialLetter = (u.full_name || "U").charAt(0).toUpperCase();

              return (
                /* Doppelrand (Double-Bezel) Outer Enclosure */
                <div
                  key={u.id}
                  className="group relative p-1.5 rounded-[1.75rem] bg-cream-200/70 border border-cream-400/50 shadow-[0_2px_12px_-2px_rgba(30,58,43,0.04)] hover:border-forest-700/25 hover:bg-cream-300/70 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_16px_36px_-8px_rgba(30,58,43,0.08)] flex flex-col justify-between"
                >
                  {/* Inner Content Core */}
                  <div className="p-5 rounded-[calc(1.75rem-0.375rem)] bg-white border border-white/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(30,58,43,0.03)] flex flex-col justify-between space-y-4 h-full">
                    
                    {/* Header Row: Avatar + Name + Role */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Botanical Squircle Avatar */}
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-forest-100 to-forest-200 border border-forest-300/60 text-forest-900 font-serif font-bold text-base flex items-center justify-center shadow-xs flex-shrink-0">
                          {initialLetter}
                        </div>

                        <div className="min-w-0">
                          <p className="font-serif text-base font-semibold text-ink-900 leading-snug group-hover:text-forest-800 transition-colors truncate">
                            {u.full_name || "Anonymous Member"}
                          </p>

                          {/* Copyable UUID capsule */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.id, u.id)}
                            className="group/id inline-flex items-center gap-1 font-mono text-[9px] text-ink-400 hover:text-ink-700 mt-0.5 max-w-[180px] truncate transition-colors"
                            title="Click to copy User UUID"
                          >
                            <span className="truncate">UUID: {u.id?.slice(0, 13)}…</span>
                            {isCopied ? (
                              <CheckIcon size={10} className="text-emerald-600 flex-shrink-0" />
                            ) : (
                              <CopyIcon size={10} className="text-ink-300 group-hover/id:text-ink-600 flex-shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Role Pill */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border shadow-2xs flex-shrink-0 ${getRoleBadgeStyle(
                          u.role
                        )}`}
                      >
                        {u.role || "customer"}
                      </span>
                    </div>

                    {/* Contact Information Details */}
                    <div className="space-y-1.5 text-xs bg-cream-50/60 p-3 rounded-xl border border-cream-200/70">
                      <div className="flex items-center justify-between text-ink-600 gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-400">Email</span>
                        <span className="font-sans font-medium text-ink-900 truncate max-w-[200px]">
                          {u.email || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-ink-600 gap-2 pt-1 border-t border-cream-200/50">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-400">Phone</span>
                        <span className="font-mono text-ink-900 font-medium">
                          {u.phone || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Footer Row: Status + Edit CTA */}
                    <div className="flex justify-between items-center pt-3 border-t border-cream-200/80">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border flex items-center gap-1.5 shadow-2xs ${
                          isSuspended
                            ? "bg-error-50 text-error-800 border-error-200/90"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200/90"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSuspended ? "bg-error-500" : "bg-emerald-500 animate-pulse"
                          }`}
                        />
                        {isSuspended ? "Suspended" : "Active"}
                      </span>

                      {/* Edit Details Island Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenManage(u)}
                        className="group/btn relative inline-flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-forest-800 hover:bg-forest-900 active:bg-forest-950 text-white font-medium text-[11px] uppercase tracking-wider border border-forest-700/60 shadow-[0_2px_8px_-1px_rgba(30,58,43,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-forest-700/15 cursor-pointer select-none"
                      >
                        <span className="font-semibold tracking-wide">Edit Profile</span>
                        <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-white/95 group-hover/btn:bg-white/25 group-hover/btn:rotate-12 transition-all duration-300">
                          <EditIcon size={11} />
                        </span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div
            ref={sentinelRef}
            className="py-6 flex items-center justify-center text-ink-400"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2 text-xs font-mono text-forest-700">
                <span className="w-4 h-4 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading more directory members...</span>
              </div>
            ) : hasMore ? (
              <span className="text-[11px] text-ink-400 font-mono">
                Scroll to load more users
              </span>
            ) : users.length > 0 ? (
              <span className="text-[11px] text-ink-400 font-mono">
                End of member directory ({users.length} total)
              </span>
            ) : null}
          </div>
          </>
        )}

        {/* Modal: User Editor & Ecosystem Intelligence Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="p-1.5 rounded-[2rem] bg-cream-200/95 border border-white/60 shadow-2xl max-w-2xl sm:max-w-3xl w-full animate-in fade-in zoom-in-95 duration-200 my-auto">
              <div className="bg-white rounded-[calc(2rem-0.375rem)] border border-white p-5 sm:p-7 space-y-5 max-h-[88vh] overflow-y-auto font-ui scrollbar-thin">
                
                {/* Modal Header */}
                <div className="flex justify-between items-start border-b border-cream-200/80 pb-4">
                  <div className="space-y-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 text-forest-700 font-mono text-[9px] uppercase tracking-[0.2em] font-semibold">
                      <ShieldIcon size={12} />
                      Member Management &amp; Intelligence
                    </div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 truncate">
                        {selectedUser.full_name || "User Account"}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border shadow-2xs ${getRoleBadgeStyle(selectedUser.role)}`}>
                        {selectedUser.role || "customer"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-[11px] text-ink-600 font-sans font-medium">
                        {selectedUser.email || "No email"}
                      </span>
                      <span className="text-ink-300">•</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedUser.id, `modal-${selectedUser.id}`)}
                        className="group/uuid inline-flex items-center gap-1 font-mono text-[10px] text-ink-400 hover:text-forest-800 transition-colors"
                        title="Copy User UUID"
                      >
                        <span>UUID: {selectedUser.id?.slice(0, 14)}…</span>
                        {copiedId === `modal-${selectedUser.id}` ? (
                          <CheckIcon size={11} className="text-emerald-600" />
                        ) : (
                          <CopyIcon size={11} className="text-ink-400 group-hover/uuid:text-forest-700" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="p-2 rounded-full hover:bg-cream-100 text-ink-400 hover:text-ink-900 transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <CloseIcon size={18} />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-cream-200/80 gap-2 sm:gap-6 text-xs font-mono font-medium uppercase tracking-wider overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab("overview")}
                    className={`pb-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeModalTab === "overview"
                        ? "border-forest-800 text-forest-900 font-bold"
                        : "border-transparent text-ink-400 hover:text-ink-700"
                    }`}
                  >
                    <UserIcon size={13} />
                    <span>Ecosystem Intelligence</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab("access")}
                    className={`pb-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeModalTab === "access"
                        ? "border-forest-800 text-forest-900 font-bold"
                        : "border-transparent text-ink-400 hover:text-ink-700"
                    }`}
                  >
                    <ShieldIcon size={13} />
                    <span>Access Guards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab("edit")}
                    className={`pb-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeModalTab === "edit"
                        ? "border-forest-800 text-forest-900 font-bold"
                        : "border-transparent text-ink-400 hover:text-ink-700"
                    }`}
                  >
                    <EditIcon size={13} />
                    <span>Edit Profile Fields</span>
                  </button>
                </div>

                {/* TAB 1: ECOSYSTEM INTELLIGENCE */}
                {activeModalTab === "overview" && (
                  <div className="space-y-6">
                    {detailsLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-2">
                        <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-ink-500 font-medium font-mono">
                          Loading user intelligence &amp; ecosystem activity...
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* 1. Account Summary Profile Card */}
                        <div className="bg-cream-50/70 border border-cream-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-ink-400 font-bold block">
                              Email Address
                            </span>
                            <span className="font-medium text-ink-900 truncate block" title={fullUserDetails?.email || selectedUser.email || "N/A"}>
                              {fullUserDetails?.email || selectedUser.email || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-ink-400 font-bold block">
                              Phone Number
                            </span>
                            <span className="font-mono text-ink-900 font-medium">
                              {fullUserDetails?.phone || selectedUser.phone || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-ink-400 font-bold block">
                              Account Role
                            </span>
                            <span className="font-bold text-forest-800 uppercase text-[11px]">
                              {selectedUser.role}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-ink-400 font-bold block">
                              System Status
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${selectedUser.status === "suspended" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                              {selectedUser.status || "active"}
                            </span>
                          </div>
                        </div>

                        {/* 2. CUSTOMER DOMAIN: Saved Addresses & Orders */}
                        {(selectedUser.role === "customer" || (fullUserDetails?.customer?.orders?.length ?? 0) > 0 || (fullUserDetails?.customer?.addresses?.length ?? 0) > 0) && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-cream-200 pb-2">
                              <h4 className="font-serif font-bold text-base text-ink-900 flex items-center gap-2">
                                <BagIcon size={16} className="text-forest-700" />
                                Customer Orders &amp; Transportation
                              </h4>
                              <span className="text-xs font-mono text-ink-500 font-bold">
                                {fullUserDetails?.customer?.orders?.length || 0} Orders • {fullUserDetails?.customer?.addresses?.length || 0} Addresses
                              </span>
                            </div>

                            {/* Saved Shipping Addresses */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-700">
                                <MapPinIcon size={13} className="text-forest-700" />
                                <span>Saved Delivery Addresses</span>
                              </div>
                              {(!fullUserDetails?.customer?.addresses || fullUserDetails.customer.addresses.length === 0) ? (
                                <p className="text-xs text-ink-400 italic bg-cream-50/50 p-3 rounded-xl border border-cream-200/60">
                                  No delivery addresses saved by this customer yet.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {fullUserDetails.customer.addresses.map((addr: any) => (
                                    <div key={addr.id} className="p-3 rounded-xl bg-white border border-cream-200 text-xs space-y-1 shadow-2xs">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-ink-900">{addr.full_name || "Recipient"}</span>
                                        {addr.is_default && (
                                          <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-200 text-[9px] font-bold uppercase font-mono">
                                            Default
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-ink-600 text-[11px]">
                                        {[addr.address_line1, addr.address_line2, addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}
                                      </p>
                                      {addr.phone && (
                                        <p className="text-ink-400 font-mono text-[10px]">Phone: {addr.phone}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Recent Customer Orders */}
                            <div className="space-y-2 pt-2">
                              <div className="flex items-center justify-between text-xs font-bold text-ink-700">
                                <div className="flex items-center gap-1.5">
                                  <TruckIcon size={13} className="text-forest-700" />
                                  <span>Order History &amp; Delivery Logistics</span>
                                </div>
                              </div>
                              {(!fullUserDetails?.customer?.orders || fullUserDetails.customer.orders.length === 0) ? (
                                <p className="text-xs text-ink-400 italic bg-cream-50/50 p-3 rounded-xl border border-cream-200/60">
                                  No placed orders recorded for this customer.
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                                  {fullUserDetails.customer.orders.map((ord: any) => (
                                    <div key={ord.id} className="p-3 rounded-xl bg-white border border-cream-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-forest-300 transition-colors">
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-ink-900">
                                            #{ord.id.slice(0, 10)}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                            {ord.status}
                                          </span>
                                          {ord.payment_status && (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                              {ord.payment_status}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-ink-400 font-mono">
                                          {new Date(ord.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                        </p>
                                      </div>
                                      <div className="text-left sm:text-right">
                                        <span className="font-mono font-bold text-forest-800 text-sm">
                                          ₹{Number(ord.total_amount || 0).toLocaleString("en-IN")}
                                        </span>
                                        <p className="text-[10px] text-ink-500">
                                          {ord.order_items?.length || 0} items
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 3. SELLER / NURSERY DOMAIN: Nursery Profile, Catalog, Fulfillments */}
                        {(selectedUser.role === "seller" || fullUserDetails?.seller) && (
                          <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between border-b border-cream-200 pb-2">
                              <h4 className="font-serif font-bold text-base text-ink-900 flex items-center gap-2">
                                <NurseryIcon size={16} className="text-forest-700" />
                                Seller &amp; Nursery Partner Intelligence
                              </h4>
                              <span className="text-xs font-mono text-forest-700 font-bold">
                                {fullUserDetails?.seller?.profile?.public_seller_id || "Nursery Partner"}
                              </span>
                            </div>

                            {fullUserDetails?.seller?.profile && (
                              <div className="p-3.5 rounded-xl bg-forest-50/50 border border-forest-100 text-xs space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-forest-900 text-sm">
                                      {fullUserDetails.seller.profile.business_name || "Nursery Partner"}
                                    </p>
                                    <p className="text-ink-500 text-[11px] mt-0.5">
                                      {fullUserDetails.seller.profile.business_description || "No description provided."}
                                    </p>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-white text-forest-800 border border-forest-200">
                                    {fullUserDetails.seller.profile.status || "approved"}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-600 pt-1 border-t border-forest-100/80">
                                  <p><span className="text-ink-400 font-mono uppercase text-[9px]">Contact Email:</span> {fullUserDetails.seller.profile.contact_email || "N/A"}</p>
                                  <p><span className="text-ink-400 font-mono uppercase text-[9px]">Contact Phone:</span> {fullUserDetails.seller.profile.contact_phone || "N/A"}</p>
                                </div>
                              </div>
                            )}

                            {/* Nursery Products Catalog Preview */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-bold text-ink-700">
                                <span className="flex items-center gap-1.5">
                                  <LeafIcon size={13} className="text-forest-700" />
                                  Nursery Catalog Products ({fullUserDetails?.seller?.products?.length || 0})
                                </span>
                              </div>
                              {(!fullUserDetails?.seller?.products || fullUserDetails.seller.products.length === 0) ? (
                                <p className="text-xs text-ink-400 italic bg-cream-50/50 p-3 rounded-xl border border-cream-200/60">
                                  No catalog products listed by this nursery yet.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
                                  {fullUserDetails.seller.products.map((prod: any) => (
                                    <div key={prod.id} className="p-2.5 rounded-xl bg-white border border-cream-200 text-xs flex justify-between items-center">
                                      <div className="min-w-0 pr-2">
                                        <p className="font-bold text-ink-900 truncate">{prod.name}</p>
                                        <p className="text-[10px] text-ink-400 font-mono">Stock: {prod.inventory?.stock_quantity ?? "—"}</p>
                                      </div>
                                      <span className="font-mono font-bold text-forest-800 text-xs flex-shrink-0">
                                        ₹{(Number(prod.regular_price_paise || 0) / 100).toFixed(0)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 4. DELIVERY PARTNER DOMAIN: Courier Profile, Vehicle, Runs & Earnings */}
                        {(selectedUser.role === "delivery_partner" || fullUserDetails?.deliveryPartner) && (
                          <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between border-b border-cream-200 pb-2">
                              <h4 className="font-serif font-bold text-base text-ink-900 flex items-center gap-2">
                                <TruckIcon size={16} className="text-forest-700" />
                                Delivery Partner &amp; Courier Logistics
                              </h4>
                              <span className="text-xs font-mono text-forest-700 font-bold">
                                {fullUserDetails?.deliveryPartner?.partner?.public_partner_id || "Courier Partner"}
                              </span>
                            </div>

                            {/* Courier Verification & Vehicle Details */}
                            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-[9px] font-mono uppercase text-ink-400 font-bold block">Vehicle Type</span>
                                <span className="font-bold text-ink-900 uppercase text-[11px]">
                                  {fullUserDetails?.deliveryPartner?.partner?.vehicle_type || "two_wheeler"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] font-mono uppercase text-ink-400 font-bold block">Vehicle Plate</span>
                                <span className="font-mono font-bold text-ink-900 text-[11px]">
                                  {fullUserDetails?.deliveryPartner?.partner?.vehicle_number || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] font-mono uppercase text-ink-400 font-bold block">Driving License</span>
                                <span className="font-mono text-ink-900 text-[11px] truncate block" title={fullUserDetails?.deliveryPartner?.partner?.driving_license}>
                                  {fullUserDetails?.deliveryPartner?.partner?.driving_license || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] font-mono uppercase text-ink-400 font-bold block">Duty Status</span>
                                <span className={`inline-flex items-center gap-1 font-mono font-bold text-[10px] ${fullUserDetails?.deliveryPartner?.partner?.on_duty ? "text-emerald-700" : "text-ink-500"}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${fullUserDetails?.deliveryPartner?.partner?.on_duty ? "bg-emerald-500 animate-pulse" : "bg-ink-300"}`} />
                                  {fullUserDetails?.deliveryPartner?.partner?.on_duty ? "ON DUTY" : "OFF DUTY"}
                                </span>
                              </div>
                            </div>

                            {/* Courier Delivery Runs */}
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-ink-700 block">
                                Assigned Delivery Runs ({fullUserDetails?.deliveryPartner?.deliveries?.length || 0})
                              </span>
                              {(!fullUserDetails?.deliveryPartner?.deliveries || fullUserDetails.deliveryPartner.deliveries.length === 0) ? (
                                <p className="text-xs text-ink-400 italic bg-cream-50/50 p-3 rounded-xl border border-cream-200/60">
                                  No delivery assignments dispatched to this partner yet.
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin pr-1">
                                  {fullUserDetails.deliveryPartner.deliveries.map((del: any) => (
                                    <div key={del.id} className="p-3 rounded-xl bg-white border border-cream-200 text-xs flex justify-between items-center shadow-2xs">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-ink-900">Order #{del.order_id?.slice(0, 10)}</span>
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-forest-50 text-forest-700 border border-forest-200">
                                            {del.status}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-ink-500 mt-0.5">
                                          Destination: {del.order?.delivery_address_snapshot?.city || "Bangalore"} ({del.order?.delivery_address_snapshot?.postal_code || ""})
                                        </p>
                                      </div>
                                      <span className="font-mono text-[10px] text-ink-400">
                                        {new Date(del.created_at).toLocaleDateString("en-IN")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Courier Earnings */}
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
                                <WalletIcon size={13} className="text-forest-700" />
                                Earnings Ledger ({fullUserDetails?.deliveryPartner?.earnings?.length || 0} Transactions)
                              </span>
                              {(!fullUserDetails?.deliveryPartner?.earnings || fullUserDetails.deliveryPartner.earnings.length === 0) ? (
                                <p className="text-xs text-ink-400 italic bg-cream-50/50 p-3 rounded-xl border border-cream-200/60">
                                  No payout earnings ledger records found.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto scrollbar-thin">
                                  {fullUserDetails.deliveryPartner.earnings.map((earn: any) => (
                                    <div key={earn.id} className="p-2.5 rounded-xl bg-white border border-cream-200 text-xs flex justify-between items-center">
                                      <div>
                                        <p className="font-mono font-bold text-ink-900">₹{(earn.total_earning_paise / 100).toFixed(0)}</p>
                                        <p className="text-[9px] text-ink-400 font-mono">Base: ₹{(earn.base_earning_paise / 100).toFixed(0)}</p>
                                      </div>
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        {earn.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 5. ADMIN / OPERATIONS DOMAIN */}
                        {(selectedUser.role === "admin" || selectedUser.role === "super_admin" || selectedUser.role === "operations") && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between border-b border-cream-200 pb-2">
                              <h4 className="font-serif font-bold text-base text-ink-900 flex items-center gap-2">
                                <ShieldIcon size={16} className="text-forest-700" />
                                Administrative &amp; Operations Authority
                              </h4>
                              <span className="text-xs font-mono text-forest-700 font-bold uppercase">
                                System Tier: {selectedUser.role}
                              </span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-cream-100/60 border border-cream-200 text-xs space-y-1.5">
                              <p className="font-bold text-ink-900">Platform Capabilities Granted:</p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {["User Directory", "Seller Approvals", "Delivery Logistics", "Financial Payouts", "Audit Trails", "Rate Card Engine"].map((cap) => (
                                  <span key={cap} className="px-2.5 py-1 rounded-lg bg-white border border-cream-300 font-mono text-[10px] text-forest-800 font-semibold shadow-2xs">
                                    ✓ {cap}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 6. SECURITY & AUDIT TRAIL LOGS */}
                        {(fullUserDetails?.auditLogs?.length ?? 0) > 0 && (
                          <div className="space-y-2 pt-2 border-t border-cream-200">
                            <span className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
                              <AlertIcon size={13} className="text-forest-700" />
                              Recent Security &amp; Audit Events
                            </span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                              {fullUserDetails.auditLogs.map((log: any) => (
                                <div key={log.id} className="p-2 rounded-lg bg-cream-50/60 border border-cream-200 text-[11px] flex justify-between items-center">
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="font-mono font-bold text-forest-900">{log.action}</span>
                                    <span className="text-ink-400 font-mono text-[10px]">{log.resource_type}</span>
                                  </div>
                                  <span className="font-mono text-[10px] text-ink-400 flex-shrink-0">
                                    {new Date(log.created_at).toLocaleDateString("en-IN")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-end pt-3 border-t border-cream-200/80">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="px-6 py-2.5 rounded-full bg-forest-800 hover:bg-forest-900 text-white font-medium text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Done Reviewing
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: ACCESS GUARDS */}
                {activeModalTab === "access" && (
                  <div className="space-y-4">
                    <div className="bg-cream-50/70 border border-cream-300/60 rounded-2xl p-4 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-ink-500 font-mono uppercase text-[10px]">Account Role</span>
                        <span className="font-mono font-bold text-ink-900 uppercase text-xs">
                          {selectedUser.role}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-cream-200/60">
                        <span className="text-ink-500 font-mono uppercase text-[10px]">Current Status</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                            selectedUser.status === "suspended"
                              ? "bg-error-50 text-error-800 border-error-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {selectedUser.status || "active"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-ink-700">
                        Audit Log Rationale <span className="text-terracotta-600">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="Enter justification for modifying user system authorization..."
                        className="w-full p-3.5 rounded-xl border border-cream-400/80 text-xs text-ink-900 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 bg-cream-50/50 transition-all placeholder:text-ink-400 resize-none font-sans"
                      />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-cream-200/80">
                      {selectedUser.status === "suspended" ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(selectedUser, "active")}
                          className="flex-1 py-3 rounded-full bg-forest-800 hover:bg-forest-900 active:bg-forest-950 text-white font-medium text-xs uppercase tracking-wider border border-forest-700/60 shadow-[0_4px_16px_-2px_rgba(30,58,43,0.25)] transition-all duration-300 disabled:opacity-50 cursor-pointer"
                        >
                          Reactivate Account
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(selectedUser, "suspended")}
                          className="flex-1 py-3 rounded-full bg-error-600 hover:bg-error-700 text-white font-medium text-xs uppercase tracking-wider border border-error-500 shadow-[0_4px_16px_-2px_rgba(220,38,38,0.25)] transition-all duration-300 disabled:opacity-50 cursor-pointer"
                        >
                          Suspend Account
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="px-5 py-3 rounded-full border border-cream-400/80 text-ink-700 font-medium text-xs uppercase tracking-wider hover:bg-cream-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: EDIT PROFILE FIELDS */}
                {activeModalTab === "edit" && (
                  <form onSubmit={handleSaveDetails} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-ink-700">
                        Full Name <span className="text-terracotta-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-400/80 text-xs text-ink-900 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 bg-cream-50/50 transition-all font-sans"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-ink-700">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-400/80 text-xs font-mono text-ink-900 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 bg-cream-50/50 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono font-medium uppercase tracking-wider text-ink-700">
                        User Role Authorization
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-cream-400/80 text-xs text-ink-900 focus:outline-none focus:border-forest-700/60 focus:ring-4 focus:ring-forest-700/5 bg-cream-50/50 transition-all font-sans cursor-pointer"
                      >
                        <option value="customer">Customer (Standard Buyer)</option>
                        <option value="seller">Seller / Nursery Partner</option>
                        <option value="delivery_partner">Delivery Partner (Courier)</option>
                        <option value="operations">Operations Manager</option>
                        <option value="admin">Platform Admin</option>
                        <option value="super_admin">Super Admin (Root)</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-cream-200/80">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 py-3 px-6 rounded-full bg-forest-800 hover:bg-forest-900 active:bg-forest-950 text-white font-medium text-xs uppercase tracking-wider border border-forest-700/60 shadow-[0_4px_16px_-2px_rgba(30,58,43,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-forest-700/20 disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="px-5 py-3 rounded-full border border-cream-400/80 text-ink-700 font-medium text-xs uppercase tracking-wider hover:bg-cream-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
