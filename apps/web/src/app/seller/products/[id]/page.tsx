"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api } from "@/lib/api";
import { AlertIcon } from "@/components/ui/Icons";
import { ProductImageUploader } from "@/components/seller/ProductImageUploader";

interface FormErrors {
  name?: string;
  category_id?: string;
  price?: string;
  stock?: string;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const router = useRouter();
  const { isApproved } = useSeller();

  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [stock, setStock] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [productImages, setProductImages] = useState<import("@/components/seller/ProductImageUploader").ImageItem[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          api.getCategories(),
          api.getSellerProductById(productId),
        ]);

        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }

        if (prodRes.success && prodRes.data) {
          const p = prodRes.data;
          const qty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
          const thresh = p.inventory?.[0]?.low_stock_threshold ?? p.inventory?.low_stock_threshold ?? 5;
          const pricePaise = p.inventory?.[0]?.price_paise ?? p.inventory?.price_paise ?? 0;
          const skuCode = p.inventory?.[0]?.sku ?? p.inventory?.sku ?? "";

          setName(p.name);
          setCategoryId(p.category_id);
          setPriceRupees((pricePaise / 100).toString());
          setStock(qty.toString());
          setLowStockThreshold(thresh.toString());
          setSku(skuCode);
          setDescription(p.description || "");
          setCareInstructions(p.care_instructions || "");
          setStatus(p.status === "active" ? "active" : "draft");

          if (Array.isArray(p.images)) {
            setProductImages(
              p.images.map((img: any) => ({
                id: img.id,
                assetId: img.asset_id || "",
                url: img.url,
                altText: img.alt_text,
                isPrimary: img.is_primary,
                displayOrder: img.display_order,
                status: "READY" as const,
              }))
            );
          }
        } else {
          setApiError(prodRes.error?.message || "Product not found or access denied");
        }
      } catch (e: any) {
        setApiError(e.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId]);

  const validateForm = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Product name is required.";
    if (!categoryId) errs.category_id = "Please select a category.";
    
    const price = parseFloat(priceRupees);
    if (isNaN(price) || price <= 0) errs.price = "Enter a valid positive price.";

    const st = parseInt(stock, 10);
    if (isNaN(st) || st < 0) errs.stock = "Stock quantity cannot be negative.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSavedSuccess(false);

    if (!validateForm()) return;
    if (!isApproved) {
      setApiError("Only approved sellers can modify product listings.");
      return;
    }

    try {
      setIsSubmitting(true);
      const updates = {
        name: name.trim(),
        category_id: categoryId,
        price_paise: Math.round(parseFloat(priceRupees) * 100),
        stock_quantity: parseInt(stock, 10),
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        sku: sku.trim() || undefined,
        description: description.trim() || undefined,
        care_instructions: careInstructions.trim() || undefined,
        status,
      };

      const res = await api.updateSellerProduct(productId, updates);
      if (res.success) {
        setSavedSuccess(true);
      } else {
        setApiError(res.error?.message || "Failed to update product");
      }
    } catch (err: any) {
      setApiError(err.message || "Error updating product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans antialiased text-[#212529]">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded border border-[#E2E8F0] shadow-xs">
        <div>
          <Link href="/seller/products" className="text-xs font-bold text-[#1B4D3E] hover:underline mb-1.5 inline-flex items-center gap-1">
            ← Back to Product Catalog
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Edit Botanical Product</h1>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">Product ID: #{productId?.slice(0, 10)}</p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
              ✓ Changes Saved
            </span>
          )}
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-semibold text-red-700 flex items-center gap-2.5">
          <AlertIcon size={16} />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4">
        {/* Name */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
            Product Variety Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
          />
          {errors.name && <p className="text-xs text-red-600 font-semibold mt-1">{errors.name}</p>}
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-red-600 font-semibold mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
              Publish Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
            >
              <option value="active">Active (Published to Store)</option>
              <option value="draft">Draft (Hidden from Catalog)</option>
            </select>
          </div>
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
              Base Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
            />
            {errors.price && <p className="text-xs text-red-600 font-semibold mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
              Available Stock *
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
            />
            {errors.stock && <p className="text-xs text-red-600 font-semibold mt-1">{errors.stock}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
            />
          </div>
        </div>

        {/* Permanent SKU Display */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3.5 flex items-center justify-between">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
              Permanent Product SKU
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique SKU assigned permanently to this listing by Floria.
            </p>
          </div>
          <span className="font-mono text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-300 rounded tracking-wider">
            {sku || `FLR-${productId.replace(/-/g, "").slice(0, 8).toUpperCase()}`}
          </span>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
            Plant Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] resize-none"
          />
        </div>

        {/* Care Instructions */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
            Botanical Care Instructions
          </label>
          <textarea
            rows={2}
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            className="w-full p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] resize-none"
          />
        </div>

        {/* Product Media Uploader (Stage 8 Vertical Slice) */}
        <div className="pt-2 pb-2">
          <ProductImageUploader
            productId={productId}
            images={productImages}
            onChange={setProductImages}
            maxImages={8}
          />
        </div>

        <div className="flex gap-3 pt-3 border-t border-[#E2E8F0]">
          <button
            type="submit"
            disabled={!isApproved || isSubmitting}
            style={{ color: "#ffffff" }}
            className="flex-1 py-2.5 rounded bg-[#1B4D3E] hover:bg-[#153e31] !text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? "Saving Changes..." : "Save Product Changes"}
          </button>
          <Link
            href="/seller/products"
            className="px-5 py-2.5 rounded border border-[#E2E8F0] text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-[#F8FAFC] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

