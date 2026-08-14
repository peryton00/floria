"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSeller } from "@/lib/contexts/SellerContext";
import { api } from "@/lib/api";
import { AlertIcon } from "@/components/ui/Icons";

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
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/seller/products" className="text-xs font-bold text-forest-700 hover:text-forest-900">
          ← Back to Catalog
        </Link>
        {savedSuccess && (
          <span className="text-xs font-bold text-success-700 bg-success-50 px-3 py-1 rounded-full border border-success-100">
            ✓ Product updated successfully!
          </span>
        )}
      </div>

      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 leading-tight">Edit Product</h1>
        <p className="text-xs text-ink-400 font-mono mt-0.5">Product ID: {productId}</p>
      </div>

      {apiError && (
        <div className="bg-error-50 border border-error-100 rounded-xl p-4 text-xs text-error-700 flex items-center gap-2">
          <AlertIcon size={16} />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-ink-100 p-6 shadow-xs space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
          {errors.name && <p className="text-[10px] text-error-600 mt-1">{errors.name}</p>}
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-[10px] text-error-600 mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
              Publish Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
            >
              <option value="active">Active (Published)</option>
              <option value="draft">Draft (Hidden)</option>
            </select>
          </div>
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
              Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            {errors.price && <p className="text-[10px] text-error-600 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
              Available Stock *
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            {errors.stock && <p className="text-[10px] text-error-600 mt-1">{errors.stock}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
          </div>
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
            SKU Code (Optional)
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </div>

        {/* Care Instructions */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
            Plant Care Instructions
          </label>
          <textarea
            rows={2}
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            className="w-full p-3 rounded-xl border border-ink-200 text-xs focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!isApproved || isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving Changes..." : "Save Product Changes"}
          </button>
          <Link
            href="/seller/products"
            className="px-4 py-2.5 rounded-xl border border-ink-200 text-ink-600 font-bold text-xs uppercase tracking-wider hover:bg-cream-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
