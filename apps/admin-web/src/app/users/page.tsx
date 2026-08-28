"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  UsersIcon,
  SearchIcon,
  RefreshIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        setError(res.error?.message || "Failed to load platform users.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to user service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (
    userId: string,
    status: "active" | "suspended",
  ) => {
    if (!window.confirm(`Change status of this user to '${status}'?`)) return;

    try {
      setActionLoading(true);
      const res = await api.updateAdminUserStatus(userId, status);
      if (res.success) {
        toast.success("Status Updated", `User status set to '${status}'.`);
        await fetchUsers();
      } else {
        toast.error(
          "Update Failed",
          res.error?.message || "Could not update user status.",
        );
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Could not update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const email = (u.email || "").toLowerCase();
    const name = (u.full_name || u.name || "").toLowerCase();
    return (
      email.includes(searchTerm.toLowerCase()) ||
      name.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            User Accounts & Role Governance
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Manage customer accounts, seller authorizations, operations
            couriers, and administrator privileges
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Users
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <SearchIcon
            size={16}
            className="absolute left-3 top-2.5 text-ink-400"
          />
          <input
            type="text"
            placeholder="Search email or full name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>

        <div className="text-xs font-bold text-ink-500">
          Total Registered Accounts: {users.length}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">User / Full Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 text-right">Account Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-cream-100/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-ink-900 text-sm">
                        {u.full_name || u.name || "Customer"}
                      </div>
                      <div className="text-[10px] text-ink-400 font-mono">
                        ID: {u.id ? `${String(u.id).substring(0, 8)}` : "—"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-ink-800">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin" || u.role === "super_admin"
                            ? "bg-forest-800 text-white"
                            : u.role === "seller"
                              ? "bg-forest-100 text-forest-800 border border-forest-200"
                              : u.role === "operations"
                                ? "bg-warning-100 text-warning-800 border border-warning-200"
                                : "bg-cream-200 text-ink-700"
                        }`}
                      >
                        {u.role || "customer"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-ink-500">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          handleStatusChange(
                            u.id,
                            u.status === "suspended" ? "active" : "suspended",
                          )
                        }
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 ${
                          u.status === "suspended"
                            ? "bg-forest-800 text-white hover:bg-forest-900"
                            : "bg-cream-200 text-error-700 hover:bg-error-50"
                        }`}
                      >
                        {u.status === "suspended" ? "Unsuspend" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 text-xs text-ink-500">
            No users found matching query.
          </div>
        )}
      </div>
    </div>
  );
}
