"use client";

import { useState, useEffect, useRef } from "react";
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
  const [imageUrl, setImageUrl] = useState("/floria-logo.png");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.getCategories();
        if (res.success && res.data && res.data.length > 0) {
          setCategories(res.data);
          setCategoryId(res.data[0].id);
        }
      } catch (e: any) {
        console.error("Failed to load catalog categories", e);
      }
    }
    loadCategories();
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
        image_url: imageUrl,
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-ui">
      <div className="flex items-center gap-2">
        <Link href="/seller/products" className="text-xs font-bold text-forest-800 hover:underline inline-flex items-center gap-1">
          ← Back to Catalog
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">Add New Plant Product</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">List a new botanical variety or gardening supply in your nursery catalog.</p>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-center gap-2.5 shadow-2xs">
          <AlertIcon size={18} />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-floria-linen rounded-3xl border border-floria-border p-6 sm:p-8 shadow-xs space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
            Product Variety Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monstera Deliciosa (Swiss Cheese Plant)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900 placeholder:text-ink-400"
          />
          {errors.name && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.name}</p>}
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
              Publish Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900"
            >
              <option value="active">Active (Published to Store)</option>
              <option value="draft">Draft (Hidden from Catalog)</option>
            </select>
          </div>
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
              Base Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              placeholder="e.g. 499"
              className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900"
            />
            {errors.price && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
              Initial Stock *
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900"
            />
            {errors.stock && <p className="text-xs text-rose-600 font-semibold mt-1">{errors.stock}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900"
            />
          </div>
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
            SKU / Plant Code (Optional)
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="FLORIA-MONSTERA-01"
            className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
            Plant Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the plant species, growth characteristics, pot size, light and humidity requirements..."
            className="w-full p-3.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900 resize-none"
          />
        </div>

        {/* Care Instructions */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
            Botanical Care Instructions
          </label>
          <textarea
            rows={2}
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            placeholder="Watering frequency, sunlight preferences, soil blend, fertilizer schedule..."
            className="w-full p-3.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900 resize-none"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
            Plant Photography URL
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/floria-logo.png or https://images.unsplash.com/..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-floria-border bg-floria-sand/70 focus:bg-floria-linen text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-800/20 text-ink-900"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-floria-border">
          <button
            type="submit"
            disabled={!isApproved || isSubmitting}
            style={{ color: "#ffffff" }}
            className="flex-1 py-3 rounded-xl bg-forest-800 hover:bg-forest-900 !text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Publishing Product..." : "Create Product Listing"}
          </button>
          <Link
            href="/seller/products"
            className="px-5 py-3 rounded-xl border border-floria-border text-ink-700 font-bold text-xs uppercase tracking-wider hover:bg-floria-sand transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
