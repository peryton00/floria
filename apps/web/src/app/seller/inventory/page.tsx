"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useSeller } from "@/lib/contexts/SellerContext";
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
      alert("Values cannot be negative");
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
        setEditingId(null);
        await fetchInventory();
      } else {
        alert(res.error?.message || "Failed to update inventory details");
      }
    } catch (err: any) {
      alert(err.message || "Error saving inventory");
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Inventory Control Center</h1>
        <p className="text-xs text-ink-400 mt-0.5">Adjust price points, update plant stocks, and define low stock notification thresholds.</p>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={fetchInventory} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Items", count: countAll, tab: "all" as const },
          { label: "Healthy Stock", count: countInStock, tab: "in_stock" as const, color: "text-forest-700 bg-forest-50" },
          { label: "Low Stock Alert", count: countLowStock, tab: "low_stock" as const, color: "text-warning-700 bg-warning-50" },
          { label: "Out of Stock", count: countOutOfStock, tab: "out_of_stock" as const, color: "text-error-700 bg-error-50" }
        ].map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setFilterTab(c.tab)}
            className={`p-4 rounded-xl border text-left transition-all ${filterTab === c.tab ? "border-forest-700 shadow-xs" : "border-ink-100 bg-white hover:border-ink-200"}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color || "text-ink-900"}`}>{c.count}</p>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs flex items-center">
        <div className="w-full relative">
          <input
            type="search"
            placeholder="Search inventory by plant name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-400">
            No inventory records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-cream-100 text-ink-500 font-bold uppercase tracking-wider border-b border-ink-100">
                  <th className="p-4">Plant Listing</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Stock Quantity</th>
                  <th className="p-4">Low Stock Limit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredItems.map((item) => {
                  const qty = item.stock_quantity;
                  const thresh = item.low_stock_threshold || 5;
                  const isEditing = editingId === item.product_id;

                  // Status badge helper
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-success-50 text-success-700 border border-success-100">
                      <CheckCircle size={10} /> In Stock
                    </span>
                  );
                  if (qty <= 0) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-error-50 text-error-700 border border-error-100">
                        <XCircle size={10} /> Out of Stock
                      </span>
                    );
                  } else if (qty <= thresh) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-warning-50 text-warning-700 border border-warning-100">
                        <AlertTriangle size={10} /> Low Stock
                      </span>
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-cream-50/50">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-ink-900 leading-tight">{item.product?.name || "Plant Product"}</p>
                          <p className="text-[10px] text-ink-400 mt-0.5 font-mono">Product ID: {item.product_id}</p>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-ink-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={skuInput}
                            onChange={(e) => setSkuInput(e.target.value)}
                            className="w-24 px-2 py-1 border border-ink-300 rounded text-xs focus:ring-1 focus:ring-forest-700 outline-none"
                            placeholder="SKU"
                          />
                        ) : (
                          item.sku || <span className="text-ink-300">Not set</span>
                        )}
                      </td>

                      <td className="p-4 font-bold text-forest-800">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-ink-400">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={priceInput}
                              onChange={(e) => setPriceInput(Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-ink-300 rounded text-xs focus:ring-1 focus:ring-forest-700 outline-none"
                            />
                          </div>
                        ) : (
                          formatINR(item.price_paise)
                        )}
                      </td>

                      <td className="p-4 font-semibold">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={stockInput}
                            onChange={(e) => setStockInput(Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-ink-300 rounded text-xs focus:ring-1 focus:ring-forest-700 outline-none"
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
                            className="w-16 px-2 py-1 border border-ink-300 rounded text-xs focus:ring-1 focus:ring-forest-700 outline-none"
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
                              className="p-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-lg transition-colors"
                              title="Save changes"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1.5 border border-ink-200 hover:bg-cream-50 text-ink-600 rounded-lg transition-colors"
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40"
                          >
                            <Edit2 size={10} /> Edit
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
