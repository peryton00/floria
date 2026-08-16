"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { GridIcon, SearchIcon, AlertIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";

type FilterTab = "all" | "active" | "draft" | "low_stock" | "out_of_stock";

export default function SellerProductsPage() {
  const { toast } = useToast();
  const { isApproved } = useSeller();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState<number>(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerProducts();
      if (res.success && res.data) {
        setProducts(res.data);
      } else {
        setError(res.error?.message || "Failed to load nursery product listings");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const activeListings = products.filter((l) => l.status !== "deleted");

  // Counters
  const countAll = activeListings.length;
  const countActive = activeListings.filter((l) => l.status === "active").length;
  const countDraft = activeListings.filter((l) => l.status === "draft").length;
  const countLowStock = activeListings.filter((l) => {
    const qty = l.inventory?.[0]?.stock_quantity ?? l.inventory?.stock_quantity ?? 0;
    const thresh = l.inventory?.[0]?.low_stock_threshold ?? l.inventory?.low_stock_threshold ?? 5;
    return qty > 0 && qty <= thresh;
  }).length;
  const countOutOfStock = activeListings.filter((l) => {
    const qty = l.inventory?.[0]?.stock_quantity ?? l.inventory?.stock_quantity ?? 0;
    return qty === 0;
  }).length;

  const filteredListings = activeListings.filter((l) => {
    const qty = l.inventory?.[0]?.stock_quantity ?? l.inventory?.stock_quantity ?? 0;
    const thresh = l.inventory?.[0]?.low_stock_threshold ?? l.inventory?.low_stock_threshold ?? 5;

    if (activeTab === "active" && l.status !== "active") return false;
    if (activeTab === "draft" && l.status !== "draft") return false;
    if (activeTab === "low_stock" && !(qty > 0 && qty <= thresh)) return false;
    if (activeTab === "out_of_stock" && qty !== 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const pName = l.name?.toLowerCase() || "";
      const cName = l.category?.name?.toLowerCase() || "";
      return pName.includes(q) || cName.includes(q);
    }
    return true;
  });

  const handleToggleStatus = async (productId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "draft" : "active";
    try {
      setActionLoading(true);
      const res = await api.updateSellerProductStatus(productId, nextStatus);
      if (res.success) {
        toast.success("Status updated", `Product listing set to ${nextStatus}.`);
        await fetchProducts();
      } else {
        toast.error("Status update failed", res.error?.message || `Failed to change status to ${nextStatus}`);
      }
    } catch (err: any) {
      toast.error("Status update failed", err.message || "Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveStock = async (productId: string) => {
    try {
      setActionLoading(true);
      const res = await api.updateSellerInventory(productId, { stock_quantity: Math.max(0, stockInput) });
      if (res.success) {
        toast.success("Stock updated", "Stock quantity saved successfully.");
        setEditingStockId(null);
        await fetchProducts();
      } else {
        toast.error("Stock update failed", res.error?.message || "Failed to update stock");
      }
    } catch (err: any) {
      toast.error("Stock update failed", err.message || "Error updating stock");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      setActionLoading(true);
      const res = await api.deleteSellerProduct(productId);
      if (res.success) {
        toast.success("Product archived", "Product listing archived successfully.");
        setDeleteConfirmId(null);
        await fetchProducts();
      } else {
        toast.error("Archive failed", res.error?.message || "Failed to archive product");
      }
    } catch (err: any) {
      toast.error("Archive failed", err.message || "Error deleting product");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All Products", count: countAll },
    { key: "active", label: "Active", count: countActive },
    { key: "draft", label: "Drafts", count: countDraft },
    { key: "low_stock", label: "Low Stock", count: countLowStock },
    { key: "out_of_stock", label: "Out of Stock", count: countOutOfStock },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Product Catalog</h1>
          <p className="text-xs text-ink-400 mt-0.5">Manage nursery plant listings, pricing, and stock levels.</p>
        </div>

        {isApproved && (
          <Link
            href="/seller/products/new"
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
          >
            + Add New Product
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={fetchProducts} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-ink-100 space-x-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={[
              "pb-3 px-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5",
              activeTab === t.key
                ? "border-forest-700 text-forest-700"
                : "border-transparent text-ink-400 hover:text-ink-900",
            ].join(" ")}
          >
            <span>{t.label}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cream-100 text-ink-600 font-mono">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs flex items-center">
        <div className="w-full relative">
          <input
            type="search"
            placeholder="Search products by name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-400">
            No products found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredListings.map((l) => {
                  const inv = Array.isArray(l.inventory) ? l.inventory[0] : l.inventory;
                  const qty = inv?.stock_quantity ?? 0;
                  const thresh = inv?.low_stock_threshold ?? 5;
                  const pricePaise = inv?.base_price_paise ?? inv?.price_paise ?? 0;
                  const sellerNetPaise = inv?.seller_net_paise ?? pricePaise;
                  const imgUrl = l.images?.[0]?.url || l.primary_image?.url || "/floria-logo.png";
                  const isEditingStock = editingStockId === l.id;

                  return (
                    <tr key={l.id} className="hover:bg-cream-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cream-100 overflow-hidden relative flex-shrink-0">
                            <Image src={imgUrl} alt={l.name} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-ink-900 leading-tight">{l.name}</p>
                            <p className="text-[10px] text-ink-400 font-mono mt-0.5">{l.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-ink-600 font-semibold">{l.category?.name || "Uncategorized"}</td>

                      <td className="p-4 font-mono">
                        <p className="font-bold text-forest-800">
                          {formatINR(sellerNetPaise)}
                        </p>
                        <p className="text-[10px] text-ink-400">
                          (Base: {formatINR(pricePaise)})
                        </p>
                      </td>

                      <td className="p-4">
                        {isEditingStock ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={stockInput}
                              onChange={(e) => setStockInput(Number(e.target.value))}
                              className="w-16 px-2 py-1 border border-ink-300 rounded text-xs"
                            />
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleSaveStock(l.id)}
                              className="px-2 py-1 bg-forest-700 text-white font-bold rounded text-[10px]"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStockId(null)}
                              className="px-2 py-1 border border-ink-200 text-ink-600 rounded text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${qty === 0 ? "text-error-600" : qty <= thresh ? "text-warning-700" : "text-ink-700"}`}>
                              {qty === 0 ? "Out of Stock" : `${qty} units`}
                            </span>
                            <button
                              type="button"
                              disabled={!isApproved}
                              onClick={() => { setEditingStockId(l.id); setStockInput(qty); }}
                              className="text-[10px] text-forest-700 underline font-bold hover:text-forest-900 disabled:opacity-40"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${l.status === "active" ? "bg-success-50 text-success-700 border border-success-100" : "bg-ink-100 text-ink-600"}`}>
                          {l.status}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          type="button"
                          disabled={!isApproved || actionLoading}
                          onClick={() => handleToggleStatus(l.id, l.status)}
                          className="px-2.5 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider disabled:opacity-40"
                        >
                          {l.status === "active" ? "Set Draft" : "Publish"}
                        </button>

                        <Link
                          href={`/seller/products/${l.id}`}
                          className="px-2.5 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider inline-block"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          disabled={!isApproved || actionLoading}
                          onClick={() => setDeleteConfirmId(l.id)}
                          className="px-2.5 py-1 rounded-lg border border-error-200 hover:bg-error-50 text-error-700 font-bold text-[10px] uppercase tracking-wider disabled:opacity-40"
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink-900">Archive Product Listing</h3>
            <p className="text-xs text-ink-500">
              Are you sure you want to archive this product? It will be unpublished from the customer catalog.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-error-600 hover:bg-error-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Archive Product
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider hover:bg-cream-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
