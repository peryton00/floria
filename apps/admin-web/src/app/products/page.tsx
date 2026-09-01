"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { SearchIcon, LeafIcon, CloseIcon } from "@/components/ui/Icons";
import { useToast } from "@/lib/contexts/ToastContext";
import { ProductGridSkeleton } from "@/components/ui/loading";

import { ProductFinancialBreakdown } from "@/components/admin/ProductFinancialBreakdown";

function formatBytes(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [financialProductId, setFinancialProductId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit / Modal fields
  const [modalTab, setModalTab] = useState<"moderation" | "edit" | "media">("moderation");
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
      setError(null);
      const results = await Promise.allSettled([
        api.getAdminProducts({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        }),
        api.getAdminCategories(),
      ]);

      const [prodSettled, catSettled] = results;

      if (prodSettled.status === "fulfilled" && prodSettled.value?.success && prodSettled.value?.data) {
        setProducts(prodSettled.value.data);
      } else if (prodSettled.status === "fulfilled" && prodSettled.value?.error?.message) {
        setError(prodSettled.value.error.message);
      }

      if (catSettled.status === "fulfilled" && catSettled.value?.success && catSettled.value?.data) {
        setCategories(catSettled.value.data);
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, statusFilter, categoryFilter]);

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
    setModalTab("moderation");
  };

  const handleModerateStatus = async (action: "publish" | "unpublish" | "archive") => {
    if (!selectedProduct) return;
    try {
      setActionLoading(true);
      let res: any;
      if (action === "publish") res = await api.publishProduct(selectedProduct.id);
      else if (action === "unpublish") res = await api.unpublishProduct(selectedProduct.id);
      else if (action === "archive") res = await api.archiveProduct(selectedProduct.id);

      if (res?.success) {
        toast.success("Product updated", `Product was ${action}ed successfully.`);
        await fetchProducts();
        setSelectedProduct(null);
      } else {
        toast.error("Action failed", res?.error?.message || `Failed to ${action} product`);
      }
    } catch (e: any) {
      toast.error("Action failed", e.message || "Error moderating product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Math.round(parseFloat(editPriceINR) * 100);
    const parsedStock = parseInt(editStock);
    if (isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedStock) || parsedStock < 0) {
      toast.error("Invalid values", "Please enter valid price and stock quantity values.");
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
        toast.success("Product updated", "Product and inventory updated successfully.");
        await fetchProducts();
        setSelectedProduct(null);
      } else {
        toast.error("Update failed", res.error?.message || "Failed to update product details");
      }
    } catch (err: any) {
      toast.error("Update failed", err.message || "Error performing updates");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Marketplace Catalog &amp; Pricing Governance</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Audit botanical listings, inspect financial markup structures, and manage custom product pricing overrides.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
              {products.length} Total SKUs
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <form onSubmit={handleSearchSubmit} className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80 relative">
            <input
              type="search"
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 font-mono text-xs rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] bg-[#F8FAFC] placeholder:text-slate-400 font-sans"
            />
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] bg-[#F8FAFC] font-semibold text-slate-700"
            >
              <option value="all">All Botanical Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] bg-[#F8FAFC] font-semibold text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Published)</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive / Unpublished</option>
              <option value="deleted">Archived</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#14392E] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-xs"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Product Cards Grid */}
        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded border border-[#E2E8F0]">
            No products matching the selected criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const pricePaise = p.inventory?.[0]?.price_paise ?? p.inventory?.price_paise ?? 0;
              const customerPricePaise = p.pricing?.sellingPricePaise ?? p.pricing?.customerPricePaise ?? pricePaise;
              const stockQty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
              const sellerName = p.seller?.business_name || "Partner Nursery";
              const catName = p.category?.name || "Uncategorized";

              return (
                <div
                  key={p.id}
                  className="bg-white rounded border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-400 transition-all"
                >
                  <div className="flex items-start justify-between min-w-0 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded bg-emerald-50 text-[#1B4D3E] flex items-center justify-center flex-shrink-0 border border-emerald-200">
                        <LeafIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#0F172A] leading-tight truncate font-sans text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{p.id}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${p.status === "active" ? "bg-emerald-50 text-[#1B4D3E] border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                    <p className="text-slate-600 font-medium truncate"><span className="text-slate-400">Category:</span> {catName}</p>
                    <p className="text-slate-600 font-medium truncate"><span className="text-slate-400">Nursery:</span> {sellerName}</p>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 mt-1">
                      <span className="font-mono text-xs font-bold text-emerald-800">Customer: {formatINR(customerPricePaise)}</span>
                      <span className={`font-mono text-[11px] font-bold ${stockQty === 0 ? "text-red-600" : stockQty <= 5 ? "text-amber-600" : "text-slate-600"}`}>
                        Stock: {stockQty} units
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFinancialProductId(p.id)}
                      className="text-xs text-[#1B4D3E] font-bold hover:underline font-sans"
                    >
                      Inspect Breakdown
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenModerate(p)}
                      className="px-3 py-1 rounded border border-[#E2E8F0] hover:bg-[#1B4D3E] hover:text-white text-[#0F172A] font-mono font-bold text-[10px] uppercase tracking-wider transition-colors shadow-xs"
                    >
                      Moderate →
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
                  className="text-ink-400 hover:text-ink-900 transition-colors p-1"
                  aria-label="Close modal"
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              {/* View/Edit/Media Navigation */}
              <div className="flex border-b border-ink-100 gap-4 text-xs font-bold uppercase tracking-wider overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setModalTab("moderation")}
                  className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${modalTab === "moderation" ? "border-forest-700 text-forest-700" : "border-transparent text-ink-400"}`}
                >
                  Status Moderation
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("edit")}
                  className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${modalTab === "edit" ? "border-forest-700 text-forest-700" : "border-transparent text-ink-400"}`}
                >
                  Edit Specifications
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("media")}
                  className={`pb-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${modalTab === "media" ? "border-forest-700 text-forest-700" : "border-transparent text-ink-400"}`}
                >
                  <span>Media Assets</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-forest-100 text-forest-800 font-mono">
                    {selectedProduct.images?.length || 0}
                  </span>
                </button>
              </div>

              {modalTab === "moderation" && (
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
              )}

              {modalTab === "edit" && (
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

              {modalTab === "media" && (
                <div className="space-y-4 text-xs font-sans">
                  {!selectedProduct.images || selectedProduct.images.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium">
                      No media assets attached to this product.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedProduct.images.map((img: any, idx: number) => {
                        const asset = img.asset || {};
                        const variants = img.variant_details || [];
                        const fileSizeFormatted = formatBytes(asset.file_size_bytes);

                        return (
                          <div key={img.id || img.asset_id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                            {/* Card Top Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={img.url || "/brand_logo.svg"}
                                    alt={asset.original_filename || `Image ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                                      {asset.original_filename || `Product Media #${idx + 1}`}
                                    </span>
                                    {img.is_primary && (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Primary Image
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    Asset ID: {img.asset_id || "Unlinked"}
                                  </p>
                                </div>
                              </div>

                              <a
                                href={img.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-forest-800 border border-slate-300 font-mono font-bold text-[10px] transition-colors shrink-0"
                              >
                                Full View ↗
                              </a>
                            </div>

                            {/* Metadata Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">File Size</span>
                                <span className="font-bold text-slate-800">{fileSizeFormatted}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">Dimensions</span>
                                <span className="font-bold text-slate-800">
                                  {asset.width && asset.height ? `${asset.width} × ${asset.height} px` : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">MIME Type</span>
                                <span className="font-bold text-slate-800 truncate block">{asset.mime_type || "image/jpeg"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase">Storage Status</span>
                                <span className="font-bold text-emerald-700 uppercase">{asset.status || "READY"}</span>
                              </div>
                            </div>

                            {/* Hash Details */}
                            {asset.sha256_hash && (
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[10px] flex items-center justify-between gap-2">
                                <span className="text-slate-400 shrink-0 uppercase font-bold text-[9px]">SHA-256 Hash:</span>
                                <span className="text-slate-700 truncate font-semibold">{asset.sha256_hash}</span>
                              </div>
                            )}

                            {/* WebP Variants Table */}
                            {variants.length > 0 && (
                              <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                                <p className="font-bold text-[10px] uppercase tracking-wider text-slate-600">
                                  Generated WebP Image Variants ({variants.length})
                                </p>
                                <div className="divide-y divide-slate-100 font-mono text-[11px]">
                                  {variants.map((v: any) => (
                                    <div key={v.variant_name} className="py-1.5 flex justify-between items-center text-slate-700">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold uppercase text-forest-800 text-[10px] px-1.5 py-0.5 bg-forest-50 border border-forest-100 rounded">
                                          {v.variant_name}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                          {v.width && v.height ? `${v.width}×${v.height} px` : "WebP"} • {formatBytes(v.file_size_bytes)}
                                        </span>
                                      </div>
                                      <a
                                        href={v.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-forest-700 font-bold hover:underline text-[10px]"
                                      >
                                        Open ↗
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Financial Breakdown Inspection */}
        {financialProductId && (
          <ProductFinancialBreakdown
            productId={financialProductId}
            onClose={() => setFinancialProductId(null)}
          />
        )}
      </div>
    </AdminShell>
  );
}
