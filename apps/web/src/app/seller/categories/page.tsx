"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FolderTree, Info } from "lucide-react";

export default function SellerCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCats() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        } else {
          setError(res.error?.message || "Failed to load catalog taxonomy");
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to API");
      } finally {
        setLoading(false);
      }
    }
    fetchCats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Marketplace Categories</h1>
        <p className="text-xs text-ink-400 mt-0.5">Reference of product taxons, divisions, and categories established by platform administrators.</p>
      </div>

      {/* Info notice about categories */}
      <div className="bg-cream-50 rounded-2xl border border-ink-100 p-6 flex gap-3 text-xs">
        <Info className="text-forest-700 flex-shrink-0 mt-0.5" size={20} />
        <div className="space-y-1.5">
          <h2 className="font-bold text-ink-900 text-sm">Category Assignment & Classification Policy</h2>
          <p className="text-ink-600 leading-relaxed">
            All nursery products listed on the Floria marketplace must be classified under one of the global taxonomies listed below. Sellers do not have permissions to modify, delete, or create new categories. If you need a new classification category for your products, please contact the platform administration team.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
          <span>{error}</span>
        </div>
      )}

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs flex flex-col justify-between hover:border-forest-300 transition-colors">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
                <FolderTree size={16} />
              </div>
              <h3 className="font-bold text-ink-900 text-sm">{c.name}</h3>
              <p className="text-xs text-ink-500 line-clamp-3 leading-relaxed">{c.description || "No description provided."}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-ink-50 flex justify-between items-center text-[10px] text-ink-400 font-mono">
              <span>Slug: {c.slug}</span>
              <span className="font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
