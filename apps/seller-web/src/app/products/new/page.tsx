"use client";

import { useState, useEffect, useRef } from "react";
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

export default function AddProductPage() {
  const router = useRouter();
  const { isApproved } = useSeller();

  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [stock, setStock] = useState("10");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("active");
  const [productImages, setProductImages] = useState<import("@/components/seller/ProductImageUploader").ImageItem[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [financialSettings, setFinancialSettings] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, finRes] = await Promise.all([
          api.getCategories(),
          api.getFinancialSettings().catch(() => ({ success: false, data: null })),
        ]);
        if (catRes.success && catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
          setCategoryId(catRes.data[0].id);
        }
        if (finRes.success && finRes.data) {
          setFinancialSettings(finRes.data);
        }
      } catch (e: any) {
        console.error("Failed to load catalog metadata", e);
      }
    }
    loadData();
  }, []);

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
    if (!validateForm()) return;

    if (!isApproved) {
      setApiError("Only approved sellers can publish products to the marketplace.");
      return;
    }

    try {
      setIsSubmitting(true);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.co";
      const cleanImages = productImages.map((img) => {
        let cleanUrl = img.url;
        if (cleanUrl && cleanUrl.startsWith("blob:")) {
          cleanUrl = img.assetId
            ? `${supabaseUrl}/storage/v1/object/public/public-media/product/${img.assetId}.webp`
            : "/brand_logo.svg";
        }
        return {
          asset_id: img.assetId || undefined,
          url: cleanUrl,
          is_primary: img.isPrimary,
        };
      });

      const payload = {
        name: name.trim(),
        category_id: categoryId,
        price_paise: Math.round(parseFloat(priceRupees) * 100),
        stock_quantity: parseInt(stock, 10),
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        sku: sku.trim() || undefined,
        description: description.trim() || undefined,
        care_instructions: careInstructions.trim() || undefined,
        status,
        images: cleanImages,
        image_url: cleanImages.find((img) => img.is_primary)?.url || cleanImages[0]?.url || "/brand_logo.svg",
      };

      const res = await api.createSellerProduct(payload);
      if (res.success) {
        router.push("/seller/products");
      } else {
        setApiError(res.error?.message || "Failed to create product listing");
      }
    } catch (err: any) {
      setApiError(err.message || "Error submitting product");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="font-sans text-xl font-bold text-[#0F172A] tracking-tight">Add New Plant Product</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">List a new botanical variety or gardening supply in your nursery catalog.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            New Listing Draft
          </span>
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
            placeholder="e.g. Monstera Deliciosa (Swiss Cheese Plant)"
            className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] placeholder:text-slate-400"
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
              placeholder="e.g. 499"
              className="w-full px-3.5 py-2 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A]"
            />
            {errors.price && <p className="text-xs text-red-600 font-semibold mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
              Initial Stock *
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

        {/* Live Business Logic & Profit Calculation */}
        {parseFloat(priceRupees) > 0 && (() => {
          const commRate = financialSettings?.sellerCommissionRate ?? 12.0;
          const profitRate = financialSettings?.floriaProfitRate ?? 2.0;
          const thresholdPaise = financialSettings?.freeDeliveryThresholdPaise ?? 59900;
          const recoveryPaise = financialSettings?.freeDeliveryRecoveryPaise ?? 2000;

          const basePaise = Math.round((parseFloat(priceRupees) || 0) * 100);
          const profitPaise = Math.round(basePaise * (profitRate / 100));
          const preRecoveryPaise = basePaise + profitPaise;
          const isFreeDel = preRecoveryPaise >= thresholdPaise;
          const deliveryRecoveryPaise = isFreeDel ? recoveryPaise : 0;
          const customerPricePaise = preRecoveryPaise + deliveryRecoveryPaise;
          const commissionPaise = Math.round(basePaise * (commRate / 100));
          const netPayoutPaise = basePaise - commissionPaise;

          return (
            <div className="bg-[#FAF8F5] border border-[#E8DFC8] rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-[#6D5D4B] uppercase tracking-wider">
                  Automated Pricing & Profit Breakdown
                </span>
                <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded">
                  Database Policy Active
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-[#E8DFC8]/60 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-medium block">Nursery Base Price</span>
                  <span className="font-mono font-bold text-sm text-ink-900">₹{(basePaise / 100).toFixed(2)}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E8DFC8]/60 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Estimated Net Nursery Payout ({(100 - commRate).toFixed(0)}%)
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-700">₹{(netPayoutPaise / 100).toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">After {commRate}% seller commission</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-300 bg-emerald-50/50 shadow-2xs">
                  <span className="text-[10px] text-emerald-900 font-semibold block">Storefront Final Customer Price</span>
                  <span className="font-mono font-bold text-sm text-[#1B4D3E]">
                    ₹{(customerPricePaise / 100).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">
                    +{profitRate}% margin {isFreeDel ? `+ ₹${(recoveryPaise / 100).toFixed(0)} free delivery recovery` : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SKU Notice */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-3.5 flex items-center justify-between">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
              Product SKU Code
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique SKU is automatically generated and permanently saved by Floria upon product creation.
            </p>
          </div>
          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
            Auto-Generated (FLR-XXXXXXXX)
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
            placeholder="Describe the plant species, growth characteristics, pot size, light and humidity requirements..."
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
            placeholder="Watering frequency, sunlight preferences, soil blend, fertilizer schedule..."
            className="w-full p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-[#0F172A] resize-none"
          />
        </div>

        {/* Product Media Uploader (Stage 8 Vertical Slice) */}
        <div className="pt-2 pb-2">
          <ProductImageUploader
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
            {isSubmitting ? "Publishing Product..." : "Create Product Listing"}
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

