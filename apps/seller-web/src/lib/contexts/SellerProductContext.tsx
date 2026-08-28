"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ProductListing } from "@floria/types";
import { api } from "@/lib/api";
import { useSellerAuth } from "./SellerAuthContext";

export interface SellerProductContextType {
  products: ProductListing[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  updateStock: (productId: string, newStock: number) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
}

const SellerProductContext = createContext<
  SellerProductContextType | undefined
>(undefined);

export function SellerProductProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isApproved } = useSellerAuth();
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    if (!isApproved) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSellerProducts();
      if (res.success && res.data) {
        setProducts(res.data as ProductListing[]);
      } else {
        setError(res.error?.message || "Failed to load seller catalog");
      }
    } catch (e: any) {
      setError(e.message || "Failed to connect to catalog API");
    } finally {
      setLoading(false);
    }
  }, [isApproved]);

  useEffect(() => {
    if (isApproved) {
      refreshProducts();
    }
  }, [isApproved, refreshProducts]);

  const updateStock = async (
    productId: string,
    newStock: number,
  ): Promise<boolean> => {
    try {
      const res = await api.updateSellerInventory(productId, {
        stock_quantity: newStock,
      });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.product.id === productId
              ? {
                  ...p,
                  inventory: { ...p.inventory, stock_quantity: newStock },
                }
              : p,
          ),
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const res = await api.deleteSellerProduct(productId);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.product.id !== productId));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <SellerProductContext.Provider
      value={{
        products,
        loading,
        error,
        refreshProducts,
        updateStock,
        deleteProduct,
      }}
    >
      {children}
    </SellerProductContext.Provider>
  );
}

export function useSellerProducts(): SellerProductContextType {
  const context = useContext(SellerProductContext);
  if (!context) {
    throw new Error(
      "useSellerProducts must be used within a SellerProductProvider",
    );
  }
  return context;
}
