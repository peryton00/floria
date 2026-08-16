"use client";

import React from "react";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { OrderProvider } from "@/lib/contexts/OrderContext";
import { CustomerProvider } from "@/lib/contexts/CustomerContext";
import { ToastProvider } from "@/lib/contexts/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CustomerProvider>
        <WishlistProvider>
          <CartProvider>
            <OrderProvider>
              {children}
            </OrderProvider>
          </CartProvider>
        </WishlistProvider>
      </CustomerProvider>
    </ToastProvider>
  );
}
