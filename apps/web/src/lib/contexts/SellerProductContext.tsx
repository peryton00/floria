"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type {
  Product,
  Inventory,
  ProductImage,
  ProductListing,
} from "@floria/types";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export interface CreateProductInput {
  seller_id?: string;
  name: string;
  category_id: string;
  description?: string;
  care_instructions?: string;
  price_paise: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  sku?: string;
  status?: "active" | "draft" | "inactive";
  image_url?: string;
}

export interface SellerProductContextType {
  products: Product[];
  inventories: Record<string, Inventory>;
  images: Record<string, ProductImage[]>;
  isLoading: boolean;
  getProductsBySeller: (sellerId: string) => ProductListing[];
  getProductListingById: (productId: string) => ProductListing | null;
  addProduct: (input: CreateProductInput) => Promise<ProductListing | null> | ProductListing;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void> | void;
  updateInventory: (
    productId: string,
    updates: { price_paise?: number; stock_quantity?: number; low_stock_threshold?: number; sku?: string | null }
  ) => Promise<void> | void;
  togglePublishStatus: (productId: string) => Promise<void> | void;
  deleteProduct: (productId: string) => Promise<void> | void;
  refreshProducts: () => Promise<void>;
}

const SellerProductContext = createContext<SellerProductContextType | undefined>(undefined);

