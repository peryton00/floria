"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/lib/contexts/ToastContext";
import { useSellerProducts } from "@/lib/contexts/SellerProductContext";
import {
  ProductImageUploader,
  type ImageItem,
} from "@/components/seller/ProductImageUploader";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import type { Category } from "@floria/types";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { refreshProducts } = useSellerProducts();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("3");
  const [description, setDescription] = useState("");
  const [careLevel, setCareLevel] = useState("EASY");
  const [sku, setSku] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          api.getCategories(),
          api.getSellerProductById(id),
        ]);

        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }

        if (prodRes.success && prodRes.data) {
          const item = prodRes.data;
          setName(item.product.name);
          setCategoryId(item.category?.id || "");
          setPriceRupees((item.inventory.price_paise / 100).toString());
          setStockQuantity(item.inventory.stock_quantity.toString());
          setLowStockThreshold(
            (item.inventory.low_stock_threshold || 3).toString(),
          );
          setDescription(item.product.description || "");
          setCareLevel(item.product.care_level || "EASY");
          setSku(item.inventory.sku || "");

          if (item.product.images) {
            setImages(
              item.product.images.map((img: any) => ({
                id: img.id,
                assetId: img.asset_id || img.id,
                url: img.url,
                altText: img.alt_text,
                isPrimary: img.is_primary,
                status: "READY",
              })),
            );
          }
        } else {
          setError(prodRes.error?.message || "Failed to load product details.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !priceRupees) {
      setError("Plant name and selling price are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const pricePaise = Math.round(parseFloat(priceRupees) * 100);
      const stock = parseInt(stockQuantity, 10) || 0;
      const threshold = parseInt(lowStockThreshold, 10) || 3;

      const payload = {
        name: name.trim(),
        category_id: categoryId || undefined,
        description: description.trim() || undefined,
        price_paise: pricePaise,
        stock_quantity: stock,
        low_stock_threshold: threshold,
        sku: sku.trim() || undefined,
        care_level: careLevel,
        images: images.map((img, idx) => ({
          assetId: img.assetId,
          url: img.url,
          altText: img.altText || name,
          isPrimary: img.isPrimary ?? idx === 0,
          displayOrder: idx,
        })),
      };

      const res = await api.updateSellerProduct(id, payload);
      if (res.success && res.data) {
        toast.success("Changes Saved", `'${name}' updated successfully.`);
        await refreshProducts();
        router.push("/products");
      } else {
        setError(res.error?.message || "Failed to update product listing.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/products"
          className="p-2 bg-cream-50 hover:bg-cream-200 border border-cream-300 rounded-xl text-ink-700 transition-colors"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900">
            Edit Plant Listing
          </h1>
          <p className="text-xs text-ink-500">
            Update product specifications, pricing, stock and images
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-xs text-error-700 font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900 border-b border-cream-300 pb-2">
            1. Plant Identification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Botanical / Common Plant Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Care Level
              </label>
              <select
                value={careLevel}
                onChange={(e) => setCareLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                <option value="EASY">Easy (Low Maintenance)</option>
                <option value="MODERATE">Moderate</option>
                <option value="ADVANCED">Advanced / Specialist</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Plant Description & Care Guidelines
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900 border-b border-cream-300 pb-2">
            2. Pricing & Inventory Control
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Selling Price (₹ INR) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs font-bold text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Available Stock *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
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
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                Stock Keeping Unit (SKU / Nursery Code)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-serif text-base font-bold text-ink-900 border-b border-cream-300 pb-2">
            3. Botanical Photos
          </h2>
          <ProductImageUploader
            images={images}
            onChange={setImages}
            maxImages={6}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/products"
            className="px-5 py-2.5 bg-cream-200 hover:bg-cream-300 text-ink-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-xs"
          >
            {saving ? "Saving Changes..." : "Save Product Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
