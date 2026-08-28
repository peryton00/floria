"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useToast } from "@/lib/contexts/ToastContext";
import {
  ProductsIcon,
  SearchIcon,
  RefreshIcon,
  CheckCircleIcon,
  ShieldAlertIcon,
  EyeIcon,
  DeleteIcon,
} from "@/components/ui/Icons";

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminProducts();
      if (res.success && res.data) {
        setProducts(res.data);
      } else {
        setError(res.error?.message || "Failed to load product catalog.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to product service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleUpdateStatus = async (
    productId: string,
    status: "active" | "draft" | "inactive",
  ) => {
    try {
      setActionLoading(true);
      const res = await api.updateAdminProductStatus(productId, status);
      if (res.success) {
        toast.success("Moderation Updated", `Product set to '${status}'.`);
        await fetchProducts();
      } else {
        toast.error(
          "Action Failed",
          res.error?.message || "Could not update status.",
        );
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Could not update product status.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    const name = (p.name || p.product?.name || "").toLowerCase();
    const seller = (p.seller_name || p.nursery_name || "").toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      seller.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Catalog & Plant Moderation
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Audit plant taxonomy, verify pricing compliance, and moderate
            marketplace listings
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProducts}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-xs font-bold text-ink-700 transition-colors shadow-xs"
        >
          <RefreshIcon size={14} /> Refresh Catalog
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-xs text-error-700 font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchProducts}
            className="underline uppercase font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <SearchIcon
            size={16}
            className="absolute left-3 top-2.5 text-ink-400"
          />
          <input
            type="text"
            placeholder="Search plant name or nursery..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>

        <div className="text-xs font-bold text-ink-500">
          Showing {filtered.length} of {products.length} botanical items
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Plant & Category</th>
                  <th className="py-3.5 px-4">Nursery Owner</th>
                  <th className="py-3.5 px-4">Listing Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {filtered.map((p) => {
                  const prodId = p.id || p.product?.id;
                  const prodName =
                    p.name || p.product?.name || "Botanical Specimen";
                  const pricePaise =
                    p.price_paise || p.inventory?.price_paise || 0;
                  const stock =
                    p.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
                  const status = p.status || "active";

                  return (
                    <tr
                      key={prodId}
                      className="hover:bg-cream-100/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-ink-900 text-sm">
                          {prodName}
                        </div>
                        <div className="text-[11px] text-ink-500">
                          {p.category_name || "Plant"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-ink-800">
                        {p.seller_name || p.nursery_name || "Nursery Partner"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-ink-900">
                        {formatINR(pricePaise)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-ink-800">
                        {stock} units
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            status === "active"
                              ? "bg-forest-100 text-forest-800 border border-forest-200"
                              : "bg-warning-100 text-warning-700 border border-warning-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status === "active" ? (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                handleUpdateStatus(prodId, "inactive")
                              }
                              className="px-2.5 py-1 bg-cream-200 hover:bg-error-50 text-error-700 rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                            >
                              Hide
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                handleUpdateStatus(prodId, "active")
                              }
                              className="px-2.5 py-1 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50"
                            >
                              Approve / Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 text-xs text-ink-500">
            No products found matching your query.
          </div>
        )}
      </div>
    </div>
  );
}
