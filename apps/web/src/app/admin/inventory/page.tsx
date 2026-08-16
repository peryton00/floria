"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SearchIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";
import { TableSkeleton } from "@/components/ui/loading";

export default function AdminInventoryPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  // Edit stock state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [editPriceINR, setEditPriceINR] = useState("0");
  const [editStock, setEditStock] = useState("0");
  const [editSku, setEditSku] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdjust = (p: any) => {
    setSelectedProduct(p);
    const pricePaise = p.inventory?.[0]?.price_paise ?? p.inventory?.price_paise ?? 0;
    const stockQty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
    const sku = p.inventory?.[0]?.sku ?? p.inventory?.sku ?? "";
    setEditPriceINR((pricePaise / 100).toFixed(2));
    setEditStock(String(stockQty));
    setEditSku(sku);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Math.round(parseFloat(editPriceINR) * 100);
    const parsedStock = parseInt(editStock);
    if (isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedStock) || parsedStock < 0) {
      toast.error("Invalid values", "Please enter valid price and stock quantity values.");
      return;
    }

    try {
      setUpdating(true);
      const res = await api.updateAdminProduct(selectedProduct.id, {
        price_paise: parsedPrice,
        stock_quantity: parsedStock,
        sku: editSku,
      });

      if (res.success) {
        toast.success("Stock updated", "Stock values adjusted successfully.");
        await loadData();
        setSelectedProduct(null);
      } else {
        toast.error("Adjustment failed", res.error?.message || "Failed to adjust stock");
      }
    } catch (err: any) {
      toast.error("Adjustment failed", err.message || "Error adjusting stock");
    } finally {
      setUpdating(false);
    }
  };

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

        {/* Inventory Cards Grid Layout */}
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : filteredInventory.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-400">No products matching the selected filters.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-ink-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-bold text-ink-900 leading-tight truncate">{p.name}</p>
                      <p className="text-[9px] text-ink-400 font-mono mt-0.5 truncate">SKU: {sku}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-ink-500 font-medium truncate">Category: {catName}</p>
                    <p className="text-ink-500 font-medium truncate">Nursery: {sellerName}</p>
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold text-forest-800 text-[13px]">{formatINR(pricePaise)}</span>
                      <span className="font-mono font-bold text-ink-700">{stockQty} units</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-ink-50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(p)}
                      className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[9px] uppercase tracking-wider transition-colors"
                    >
                      Adjust Stock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Adjust Stock */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-ink-100 pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">Adjust Stock Settings</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{selectedProduct.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveStock} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Retail Price (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPriceINR}
                    onChange={(e) => setEditPriceINR(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Available Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    SKU Code Reference
                  </label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-ink-50">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Adjust Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider hover:bg-cream-50"
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
