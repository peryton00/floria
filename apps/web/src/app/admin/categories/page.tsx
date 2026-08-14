"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      } else {
        setError(res.error?.message || "Failed to load categories");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.createAdminCategory({ name, slug, description, display_order: displayOrder });
      if (res.success) {
        await fetchCategories();
        setShowCreateModal(false);
        resetForm();
      } else {
        alert(res.error?.message || "Failed to create category");
      }
    } catch (e: any) {
      alert(e.message || "Error creating category");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (cat: any) => {
    if (cat.is_active) {
      // Safety check: detect assigned active products before deactivating
      const countRes = await api.getCategoryProductsCount(cat.id);
      const activeCount = countRes.data?.activeProductsCount || 0;
      if (activeCount > 0) {
        const confirmDisable = confirm(
          `Warning: Category '${cat.name}' has ${activeCount} active product listings assigned to it.\nDeactivating this category will hide these products from storefront search filters.\n\nDo you wish to proceed?`
        );
        if (!confirmDisable) return;
      }
    }

    try {
      const res = await api.updateAdminCategory(cat.id, { is_active: !cat.is_active });
      if (res.success) {
        await fetchCategories();
      } else {
        alert(res.error?.message || "Failed to update category status");
      }
    } catch (e: any) {
      alert(e.message || "Error updating category");
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setDisplayOrder(1);
    setEditingCategory(null);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Category Management</h1>
            <p className="text-xs text-ink-400 mt-0.5">Organize plant and garden catalog taxonomies and display order.</p>
          </div>

          <button
            type="button"
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            + Create New Category
          </button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Categories Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No categories found in system.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Order</th>
                  <th className="p-4">Category Name</th>
                  <th className="p-4">URL Slug</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-cream-50/50">
                    <td className="p-4 font-mono font-bold text-ink-900">{c.display_order ?? 0}</td>
                    <td className="p-4 font-bold text-ink-900">{c.name}</td>
                    <td className="p-4 font-mono text-ink-500">{c.slug}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${c.is_active ? "bg-success-50 text-success-700 border border-success-100" : "bg-ink-100 text-ink-500"}`}>
                        {c.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 font-bold text-[10px] uppercase tracking-wider text-ink-700"
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Create Category */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-ink-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-ink-900">Create New Category</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Rare Succulents"
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    URL Slug (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="rare-succulents"
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description for customer category page..."
                    className="w-full p-3 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Display Order Position
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Save Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
