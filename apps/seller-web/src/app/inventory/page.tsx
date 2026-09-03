"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useSeller } from "@/lib/contexts/SellerContext";
import { useToast } from "@/lib/contexts/ToastContext";
import { FloriaIcon } from "@floria/icons";

export default function SellerInventoryPage() {
  const { toast } = useToast();
  const { isApproved } = useSeller();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  // Inline editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<number>(0);
  const [stockInput, setStockInput] = useState<number>(0);
  const [thresholdInput, setThresholdInput] = useState<number>(0);
  const [skuInput, setSkuInput] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerInventory();
      if (res.success && res.data) {
        setInventory(res.data);
      } else {
        setError(res.error?.message || "Failed to load inventory data");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleEdit = (item: any) => {
    setEditingId(item.product_id);
    setPriceInput(item.price_paise / 100);
    setStockInput(item.stock_quantity);
    setThresholdInput(item.low_stock_threshold);
    setSkuInput(item.sku || "");
  };

  const handleSave = async (productId: string) => {
    if (stockInput < 0 || thresholdInput < 0 || priceInput < 0) {
      toast.error("Invalid values", "Values cannot be negative.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.updateSellerInventory(productId, {
        price_paise: Math.round(priceInput * 100),
        stock_quantity: Math.max(0, stockInput),
        low_stock_threshold: Math.max(0, thresholdInput),
        sku: skuInput.trim() || null,
      });

      if (res.success) {
        toast.success("Inventory updated", "Product inventory and pricing saved.");
        setEditingId(null);
        await fetchInventory();
      } else {
        toast.error("Update failed", res.error?.message || "Failed to update inventory details");
      }
    } catch (err: any) {
      toast.error("Update failed", err.message || "Error saving inventory");
    } finally {
      setActionLoading(false);
    }
  };

  const validInventory = inventory.filter(
    (item: any) => item.product && item.product.status !== "deleted",
  );

  const filteredItems = validInventory.filter((item: any) => {
    const qty = item.stock_quantity;
    const thresh = item.low_stock_threshold || 5;
    
    // Tab filtering
    if (filterTab === "in_stock" && qty <= 0) return false;
    if (filterTab === "low_stock" && (qty <= 0 || qty > thresh)) return false;
    if (filterTab === "out_of_stock" && qty > 0) return false;

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const pName = item.product?.name?.toLowerCase() || "";
      const skuCode = item.sku?.toLowerCase() || "";
      return pName.includes(q) || skuCode.includes(q);
    }
    return true;
  });

  const countAll = validInventory.length;
  const countInStock = validInventory.filter((i) => i.stock_quantity > 0).length;
  const countLowStock = validInventory.filter((i) => i.stock_quantity > 0 && i.stock_quantity <= (i.low_stock_threshold || 5)).length;
  const countOutOfStock = validInventory.filter((i) => i.stock_quantity <= 0).length;

  return (
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Nursery Inventory Control Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Adjust price points, update live plant stocks, and define low stock threshold limits.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            {inventory.length} Stock Units
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-semibold text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={fetchInventory} className="font-bold underline text-red-900">Retry</button>
        </div>
      )}

      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Catalog Items", count: countAll, tab: "all" as const },
          { label: "Healthy Stock", count: countInStock, tab: "in_stock" as const, color: "text-emerald-700" },
          { label: "Low Stock Alert", count: countLowStock, tab: "low_stock" as const, color: "text-amber-700" },
          { label: "Out of Stock", count: countOutOfStock, tab: "out_of_stock" as const, color: "text-red-700" }
        ].map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setFilterTab(c.tab)}
            className={`bg-white rounded border p-4 shadow-xs hover:border-slate-400 transition-all text-left flex flex-col justify-between ${filterTab === c.tab ? "border-[#1B4D3E] ring-1 ring-[#1B4D3E]" : "border-[#E2E8F0]"}`}
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">{c.label}</p>
            <p className={`font-mono text-xl font-bold mt-1.5 tracking-tight ${c.color || "text-[#0F172A]"}`}>{c.count}</p>
          </button>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-96 relative">
          <input
            type="search"
            placeholder="Search inventory by plant name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 font-mono text-xs rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] bg-[#F8FAFC] placeholder:text-slate-400 font-sans"
          />
          <FloriaIcon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded border border-[#E2E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#1B4D3E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">
            No inventory records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-slate-600 font-mono text-[10px] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="p-3.5">Plant Variety</th>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Selling Price</th>
                  <th className="p-3.5">Stock Quantity</th>
                  <th className="p-3.5">Low Stock Limit</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {filteredItems.map((item) => {
                  const qty = item.stock_quantity;
                  const thresh = item.low_stock_threshold || 5;
                  const isEditing = editingId === item.product_id;

                  // Status badge helper
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <FloriaIcon name="check_circle" size={11} /> In Stock
                    </span>
                  );
                  if (qty <= 0) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                        <FloriaIcon name="close_circle" size={11} /> Out of Stock
                      </span>
                    );
                  } else if (qty <= thresh) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        <FloriaIcon name="warning" size={11} /> Low Stock
                      </span>
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div>
                          <p className="font-bold text-[#0F172A] text-xs sm:text-sm leading-tight">{item.product?.name || "Plant Product"}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: #{item.product_id?.slice(0, 8)}</p>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-700">
                        {isEditing ? (
                          <input
                            type="text"
                            value={skuInput}
                            onChange={(e) => setSkuInput(e.target.value)}
                            className="w-24 px-2 py-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded text-xs focus:ring-1 focus:ring-[#1B4D3E] outline-none font-mono"
                            placeholder="SKU"
                          />
                        ) : (
                          item.sku || <span className="text-slate-400 italic font-sans text-[11px]">Not set</span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-[#1B4D3E] text-xs">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-sans">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={priceInput}
                              onChange={(e) => setPriceInput(Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded text-xs focus:ring-1 focus:ring-[#1B4D3E] outline-none font-sans font-semibold"
                            />
                          </div>
                        ) : (
                          formatINR(item.price_paise)
                        )}
                      </td>

                      <td className="p-3.5 font-mono font-semibold text-slate-800">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={stockInput}
                            onChange={(e) => setStockInput(Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded text-xs focus:ring-1 focus:ring-[#1B4D3E] outline-none font-semibold"
                          />
                        ) : (
                          `${qty} units`
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-slate-500">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={thresholdInput}
                            onChange={(e) => setThresholdInput(Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded text-xs focus:ring-1 focus:ring-[#1B4D3E] outline-none"
                          />
                        ) : (
                          `${thresh} units`
                        )}
                      </td>

                      <td className="p-3.5">{statusBadge}</td>

                      <td className="p-3.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleSave(item.product_id)}
                              style={{ color: "#ffffff" }}
                              className="p-1.5 bg-[#1B4D3E] hover:bg-[#153e31] !text-white rounded shadow-xs transition-colors"
                              title="Save changes"
                            >
                              <FloriaIcon name="save" size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1.5 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 rounded transition-colors"
                              title="Cancel"
                            >
                              <FloriaIcon name="close" size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={!isApproved}
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-slate-700 font-bold text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40"
                          >
                            <FloriaIcon name="edit" size={11} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
