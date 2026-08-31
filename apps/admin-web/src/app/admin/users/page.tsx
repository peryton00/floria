"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { SearchIcon, CloseIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";
import { TableSkeleton } from "@/components/ui/loading";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [rationale, setRationale] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("customer");

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

  const handleOpenManage = (u: any) => {
    setSelectedUser(u);
    setEditName(u.full_name || "");
    setEditPhone(u.phone || "");
    setEditRole(u.role || "customer");
    setIsEditing(false);
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
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">User Administration</h1>
            <p className="text-xs text-ink-400 mt-0.5">Edit customer profiles, update roles, and manage system access authorizations.</p>
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
        <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-72 relative">
            <input
              type="search"
              placeholder="Search users..."
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

        {/* User Card Layout Grid */}
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-400">No matching user accounts found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => {
              const isSuspended = u.status === "suspended";
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-ink-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {(u.full_name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-ink-900 leading-tight truncate">{u.full_name || "Anonymous User"}</p>
                        <p className="text-[9px] text-ink-400 font-mono mt-0.5 truncate">{u.id}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-100">
                      {u.role}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-ink-500 font-medium truncate">Email: {u.email || "N/A"}</p>
                    <p className="text-ink-500 font-medium">Phone: <span className="font-mono text-ink-700">{u.phone || "N/A"}</span></p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-ink-50">
                    <span
                      className={[
                        "px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border",
                        isSuspended
                          ? "bg-error-50 text-error-700 border-error-100"
                          : "bg-success-50 text-success-700 border-success-100",
                      ].join(" ")}
                    >
                      {isSuspended ? "Suspended" : "Active"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenManage(u)}
                      className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[9px] uppercase tracking-wider transition-colors"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: User Editor Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">Manage User Account</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{selectedUser.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-ink-400 hover:text-ink-900 transition-colors p-1"
                  aria-label="Close modal"
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              {/* View/Edit Toggle */}
              <div className="flex border-b border-ink-100 gap-4 text-xs font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`pb-2 border-b-2 transition-colors ${!isEditing ? "border-forest-700 text-forest-700" : "border-transparent text-ink-400"}`}
                >
                  Access Guards
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`pb-2 border-b-2 transition-colors ${isEditing ? "border-forest-700 text-forest-700" : "border-transparent text-ink-400"}`}
                >
                  Edit Profile Fields
                </button>
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="bg-cream-50 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-ink-500 font-semibold">Account Role:</span>
                      <span className="font-bold text-ink-900 uppercase">{selectedUser.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-500 font-semibold">Current Status:</span>
                      <span className="font-bold uppercase text-ink-900">{selectedUser.status || "active"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Audit Log Rationale
                    </label>
                    <textarea
                      rows={3}
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      placeholder="Enter reason for account status update..."
                      className="w-full p-3 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
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
              ) : (
                <form onSubmit={handleSaveDetails} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      User Role
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    >
                      <option value="customer">Customer</option>
                      <option value="seller">Seller / Nursery Partner</option>
                      <option value="operations">Operations Manager</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider hover:bg-cream-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
