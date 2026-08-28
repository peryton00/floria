"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  CategoriesIcon,
  PlusIcon,
  RefreshIcon,
  EditIcon,
  DeleteIcon,
} from "@/components/ui/Icons";

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      } else {
        setError(res.error?.message || "Failed to load categories.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to category service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      setCreating(true);
      const autoSlug =
        slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const res = await api.createAdminCategory({
        name: name.trim(),
        slug: autoSlug,
        description: description.trim() || undefined,
      });

      if (res.success) {
        toast.success("Category Created", `'${name}' added to taxonomy.`);
        setName("");
        setSlug("");
        setDescription("");
        await fetchCategories();
      } else {
        toast.error(
          "Creation Failed",
          res.error?.message || "Could not create category.",
        );
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Could not create category.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Category Taxonomy & Navigation
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Define plant classifications, indoor/outdoor groupings, and
            marketplace discovery hierarchy
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCategories}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Taxonomy
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Category Form */}
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900 border-b border-cream-300 pb-2 flex items-center gap-2">
            <PlusIcon size={16} /> Add Botanical Category
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rare Aroids"
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                URL Slug (Optional)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="rare-aroids"
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Category summary for customer search and filtering..."
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 bg-forest-900 hover:bg-forest-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
            >
              {creating ? "Adding Category..." : "Save Category"}
            </button>
          </form>
        </div>

        {/* Categories List Table */}
        <div className="lg:col-span-2 bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-cream-300 font-serif font-bold text-base text-ink-900">
            Active Taxonomy Categories ({categories.length})
          </div>

          <div className="divide-y divide-cream-300">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-cream-100/60 transition-colors"
              >
                <div>
                  <div className="font-bold text-ink-900 text-sm">{c.name}</div>
                  <div className="text-[11px] font-mono text-forest-800">
                    /{c.slug}
                  </div>
                  {c.description && (
                    <div className="text-xs text-ink-500 mt-1">
                      {c.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
