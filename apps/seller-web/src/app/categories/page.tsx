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
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Marketplace Plant Taxonomies</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Reference of botanical taxonomies, species divisions, and categories established by platform administrators.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            {categories.length} Verified Categories
          </span>
        </div>
      </div>

      {/* Info notice about categories */}
      <div className="bg-white rounded border border-[#E2E8F0] p-5 flex gap-3.5 text-xs shadow-xs items-start">
        <div className="w-8 h-8 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
          <Info size={16} />
        </div>
        <div className="space-y-1">
          <h2 className="font-sans font-bold text-sm text-[#0F172A]">Category Classification Policy</h2>
          <p className="text-slate-500 leading-relaxed text-xs">
            All botanical varieties and nursery products listed on the Floria marketplace must be mapped to one of the verified global classifications below. If you require a specialized taxonomy for rare or endemic plant species, please contact the Floria horticultural support desk.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-semibold text-red-700">
          <span>{error}</span>
        </div>
      )}

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 transition-all">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded bg-forest-50 text-forest-700 border border-forest-100 flex items-center justify-center shadow-xs">
                <FolderTree size={16} />
              </div>
              <h3 className="font-sans font-bold text-[#0F172A] text-sm">{c.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{c.description || "No description provided."}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span className="truncate max-w-[130px]">slug: {c.slug}</span>
              <span className="font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

