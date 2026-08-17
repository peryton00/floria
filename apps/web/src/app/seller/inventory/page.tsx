"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useSeller } from "@/lib/contexts/SellerContext";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X
} from "lucide-react";

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

  const filteredItems = inventory.filter((item: any) => {
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

  const countAll = inventory.length;
  const countInStock = inventory.filter((i) => i.stock_quantity > 0).length;
  const countLowStock = inventory.filter((i) => i.stock_quantity > 0 && i.stock_quantity <= (i.low_stock_threshold || 5)).length;
  const countOutOfStock = inventory.filter((i) => i.stock_quantity <= 0).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-ui">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Inventory Control Center</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">Adjust price points, update live plant stocks, and define low stock threshold limits.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex justify-between items-center shadow-2xs">
          <span>{error}</span>
          <button type="button" onClick={fetchInventory} className="font-bold underline text-rose-900">Retry</button>
        </div>
      )}

      {/* Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {[
          { label: "Total Catalog Items", count: countAll, tab: "all" as const },
          { label: "Healthy Stock", count: countInStock, tab: "in_stock" as const, color: "text-forest-800 bg-forest-50" },
          { label: "Low Stock Alert", count: countLowStock, tab: "low_stock" as const, color: "text-amber-800 bg-amber-50" },
          { label: "Out of Stock", count: countOutOfStock, tab: "out_of_stock" as const, color: "text-rose-800 bg-rose-50" }
        ].map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setFilterTab(c.tab)}
            className={`p-4 sm:p-5 rounded-2xl border text-left transition-all shadow-xs ${filterTab === c.tab ? "border-forest-800 bg-floria-linen ring-1 ring-forest-800/30" : "border-floria-border bg-floria-linen hover:border-forest-700/50 hover:bg-floria-soft-sand"}`}
          >
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-500">{c.label}</p>
            <p className={`text-2xl sm:text-3xl font-serif font-bold mt-1.5 ${c.color || "text-ink-900"}`}>{c.count}</p>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="bg-floria-linen rounded-2xl border border-floria-border p-3.5 sm:p-4 shadow-xs flex items-center">
        <div className="w-full relative">
          <input
            type="search"
            placeholder="Search inventory by plant variety name or SKU code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900 placeholder:text-ink-400 font-medium"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="bg-floria-linen rounded-3xl border border-floria-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs sm:text-sm text-ink-500">
            No inventory records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-floria-soft-sand text-ink-600 font-bold uppercase tracking-wider border-b border-floria-border">
                  <th className="p-4">Plant Variety</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Stock Quantity</th>
                  <th className="p-4">Low Stock Limit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-floria-border bg-floria-linen">
                {filteredItems.map((item) => {
                  const qty = item.stock_quantity;
                  const thresh = item.low_stock_threshold || 5;
                  const isEditing = editingId === item.product_id;

                  // Status badge helper
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-50 text-forest-800 border border-forest-200">
                      <CheckCircle size={11} /> In Stock
                    </span>
                  );
                  if (qty <= 0) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle size={11} /> Out of Stock
                      </span>
                    );
                  } else if (qty <= thresh) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle size={11} /> Low Stock
                      </span>
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-floria-soft-sand/60 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-ink-900 text-xs sm:text-sm leading-tight">{item.product?.name || "Plant Product"}</p>
                          <p className="text-[10px] text-ink-400 mt-0.5 font-mono">ID: #{item.product_id?.slice(0, 8)}</p>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-ink-700">
                        {isEditing ? (
                          <input
                            type="text"
                            value={skuInput}
                            onChange={(e) => setSkuInput(e.target.value)}
                            className="w-24 px-2 py-1 border border-floria-border bg-floria-sand/70 rounded-lg text-xs focus:ring-1 focus:ring-forest-800 outline-none font-mono"
                            placeholder="SKU"
                          />
                        ) : (
                          item.sku || <span className="text-ink-400 italic">Not set</span>
                        )}
                      </td>

                      <td className="p-4 font-serif font-bold text-forest-800 text-xs sm:text-sm">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-ink-500 font-sans">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={priceInput}
                              onChange={(e) => setPriceInput(Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-floria-border bg-floria-sand/70 rounded-lg text-xs focus:ring-1 focus:ring-forest-800 outline-none font-sans font-semibold"
                            />
                          </div>
                        ) : (
                          formatINR(item.price_paise)
                        )}
                      </td>

                      <td className="p-4 font-semibold text-ink-800">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={stockInput}
                            onChange={(e) => setStockInput(Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-floria-border bg-floria-sand/70 rounded-lg text-xs focus:ring-1 focus:ring-forest-800 outline-none font-semibold"
                          />
                        ) : (
                          `${qty} units`
                        )}
                      </td>

                      <td className="p-4 text-ink-500">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={thresholdInput}
                            onChange={(e) => setThresholdInput(Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-floria-border bg-floria-sand/70 rounded-lg text-xs focus:ring-1 focus:ring-forest-800 outline-none"
                          />
                        ) : (
                          `${thresh} units`
                        )}
                      </td>

                      <td className="p-4">{statusBadge}</td>

                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleSave(item.product_id)}
                              style={{ color: "#ffffff" }}
                              className="p-2 bg-forest-800 hover:bg-forest-900 !text-white rounded-xl transition-all shadow-2xs active:scale-95"
                              title="Save changes"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-2 border border-floria-border hover:bg-floria-sand text-ink-700 rounded-xl transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={!isApproved}
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-floria-border hover:bg-floria-sand bg-floria-soft-sand text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 shadow-2xs active:scale-95"
                          >
                            <Edit2 size={11} /> Edit
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
