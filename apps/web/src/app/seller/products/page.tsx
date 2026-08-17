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
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Nursery Product Catalog</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage botanical plant listings, retail pricing, and live inventory stock.</p>
        </div>

        {isApproved && (
          <Link
            href="/seller/products/new"
            style={{ color: "#ffffff" }}
            className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider rounded shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>+ Add New Product</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-semibold text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={fetchProducts} className="font-bold underline text-red-900">Retry</button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-96 relative">
          <input
            type="search"
            placeholder="Search products by plant name, category, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 font-mono text-xs rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] bg-[#F8FAFC] placeholder:text-slate-400 font-sans"
          />
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] p-1 shadow-xs overflow-x-auto max-w-full">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={[
                  "px-3 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5",
                  isActive
                    ? "bg-[#1B4D3E] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-200/60",
                ].join(" ")}
              >
                <span>{t.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#1B4D3E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">
            No products found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-slate-600 font-mono text-[10px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="p-3.5">Product Variety</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Seller Net / Base</th>
                  <th className="p-3.5">Available Stock</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {filteredListings.map((l) => {
                  const inv = Array.isArray(l.inventory) ? l.inventory[0] : l.inventory;
                  const qty = inv?.stock_quantity ?? 0;
                  const thresh = inv?.low_stock_threshold ?? 5;
                  const pricePaise = inv?.base_price_paise ?? inv?.price_paise ?? 0;
                  const sellerNetPaise = inv?.seller_net_paise ?? pricePaise;
                  const imgUrl = l.images?.[0]?.url || l.primary_image?.url || "/floria-logo.png";
                  const isEditingStock = editingStockId === l.id;

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-[#F8FAFC] overflow-hidden relative flex-shrink-0 border border-[#E2E8F0]">
                            <Image src={imgUrl} alt={l.name} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-[#0F172A] text-xs sm:text-sm leading-tight">{l.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #{l.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-700 font-semibold">{l.category?.name || "Uncategorized"}</td>

                      <td className="p-3.5 font-mono">
                        <p className="font-bold text-[#1B4D3E] text-xs">
                          {formatINR(sellerNetPaise)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          (Base: {formatINR(pricePaise)})
                        </p>
                      </td>

                      <td className="p-3.5">
                        {isEditingStock ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={stockInput}
                              onChange={(e) => setStockInput(Number(e.target.value))}
                              className="w-16 px-2 py-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                            />
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleSaveStock(l.id)}
                              style={{ color: "#ffffff" }}
                              className="px-2.5 py-1 bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold rounded text-[10px] uppercase shadow-xs"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStockId(null)}
                              className="px-2 py-1 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-600 rounded text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-xs ${qty === 0 ? "text-red-700" : qty <= thresh ? "text-amber-700" : "text-slate-800"}`}>
                              {qty === 0 ? "Out of Stock" : `${qty} units`}
                            </span>
                            <button
                              type="button"
                              disabled={!isApproved}
                              onClick={() => { setEditingStockId(l.id); setStockInput(qty); }}
                              className="text-[10px] font-mono text-[#1B4D3E] underline font-bold hover:text-[#153e31] disabled:opacity-40"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${l.status === "active" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {l.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={!isApproved || actionLoading}
                          onClick={() => handleToggleStatus(l.id, l.status)}
                          className="px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 font-bold text-[10px] uppercase tracking-wider disabled:opacity-40 transition-colors"
                        >
                          {l.status === "active" ? "Set Draft" : "Publish"}
                        </button>

                        <Link
                          href={`/seller/products/${l.id}`}
                          className="px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 font-bold text-[10px] uppercase tracking-wider inline-block transition-colors"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          disabled={!isApproved || actionLoading}
                          onClick={() => setDeleteConfirmId(l.id)}
                          className="px-2.5 py-1 rounded border border-red-200 hover:bg-red-50 text-red-700 font-bold text-[10px] uppercase tracking-wider disabled:opacity-40 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#E2E8F0] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-sans text-sm font-bold text-[#0F172A]">Archive Product Listing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to archive this product? It will be unpublished from the customer marketplace catalog.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDelete(deleteConfirmId)}
                style={{ color: "#ffffff" }}
                className="flex-1 py-2 rounded bg-red-700 hover:bg-red-800 !text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Archive Product
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded border border-[#E2E8F0] text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-[#F8FAFC]"
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

