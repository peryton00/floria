"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SearchIcon, LeafIcon } from "@/components/ui/Icons";

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

  // Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("draft");
  const [editPriceINR, setEditPriceINR] = useState("0");
  const [editStock, setEditStock] = useState("0");
  const [editSku, setEditSku] = useState("");

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

  const handleOpenModerate = (p: any) => {
    setSelectedProduct(p);
    setEditName(p.name || "");
    setEditDesc(p.description || "");
    setEditCategory(p.category_id || "");
    setEditStatus(p.status || "draft");
    const pricePaise = p.inventory?.[0]?.price_paise ?? p.inventory?.price_paise ?? 0;
    const stockQty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
    const sku = p.inventory?.[0]?.sku ?? p.inventory?.sku ?? "";
    setEditPriceINR((pricePaise / 100).toFixed(2));
    setEditStock(String(stockQty));
    setEditSku(sku);
    setIsEditing(false);
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

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Math.round(parseFloat(editPriceINR) * 100);
    const parsedStock = parseInt(editStock);
    if (isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedStock) || parsedStock < 0) {
      alert("Please enter valid price and stock quantity values.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.updateAdminProduct(selectedProduct.id, {
        name: editName,
        description: editDesc,
        category_id: editCategory,
        status: editStatus,
        price_paise: parsedPrice,
        stock_quantity: parsedStock,
        sku: editSku,
      });

      if (res.success) {
        alert("Product and inventory updated successfully.");
        await fetchProducts();
        setSelectedProduct(null);
      } else {
        alert(res.error?.message || "Failed to update product details");
      }
    } catch (err: any) {
      alert(err.message || "Error performing updates");
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
        <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl border border-ink-100 p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-72 relative">
            <input
              type="search"
              placeholder="Search product..."
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

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-400">No products matching the selected criteria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const pricePaise = p.inventory?.[0]?.price_paise ?? p.inventory?.price_paise ?? 0;
              const stockQty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
              const sellerName = p.seller?.business_name || "Partner Nursery";
              const catName = p.category?.name || "Uncategorized";

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-ink-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-ink-200 transition-colors"
                >
                  <div className="flex items-start justify-between min-w-0 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center flex-shrink-0">
                        <LeafIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-ink-900 leading-tight truncate">{p.name}</p>
                        <p className="text-[9px] text-ink-400 font-mono mt-0.5 truncate">{p.id}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${p.status === "active" ? "bg-success-50 text-success-700 border-success-100" : "bg-ink-50 text-ink-600 border-ink-100"}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-ink-500 font-medium truncate">Category: {catName}</p>
                    <p className="text-ink-500 font-medium truncate">Nursery: {sellerName}</p>
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold text-forest-800 text-[13px]">{formatINR(pricePaise)}</span>
                      <span className={`font-semibold ${stockQty <= 0 ? "text-error-600" : "text-ink-700"}`}>
                        {stockQty <= 0 ? "Out of Stock" : `${stockQty} units`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-ink-50 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenModerate(p)}
                      className="px-3 py-1 rounded-lg border border-ink-200 hover:bg-cream-100 text-ink-700 font-bold text-[9px] uppercase tracking-wider transition-colors"
                    >
                      Moderate &amp; Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Moderation Editor Drawer */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-ink-100 p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-900">Manage Catalog Product</h3>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{selectedProduct.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-ink-400 hover:text-ink-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* View/Edit Navigation */}
              <div className="flex border-b border-ink-100 gap-4 text-xs font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`pb-2 border-b-2 transition-colors ${!isEditing ? "border-forest-700 text-forest-700" : "border-transparent text-ink-400"}`}
                >
                  Status Moderation
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`pb-2 border-b-2 transition-colors ${isEditing ? "border-forest-700 text-forest-700" : "border-transparent text-ink-400"}`}
                >
                  Edit Specifications
                </button>
              </div>

              {!isEditing ? (
                <div className="space-y-4">
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
              ) : (
                <form onSubmit={handleSaveDetails} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Catalog Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full p-3 rounded-lg border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        SKU Reference
                      </label>
                      <input
                        type="text"
                        value={editSku}
                        onChange={(e) => setEditSku(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-1 focus:ring-forest-700 bg-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="deleted">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Save Changes
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
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
