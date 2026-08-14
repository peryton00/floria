"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { SearchIcon } from "@/components/ui/Icons";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [rationale, setRationale] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        setError(res.error?.message || "Failed to load users");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (user: any, newStatus: "active" | "suspended") => {
    try {
      setActionLoading(true);
      const res = await api.updateAdminUserStatus(user.id, newStatus, rationale);
      if (res.success) {
        await fetchUsers();
        setSelectedUser(null);
        setRationale("");
      } else {
        alert(res.error?.message || "Failed to update user status");
      }
    } catch (e: any) {
      alert(e.message || "Error performing action");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search) ||
      (u.id || "").toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || (u.status || "active") === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">User Management</h1>
            <p className="text-xs text-ink-400 mt-0.5">View and manage customer, seller, and operations user profiles.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Total Registered:</span>
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 font-bold text-xs border border-forest-100">
              {users.length} Users
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-72 relative">
            <input
              type="search"
              placeholder="Search by name, phone, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="operations">Operations</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No matching user accounts found.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredUsers.map((u) => {
                  const isSuspended = u.status === "suspended";
                  return (
                    <tr key={u.id} className="hover:bg-cream-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center font-bold text-xs">
                            {(u.full_name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-ink-900 leading-tight">{u.full_name || "Anonymous User"}</p>
                            <p className="text-[10px] text-ink-400 font-mono mt-0.5">{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-ink-600 font-mono">{u.phone || "N/A"}</td>
                      <td className="p-4">
                        <span
                          className={[
                            "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                            isSuspended ? "bg-error-50 text-error-700 border border-error-100" : "bg-success-50 text-success-700 border border-success-100",
                          ].join(" ")}
                        >
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-colors"
                        >
                          Manage User
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: User Management Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">{selectedUser.full_name || "User Details"}</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{selectedUser.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="bg-cream-50 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Account Role:</span>
                  <span className="font-bold text-ink-900 uppercase">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Phone:</span>
                  <span className="font-mono text-ink-900">{selectedUser.phone || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Current Status:</span>
                  <span className="font-bold uppercase text-ink-900">{selectedUser.status || "active"}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Audit Log Rationale / Rationale for Action
                </label>
                <textarea
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Enter reason for account suspension or reactivation..."
                  className="w-full p-3 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {selectedUser.status === "suspended" ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedUser, "active")}
                    className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Reactivate Account
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedUser, "suspended")}
                    className="flex-1 py-2.5 rounded-xl bg-error-600 hover:bg-error-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Suspend Account
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider hover:bg-cream-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
