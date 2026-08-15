"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SearchIcon } from "@/components/ui/Icons";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes, sellerRes] = await Promise.all([
          api.getAdminProducts(),
          api.getAdminCategories(),
          api.getAdminSellers(),
        ]);

        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data);
        } else {
          setError(prodRes.error?.message || "Failed to load products inventory");
        }

        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }

        if (sellerRes.success && sellerRes.data) {
          setSellers(sellerRes.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to connect to backend API");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredInventory = products.filter((p) => {
    const stockQty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
    
    const matchesSearch =
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.id || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    const matchesSeller = sellerFilter === "all" || p.seller_id === sellerFilter;

    let matchesStockStatus = true;
    if (stockStatusFilter === "out") {
      matchesStockStatus = stockQty <= 0;
    } else if (stockStatusFilter === "low") {
      matchesStockStatus = stockQty > 0 && stockQty <= 10;
    } else if (stockStatusFilter === "ok") {
      matchesStockStatus = stockQty > 10;
    }

    return matchesSearch && matchesCategory && matchesSeller && matchesStockStatus;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Platform Inventory Control</h1>
          <p className="text-xs text-ink-400 mt-0.5">Monitor stock levels, SKUs, and retail pricing configurations across all nurseries.</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="w-full lg:w-72 relative">
            <input
              type="search"
              placeholder="Search product, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            >
              <option value="all">All Nurseries</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.business_name || "Nursery"}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            >
              <option value="all">All Stock Levels</option>
              <option value="ok">In Stock (&gt; 10)</option>
              <option value="low">Low Stock (&le; 10)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No products matching the selected filters.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Product</th>
                  <th className="p-4">Nursery Seller</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">SKU / ID</th>
                  <th className="p-4">Unit Price</th>
                  <th className="p-4">Available Stock</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredInventory.map((p) => {
                  const sku = p.inventory?.[0]?.sku || p.id.slice(0, 8).toUpperCase();
                  const pricePaise = p.inventory?.[0]?.price_paise ?? p.inventory?.price_paise ?? 0;
                  const stockQty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
                  const sellerName = p.seller?.business_name || "Partner Nursery";
                  const catName = p.category?.name || "Uncategorized";

                  let statusLabel = "In Stock";
                  let statusClass = "bg-success-50 text-success-700 border-success-100";
                  if (stockQty <= 0) {
                    statusLabel = "Out of Stock";
                    statusClass = "bg-error-50 text-error-700 border-error-100";
                  } else if (stockQty <= 10) {
                    statusLabel = "Low Stock";
                    statusClass = "bg-warning-50 text-warning-700 border-warning-100";
                  }

                  return (
                    <tr key={p.id} className="hover:bg-cream-50/50">
                      <td className="p-4 font-bold text-ink-900">{p.name}</td>
                      <td className="p-4 font-semibold text-ink-700">{sellerName}</td>
                      <td className="p-4 text-ink-600">{catName}</td>
                      <td className="p-4 font-mono text-[10px] text-ink-400">{sku}</td>
                      <td className="p-4 font-bold text-forest-800">{formatINR(pricePaise)}</td>
                      <td className="p-4 font-mono font-bold text-ink-800">{stockQty} units</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