export function SellerProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventories, setInventories] = useState<Record<string, Inventory>>({});
  const [images, setImages] = useState<Record<string, ProductImage[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshProducts = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const res = await api.getSellerProducts();
        if (res.success && res.data) {
          const prods: Product[] = [];
          const invMap: Record<string, Inventory> = {};
          const imgMap: Record<string, ProductImage[]> = {};

          (res.data as any[]).forEach((row: any) => {
            const p: Product = {
              id: row.id,
              seller_id: row.seller_id,
              category_id: row.category_id,
              name: row.name,
              slug: row.slug,
              description: row.description || null,
              care_instructions: row.care_instructions || null,
              status: row.status,
              created_at: row.created_at || "",
              updated_at: row.updated_at || "",
            };
            prods.push(p);

            const inv = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
            if (inv) {
              invMap[p.id] = {
                id: inv.id || `inv-${p.id}`,
                product_id: p.id,
                seller_id: p.seller_id,
                price_paise: inv.price_paise || 0,
                stock_quantity: inv.stock_quantity || 0,
                low_stock_threshold: inv.low_stock_threshold || 5,
                sku: inv.sku || null,
                updated_at: inv.updated_at || "",
              };
            }

            if (row.images && Array.isArray(row.images)) {
              imgMap[p.id] = row.images;
            }
          });

          setProducts(prods);
          setInventories(invMap);
          setImages(imgMap);
          return;
        }
      }
    } catch (e) {
      console.warn("[SellerProductContext] refreshProducts error:", e);
    }

    try {
      const storedProds = localStorage.getItem("floria_seller_products");
      const storedInvs = localStorage.getItem("floria_seller_inventory");
      const storedImgs = localStorage.getItem("floria_seller_images");

      if (storedProds && storedInvs) {
        setProducts(JSON.parse(storedProds));
        setInventories(JSON.parse(storedInvs));
        setImages(storedImgs ? JSON.parse(storedImgs) : {});
      } else {
        setProducts([]);
        setInventories({});
        setImages({});
      }
    } catch {
      setProducts([]);
      setInventories({});
      setImages({});
    }
  }, []);

  useEffect(() => {
    refreshProducts().then(() => setIsLoading(false));

    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        await refreshProducts();
      } else if (event === "SIGNED_OUT") {
        setProducts([]);
        setInventories({});
        setImages({});
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProducts]);

  const [categories, setCategories] = useState<import("@floria/types").Category[]>([]);

  useEffect(() => {
    api.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    }).catch(() => {});
  }, []);

  const getProductListingById = (productId: string): ProductListing | null => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return null;
    const inv = inventories[p.id] ?? {
      id: `inv-${p.id}`,
      product_id: p.id,
      seller_id: p.seller_id,
      price_paise: 0,
      stock_quantity: 0,
      low_stock_threshold: 5,
      sku: null,
      updated_at: new Date().toISOString(),
    };
    const imgList = images[p.id] ?? [];
    const primaryImg = imgList.find((i) => i.is_primary) ?? imgList[0] ?? null;
    const cat = categories.find((c) => c.id === p.category_id) ?? null;
    const seller = { id: p.seller_id, business_name: "Seller Nursery" };

    return {
      product: p,
      inventory: inv,
      primary_image: primaryImg,
      seller,
      category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
    };
  };

  const getProductsBySeller = (sellerId: string): ProductListing[] => {
    return products.map((p) => getProductListingById(p.id)!);
  };

  const addProduct = async (input: CreateProductInput): Promise<ProductListing | null> => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const res = await api.createSellerProduct(input);
      if (res.success && res.data) {
        await refreshProducts();
        return getProductListingById(res.data.id);
      }
    }

    const id = `p-seller-${Date.now()}`;
    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-") + `-${Date.now().toString().slice(-4)}`;

    const now = new Date().toISOString();
    const newProduct: Product = {
      id,
      seller_id: input.seller_id || "sel-demo-1",
      category_id: input.category_id,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() ?? null,
      care_instructions: input.care_instructions?.trim() ?? null,
      status: input.status ?? "active",
      created_at: now,
      updated_at: now,
    };

    const newInv: Inventory = {
      id: `inv-${id}`,
      product_id: id,
      seller_id: input.seller_id || "sel-demo-1",
      price_paise: Math.max(0, input.price_paise),
      stock_quantity: Math.max(0, input.stock_quantity),
      low_stock_threshold: input.low_stock_threshold ?? 5,
      sku: input.sku?.trim() ?? null,
      updated_at: now,
    };

    const newImg: ProductImage = {
      id: `img-${id}`,
      product_id: id,
      url: input.image_url ?? "/floria-logo.png",
      alt_text: input.name,
      display_order: 1,
      is_primary: true,
      created_at: now,
    };

    setProducts((prev) => [newProduct, ...prev]);
    setInventories((prev) => ({ ...prev, [id]: newInv }));
    setImages((prev) => ({ ...prev, [id]: [newImg] }));

    return {
      product: newProduct,
      inventory: newInv,
      primary_image: newImg,
      seller: { id: newProduct.seller_id, business_name: "Green Leaf Nursery" },
      category: null,
    };
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const res = await api.updateSellerProduct(productId, updates);
      if (res.success) {
        await refreshProducts();
        return;
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );
  };

  const updateInventory = async (
    productId: string,
    updates: { price_paise?: number; stock_quantity?: number; low_stock_threshold?: number; sku?: string | null }
  ) => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const res = await api.updateSellerInventory(productId, updates);
      if (res.success) {
        await refreshProducts();
        return;
      }
    }

    setInventories((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      return {
        ...prev,
        [productId]: {
          ...existing,
          price_paise: updates.price_paise !== undefined ? Math.max(0, updates.price_paise) : existing.price_paise,
          stock_quantity: updates.stock_quantity !== undefined ? Math.max(0, updates.stock_quantity) : existing.stock_quantity,
          low_stock_threshold: updates.low_stock_threshold !== undefined ? Math.max(0, updates.low_stock_threshold) : existing.low_stock_threshold,
          sku: updates.sku !== undefined ? updates.sku : existing.sku,
          updated_at: new Date().toISOString(),
        },
      };
    });
  };

  const togglePublishStatus = async (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    const nextStatus = p.status === "active" ? "draft" : "active";

    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const res = await api.updateSellerProductStatus(productId, nextStatus);
      if (res.success) {
        await refreshProducts();
        return;
      }
    }

    updateProduct(productId, { status: nextStatus });
  };

  const deleteProduct = async (productId: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const res = await api.deleteSellerProduct(productId);
      if (res.success) {
        await refreshProducts();
        return;
      }
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <SellerProductContext.Provider
      value={{
        products,
        inventories,
        images,
        isLoading,
        getProductsBySeller,
        getProductListingById,
        addProduct,
        updateProduct,
        updateInventory,
        togglePublishStatus,
        deleteProduct,
        refreshProducts,
      }}
    >
      {children}
    </SellerProductContext.Provider>
  );
}

export function useSellerProducts() {
  const ctx = useContext(SellerProductContext);
  if (!ctx) {
    throw new Error("useSellerProducts must be used within a SellerProductProvider");
  }
  return ctx;
}
