"use client";

import { useState } from "react";
import Link from "next/link";
import { useSellerProducts } from "@/lib/contexts/SellerProductContext";
import { StockStatusBadge } from "@/components/seller/StockStatusBadge";
import { formatINR } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  SearchIcon,
  PlusIcon,
  RefreshIcon,
  AlertIcon,
} from "@/components/ui/Icons";

export default function SellerInventoryPage() {
  const { products, loading, error, refreshProducts, updateStock } =
    useSellerProducts();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "out">(
    "all",
  );
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.inventory.sku || "").toLowerCase().includes(searchTerm.toLowerCase());

    const isOut = p.inventory.stock_quantity === 0;
    const isLow =
      p.inventory.stock_quantity > 0 &&
      p.inventory.stock_quantity <= (p.inventory.low_stock_threshold || 5);

    if (filterStatus === "out") return matchesSearch && isOut;
    if (filterStatus === "low") return matchesSearch && isLow;
    return matchesSearch;
  });

  const handleStockChange = (productId: string, val: number) => {
    setStockInputs((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const handleSaveStock = async (productId: string, productName: string) => {
    const newQty = stockInputs[productId];
    if (newQty === undefined) return;

    try {
      setSavingId(productId);
      const success = await updateStock(productId, newQty);
      if (success) {
        toast.success(
          "Stock Updated",
          `Available stock for '${productName}' set to ${newQty}.`,
        );
        setAdjustingId(null);
      } else {
        toast.error("Update Failed", "Could not update inventory level.");
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Real-time nursery plant stock counts, low-stock warnings, and fast
            replenishment
          </p>
        </div>

        <button
          type="button"
          onClick={refreshProducts}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Stock
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === "all"
                ? "bg-forest-800 text-white"
                : "bg-cream-200 text-ink-700 hover:bg-cream-300"
            }`}
          >
            All Stock ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("low")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === "low"
                ? "bg-warning-500 text-ink-900"
                : "bg-cream-200 text-ink-700 hover:bg-cream-300"
            }`}
          >
            Low Stock
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("out")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === "out"
                ? "bg-error-600 text-white"
                : "bg-cream-200 text-ink-700 hover:bg-cream-300"
            }`}
          >
            Out of Stock
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon
            size={16}
            className="absolute left-3 top-2.5 text-ink-400"
          />
          <input
            type="text"
            placeholder="Search plant or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Plant Listing</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4 text-center">Available Units</th>
                  <th className="py-3.5 px-4 text-right">Quick Replenish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {filtered.map((p) => {
                  const isEditing = adjustingId === p.product.id;
                  const currentQty =
                    stockInputs[p.product.id] !== undefined
                      ? stockInputs[p.product.id]
                      : p.inventory.stock_quantity;

                  return (
                    <tr
                      key={p.product.id}
                      className="hover:bg-cream-100/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-ink-900">
                        {p.product.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-ink-500">
                        {p.inventory.sku || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-ink-900 font-bold">
                        {formatINR(p.inventory.price_paise)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StockStatusBadge
                          quantity={p.inventory.stock_quantity}
                          lowStockThreshold={
                            p.inventory.low_stock_threshold || 5
                          }
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={currentQty}
                            onChange={(e) =>
                              handleStockChange(
                                p.product.id,
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className="w-20 px-2 py-1 bg-cream-100 border border-forest-800 rounded-lg text-center font-bold text-xs"
                          />
                        ) : (
                          <span className="font-bold text-sm text-ink-900">
                            {p.inventory.stock_quantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setAdjustingId(null)}
                              className="px-2 py-1 bg-cream-200 hover:bg-cream-300 text-ink-700 rounded-lg text-[10px] font-bold uppercase"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={savingId === p.product.id}
                              onClick={() =>
                                handleSaveStock(p.product.id, p.product.name)
                              }
                              className="px-3 py-1 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                            >
                              {savingId === p.product.id ? "Saving..." : "Save"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingId(p.product.id);
                                handleStockChange(
                                  p.product.id,
                                  p.inventory.stock_quantity + 5,
                                );
                              }}
                              className="px-2.5 py-1 bg-cream-200 hover:bg-forest-800 hover:text-white rounded-lg text-[11px] font-bold text-ink-700 transition-colors"
                            >
                              +5 Stock
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdjustingId(p.product.id);
                                handleStockChange(
                                  p.product.id,
                                  p.inventory.stock_quantity,
                                );
                              }}
                              className="px-2.5 py-1 bg-cream-200 hover:bg-cream-300 rounded-lg text-[11px] font-bold text-ink-700"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 text-xs text-ink-500">
            No inventory records found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
