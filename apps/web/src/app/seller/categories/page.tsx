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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-ui">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Marketplace Taxonomies</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">Reference of botanical taxonomies, species divisions, and categories established by platform administrators.</p>
      </div>

      {/* Info notice about categories */}
      <div className="bg-floria-linen rounded-3xl border border-floria-border p-6 flex gap-3.5 text-xs shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info size={18} />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-serif font-bold text-ink-900 text-sm sm:text-base">Category Classification Policy</h2>
          <p className="text-ink-600 leading-relaxed text-xs sm:text-sm">
            All botanical varieties and nursery products listed on the Floria marketplace must be mapped to one of the verified global classifications below. If you require a specialized taxonomy for rare or endemic plant species, please contact the Floria horticultural support desk.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 shadow-2xs">
          <span>{error}</span>
        </div>
      )}

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-floria-linen rounded-2xl border border-floria-border p-5 shadow-xs flex flex-col justify-between hover:border-forest-700/50 hover:shadow-sm transition-all">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-800 border border-forest-200/70 flex items-center justify-center shadow-2xs">
                <FolderTree size={18} />
              </div>
              <h3 className="font-serif font-bold text-ink-900 text-sm sm:text-base">{c.name}</h3>
              <p className="text-xs text-ink-500 line-clamp-3 leading-relaxed">{c.description || "No description provided."}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-floria-border/70 flex justify-between items-center text-[10px] text-ink-400 font-mono">
              <span className="truncate max-w-[130px]">slug: {c.slug}</span>
              <span className="font-bold uppercase tracking-wider text-forest-800 bg-forest-50 border border-forest-200/80 px-2 py-0.5 rounded-full">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
