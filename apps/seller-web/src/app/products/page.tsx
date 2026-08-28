"use client";

import { useState } from "react";
import Link from "next/link";
import { useSellerProducts } from "@/lib/contexts/SellerProductContext";
import { formatINR } from "@/lib/format";
import { StockStatusBadge } from "@/components/seller/StockStatusBadge";
import { useToast } from "@/lib/contexts/ToastContext";
import { ProductListSkeleton } from "@/components/ui/loading";
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  DeleteIcon,
  AlertIcon,
} from "@/components/ui/Icons";

export default function SellerProductsPage() {
  const { products, loading, error, refreshProducts, deleteProduct } =
    useSellerProducts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.inventory.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || p.category?.slug === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (productId: string, productName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove '${productName}' from your catalog?`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(productId);
      const success = await deleteProduct(productId);
      if (success) {
        toast.success(
          "Product Deleted",
          `'${productName}' removed from catalog.`,
        );
      } else {
        toast.error("Delete Failed", "Could not delete this product.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && products.length === 0) {
    return <ProductListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Plant Catalog
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Manage product descriptions, pricing, inventory & botanical imagery
          </p>
        </div>

        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
        >
          <PlusIcon size={16} /> Add New Plant
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-xs text-error-700 font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={refreshProducts}
            className="underline uppercase font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <SearchIcon
            size={16}
            className="absolute left-3 top-3 text-ink-400"
          />
          <input
            type="text"
            placeholder="Search plant name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>

        <div className="text-xs font-bold text-ink-500">
          Showing {filteredProducts.length} of {products.length} items
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl shadow-xs overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-200/70 border-b border-cream-300 text-ink-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Plant & Category</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {filteredProducts.map((p) => (
                  <tr
                    key={p.product.id}
                    className="hover:bg-cream-100/60 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cream-200 border border-cream-300 overflow-hidden shrink-0">
                          {p.primary_image?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.primary_image.url}
                              alt={p.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-ink-400 font-bold uppercase">
                              Plant
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-ink-900 text-sm">
                            {p.product.name}
                          </div>
                          <div className="text-[11px] text-ink-500">
                            {p.category?.name || "Uncategorized"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-ink-900">
                      {formatINR(p.inventory.price_paise)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StockStatusBadge
                        quantity={p.inventory.stock_quantity}
                        lowStockThreshold={p.inventory.low_stock_threshold || 5}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-ink-600 font-mono text-[11px]">
                      {p.inventory.sku || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${p.product.id}`}
                          className="p-1.5 hover:bg-cream-200 text-forest-800 rounded-lg transition-colors"
                          title="Edit plant"
                        >
                          <EditIcon size={16} />
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === p.product.id}
                          onClick={() =>
                            handleDelete(p.product.id, p.product.name)
                          }
                          className="p-1.5 hover:bg-error-50 text-error-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete plant"
                        >
                          <DeleteIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-cream-200 text-forest-800 flex items-center justify-center mx-auto">
              <PlusIcon size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-ink-900">
              No Plants Found
            </h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              {searchTerm
                ? "No products match your search criteria."
                : "You have not listed any botanical items yet. Add your first plant to start selling!"}
            </p>
            <Link
              href="/products/new"
              className="inline-block mt-2 px-4 py-2 bg-forest-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-forest-900"
            >
              Add Plant
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
