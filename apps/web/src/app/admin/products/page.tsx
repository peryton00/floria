"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SearchIcon } from "@/components/ui/Icons";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getAdminProducts({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        }),
        api.getAdminCategories(),
      ]);

      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data);
      } else {
        setError(prodRes.error?.message || "Failed to load products");
      }

      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleModerateStatus = async (action: "publish" | "unpublish" | "archive") => {
    if (!selectedProduct) return;
    try {
      setActionLoading(true);
      let res;
      if (action === "publish") res = await api.publishProduct(selectedProduct.id);
      else if (action === "unpublish") res = await api.unpublishProduct(selectedProduct.id);
      else if (action === "archive") res = await api.archiveProduct(selectedProduct.id);

      if (res?.success) {
        await fetchProducts();
        setSelectedProduct(null);
      } else {
        alert(res?.error?.message || `Failed to ${action} product`);
      }
    } catch (e: any) {
      alert(e.message || "Error moderating product");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Product Moderation</h1>
            <p className="text-xs text-ink-400 mt-0.5">Audit catalog listings, publish approved items, or unpublish non-compliant products.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Total Listings:</span>
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 font-bold text-xs border border-forest-100">
              {products.length} Products
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl border border-ink-100 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-72 relative">
            <input
              type="search"
              placeholder="Search product name, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Published)</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive / Unpublished</option>
              <option value="deleted">Archived</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Product Table */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-400">No products matching the selected criteria.</div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Nursery / Seller</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {products.map((p) => {
                  const pricePaise = p.inventory?.[0]?.price_paise ?? p.inventory?.price_paise ?? 0;
                  const stockQty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
                  const sellerName = p.seller?.business_name || "Partner Nursery";
                  const catName = p.category?.name || "Uncategorized";

                  return (
                    <tr key={p.id} className="hover:bg-cream-50/50">
                      <td className="p-4">
                        <p className="font-bold text-ink-900 leading-tight">{p.name}</p>
                        <p className="text-[10px] text-ink-400 font-mono mt-0.5">{p.id}</p>
                      </td>
                      <td className="p-4 font-semibold text-ink-700">{sellerName}</td>
                      <td className="p-4 text-ink-600">{catName}</td>
                      <td className="p-4 font-bold text-forest-800">{formatINR(pricePaise)}</td>
                      <td className="p-4">
                        <span className={`font-bold ${stockQty <= 0 ? "text-error-600" : "text-ink-700"}`}>
                          {stockQty <= 0 ? "Out of Stock" : `${stockQty} units`}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${p.status === "active" ? "bg-success-50 text-success-700 border border-success-100" : "bg-ink-100 text-ink-600"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(p)}
                          className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-colors"
                        >
                          Moderate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Moderation Drawer */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">{selectedProduct.name}</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">Product ID: {selectedProduct.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="bg-cream-50 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Seller:</span>
                  <span className="font-bold text-ink-900">{selectedProduct.seller?.business_name || "Nursery Partner"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Category:</span>
                  <span className="text-ink-900">{selectedProduct.category?.name || "Uncategorized"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500 font-semibold">Publication Status:</span>
                  <span className="font-bold uppercase text-ink-900">{selectedProduct.status}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {selectedProduct.status !== "active" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleModerateStatus("publish")}
                    className="w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Publish Product to Catalog
                  </button>
                )}

                {selectedProduct.status === "active" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleModerateStatus("unpublish")}
                    className="w-full py-2.5 rounded-xl bg-warning-600 hover:bg-warning-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Unpublish / Hide Product
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleModerateStatus("archive")}
                  className="w-full py-2.5 rounded-xl border border-error-200 text-error-700 hover:bg-error-50 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Archive Product Listing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
