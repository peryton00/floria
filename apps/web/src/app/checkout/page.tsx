"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { formatINR } from "@/lib/format";
import {
  CreditCardIcon,
  LeafIcon,
  TruckIcon,
  ShieldIcon,
  AlertIcon,
  CheckCircleIcon,
  WishlistIcon,
} from "@/components/ui/Icons";
import { useCart } from "@/lib/contexts/CartContext";
import type { CartItem } from "@/lib/contexts/CartContext";
import { AddressModal, AddressItem } from "@/components/ui/AddressModal";
import { useToast } from "@/lib/contexts/ToastContext";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { FinancialSettings, DeliverySettings } from "@floria/types";
import { CheckoutLoader } from "@/components/ui/loading";

/** Group cart items by seller ID */
function groupBySeller(items: CartItem[]) {
  const map = new Map<
    string,
    { sellerId: string; sellerName: string; items: CartItem[] }
  >();
  for (const item of items) {
    const id = item.listing.seller.id;
    if (!map.has(id)) {
      map.set(id, {
        sellerId: id,
        sellerName: item.listing.seller.business_name,
        items: [],
      });
    }
    map.get(id)!.items.push(item);
  }
  return Array.from(map.values());
}

import { useCustomer } from "@/lib/contexts/CustomerContext";
import { useOrders } from "@/lib/contexts/OrderContext";

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const {
    addresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
  } = useCustomer();
  const { refreshOrders } = useOrders();

  // State----
  const defaultAddr = getDefaultAddress();
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddr?.id ?? "",
  );
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">(
    "online",
  );
  const [step, setStep] = useState<"checkout" | "confirmation" | "redirecting">(
    "checkout",
  );
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [redirectOrderId, setRedirectOrderId] = useState<string | null>(null);
  const router = useRouter();

  // Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(
    null,
  );

  // Form / Validation errors
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const isPlacingOrderRef = useRef(false);

  // Dynamically loaded platform financial and delivery settings
  const [finSettings, setFinSettings] = useState<FinancialSettings | null>(
    null,
  );
  const [delSettings, setDelSettings] = useState<DeliverySettings | null>(null);

  // ── Cashfree Return Redirect Handler ────────────────────────────────────────
  // Cashfree redirects to /checkout?order_id=CF-ORD-xxx&floria_order_id=yyy after payment.
  // We resolve the order ID, clear the cart, and redirect to the receipt/order page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const floriaOrderId = params.get("floria_order_id");
    const cfOrderId = params.get("order_id");

    if (!floriaOrderId && !cfOrderId) return;

    setStep("redirecting");

    if (floriaOrderId) {
      clearCart();
      refreshOrders().catch(() => {});
      router.replace(`/orders/${floriaOrderId}`);
      return;
    }

    if (cfOrderId) {
      setRedirectOrderId(cfOrderId);
      api
        .getOrderByCfOrderId(cfOrderId)
        .then((res) => {
          const resolvedOrderId =
            (res as any)?.data?.orderId || (res as any)?.data?.order_id;
          clearCart();
          refreshOrders().catch(() => {});
          if (resolvedOrderId) {
            router.replace(`/orders/${resolvedOrderId}`);
          } else {
            router.replace("/orders");
          }
        })
        .catch(() => {
          clearCart();
          refreshOrders().catch(() => {});
          router.replace("/orders");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([
      api.getFinancialSettings().catch(() => null),
      api.getDeliverySettings().catch(() => null),
    ]).then(([fRes, dRes]) => {
      if (fRes?.success && fRes.data) setFinSettings(fRes.data);
      if (dRes?.success && dRes.data) setDelSettings(dRes.data);
    });
  }, []);

  // Synchronize default address selection if none selected or if selected address was deleted
  useEffect(() => {
    if (addresses.length > 0) {
      const exists = addresses.some((a) => a.id === selectedAddressId);
      if (!selectedAddressId || !exists) {
        const def = addresses.find((a) => a.is_default) || addresses[0];
        if (def) setSelectedAddressId(def.id);
      }
    }
  }, [addresses, selectedAddressId]);

  // Group items by nursery
  const nurseryGroups = groupBySeller(cartItems);

  // Calculations
  const subtotalPaise = cartItems.reduce(
    (sum, item) =>
      sum +
      (item.listing?.pricing?.sellingPricePaise ??
        item.listing?.inventory?.price_paise ??
        0) *
        item.quantity,
    0,
  );

  const allItemsFreeDelivery =
    cartItems.length > 0 &&
    cartItems.every((item) => Boolean(item.listing?.pricing?.isFreeDelivery));
  const estimatedDeliveryFeePaise =
    delSettings?.freeDeliveryEnabled && allItemsFreeDelivery
      ? 0
      : (delSettings?.baseDeliveryFeePaise ?? 0);
  const estimatedMaintenanceFeePaise =
    finSettings?.platformMaintenanceFeePaise ?? 0;
  const estimatedTotalPaise =
    subtotalPaise + estimatedDeliveryFeePaise + estimatedMaintenanceFeePaise;

  // Legitimate discount: only if the API returned a real original price higher than selling price.
  const discountPaise = cartItems.reduce((sum, item) => {
    const price =
      item.listing?.pricing?.sellingPricePaise ??
      item.listing?.inventory?.price_paise ??
      0;
    const original = item.listing?.pricing?.originalPricePaise;
    if (typeof original === "number" && original > price) {
      return sum + (original - price) * item.quantity;
    }
    return sum;
  }, 0);

  const totalItemsCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  // Stock checks
  const outOfStockItems = cartItems.filter(
    (item) => item.listing.inventory.stock_quantity < item.quantity,
  );

  // Address handlers
  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    setValidationError(null);
  };

  const handleSaveAddress = (addr: AddressItem) => {
    saveAddress(addr);
    setSelectedAddressId(addr.id);
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAddress(id);
  };

  const handleSetDefaultAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultAddress(id);
  };

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditModal = (addr: AddressItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };

  // Final Order Submission Handler — calls secure server API
  const handlePlaceOrder = async () => {
    if (isPlacingOrderRef.current) return;
    isPlacingOrderRef.current = true;
    setValidationError(null);

    if (cartItems.length === 0) {
      setValidationError(
        "Your cart is empty. Please add items before checking out.",
      );
      isPlacingOrderRef.current = false;
      return;
    }

    if (outOfStockItems.length > 0) {
      setValidationError(
        "Some items in your cart are currently out of stock. Please update your cart.",
      );
      isPlacingOrderRef.current = false;
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      setValidationError("Please select a delivery address.");
      isPlacingOrderRef.current = false;
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Server derives prices, stock, and seller IDs from DB — we only send addressId + paymentMethod
      const res = await api.createCheckout({
        addressId: selectedAddr.id,
        address: selectedAddr,
        paymentMethod,
      });

      if (!res.success || !res.data) {
        setValidationError(
          res.error?.message || "Failed to place order. Please try again.",
        );
        setIsPlacingOrder(false);
        isPlacingOrderRef.current = false;
        return;
      }

      const orderId = res.data.orderId;

      // Online Cashfree Payment Session Initialization
      if (paymentMethod === "online") {
        const sessionRes = await api.createPaymentSession(orderId);
        if (!sessionRes.success || !sessionRes.data?.paymentSessionId) {
          setValidationError(
            sessionRes.error?.message ||
              "Failed to create payment session. Please check your network or try Cash on Delivery.",
          );
          setIsPlacingOrder(false);
          isPlacingOrderRef.current = false;
          return;
        }

        // Ensure Cashfree SDK JS is loaded
        let CashfreeSDK = (window as any).Cashfree;
        if (!CashfreeSDK) {
          try {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
              script.onload = () => resolve();
              script.onerror = () =>
                reject(new Error("Cashfree SDK failed to load"));
              document.head.appendChild(script);
            });
            CashfreeSDK = (window as any).Cashfree;
          } catch (e) {
            console.warn("[Checkout] Cashfree SDK loading error:", e);
          }
        }

        if (CashfreeSDK) {
          try {
            const environment =
              (sessionRes.data.environment || "SANDBOX").toLowerCase() ===
              "production"
                ? "production"
                : "sandbox";
            const cashfree = CashfreeSDK({ mode: environment });
            await cashfree.checkout({
              paymentSessionId: sessionRes.data.paymentSessionId,
              redirectTarget: "_self",
            });
            // Cashfree handles redirect / modal
            return;
          } catch (cfErr: any) {
            console.error("[Checkout] Cashfree launch error:", cfErr);
            setValidationError(
              cfErr.message ||
                "Unable to launch Cashfree payment window. Please try again.",
            );
            setIsPlacingOrder(false);
            isPlacingOrderRef.current = false;
            return;
          }
        } else {
          setValidationError(
            "Cashfree Payment SDK could not be loaded. Please check your internet connection or use Cash on Delivery.",
          );
          setIsPlacingOrder(false);
          isPlacingOrderRef.current = false;
          return;
        }
      }

      // Cash on Delivery Order Completion
      setConfirmedOrder({
        id: orderId,
        createdAt: new Date().toLocaleString(),
        paymentMethod:
          paymentMethod === "cod"
            ? "Cash on Delivery"
            : "Online Payment (UPI/Cards/NetBanking)",
        address: selectedAddr,
        nurseryGroups,
        subtotalPaise,
        deliveryFeePaise: null,
        maintenanceFeePaise: null,
        totalPaise: null,
      });
      setStep("confirmation");
      clearCart();
      refreshOrders().catch((err) =>
        console.warn("[Checkout] refreshOrders error:", err),
      );
    } catch (err: any) {
      setValidationError(
        err.message ||
          "A network error occurred. Please check your connection and try again.",
      );
    } finally {
      setIsPlacingOrder(false);
      isPlacingOrderRef.current = false;
    }
  };

  // ── 0. PAYMENT REDIRECTING VIEW ────────────────────────────────────────────
  if (step === "redirecting") {
    return (
      <CustomerShell>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircleIcon size={36} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink-900 mb-2">
            Payment Confirmed!
          </h1>
          <p className="text-sm text-ink-500 mb-6">
            Thank you! Redirecting you to your order receipt and tracking...
          </p>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-forest-700 border-t-transparent"></div>
        </div>
      </CustomerShell>
    );
  }

  // ── 1. ORDER CONFIRMATION VIEW ─────────────────────────────────────────────
  if (step === "confirmation" && confirmedOrder) {
    return (
      <CustomerShell>
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-2xl border border-ink-100 p-6 md:p-8 shadow-sm text-center">
            {/* Header Badge */}
            <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon size={36} />
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900 mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">
              Your order{" "}
              <span className="font-mono font-bold text-ink-900">
                #{confirmedOrder.id}
              </span>{" "}
              has been received. Your products are being prepared by the
              selected nurseries.
            </p>

            {/* Order Meta Box */}
            <div className="bg-floria-soft-sand rounded-xl p-4 mb-6 border border-floria-border text-left space-y-3">
              <div className="flex flex-wrap justify-between items-center text-xs pb-3 border-b border-floria-border gap-2">
                <div>
                  <span className="text-ink-400 uppercase tracking-wider block text-[10px] font-bold">
                    Order ID
                  </span>
                  <span className="font-mono font-bold text-ink-900 text-sm">
                    #{confirmedOrder.id}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 uppercase tracking-wider block text-[10px] font-bold">
                    Placed On
                  </span>
                  <span className="font-semibold text-ink-900">
                    {confirmedOrder.createdAt}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400 uppercase tracking-wider block text-[10px] font-bold">
                    Payment Method
                  </span>
                  <span className="font-semibold text-forest-700">
                    {confirmedOrder.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Delivery Address Summary */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">
                  Deliver To
                </span>
                <p className="text-xs font-bold text-ink-900">
                  {confirmedOrder.address.full_name} (
                  {confirmedOrder.address.phone})
                </p>
                <p className="text-xs text-ink-600">
                  {confirmedOrder.address.line1}
                  {confirmedOrder.address.line2
                    ? `, ${confirmedOrder.address.line2}`
                    : ""}
                  , {confirmedOrder.address.city},{" "}
                  {confirmedOrder.address.state} -{" "}
                  {confirmedOrder.address.pincode}
                </p>
              </div>
            </div>

            {/* Nurseries Involved Summary */}
            <div className="text-left mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink-900 mb-3">
                Items Being Prepared ({confirmedOrder.nurseryGroups.length}{" "}
                {confirmedOrder.nurseryGroups.length === 1
                  ? "Nursery"
                  : "Nurseries"}
                )
              </h2>

              <div className="space-y-4">
                {confirmedOrder.nurseryGroups.map((group: any) => (
                  <div
                    key={group.sellerId}
                    className="border border-floria-border rounded-xl overflow-hidden bg-floria-linen"
                  >
                    <div className="bg-floria-soft-sand px-3 py-2 border-b border-floria-border flex items-center gap-2">
                      <LeafIcon size={14} className="text-forest-700" />
                      <span className="text-xs font-bold text-forest-800 uppercase tracking-wider">
                        {group.sellerName}
                      </span>
                    </div>
                    <div className="p-3 divide-y divide-floria-border">
                      {group.items.map((item: any) => {
                        const { listing, quantity } = item;
                        const { product, inventory, primary_image } = listing;
                        return (
                          <div
                            key={product.id}
                            className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded bg-floria-natural-sand overflow-hidden flex-shrink-0 border border-floria-border">
                                <Image
                                  src={primary_image?.url || "/floria-logo.png"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-ink-900">
                                  {product.name}
                                </p>
                                <p className="text-[10px] text-ink-400">
                                  Qty: {quantity}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-ink-900">
                              {formatINR(inventory.price_paise * quantity)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href={`/orders/${confirmedOrder.id}`}
                className="w-full flex items-center justify-center py-3 bg-forest-800 hover:bg-forest-900 !text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-800"
                style={{ color: "#ffffff" }}
              >
                View Order
              </Link>
              <Link
                href="/categories"
                className="w-full flex items-center justify-center py-3 border border-floria-border hover:bg-floria-soft-sand text-ink-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors focus:outline-none"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </CustomerShell>
    );
  }

  // ── 2. EMPTY CART CHECK ───────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <CustomerShell>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-ink-400 mb-6"
        >
          <Link href="/" className="hover:text-forest-700 transition-colors">
            Home
          </Link>
          <span aria-hidden="true" className="select-none text-ink-300">
            /
          </span>
          <Link
            href="/cart"
            className="hover:text-forest-700 transition-colors"
          >
            Cart
          </Link>
          <span aria-hidden="true" className="select-none text-ink-300">
            /
          </span>
          <span className="text-ink-700 font-medium">Checkout</span>
        </nav>

        <div className="text-center py-16 bg-floria-linen rounded-2xl border border-floria-border shadow-sm max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-forest-50 flex items-center justify-center mx-auto mb-4 text-forest-700">
            <WishlistIcon size={28} className="text-forest-700" />
          </div>
          <h1 className="text-lg font-bold text-ink-900 mb-1">
            Your cart is empty
          </h1>
          <p className="text-sm text-ink-500 mb-6">
            Add plants to your cart before proceeding to checkout.
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center justify-center px-6 py-3 bg-forest-800 hover:bg-forest-900 !text-white font-semibold text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-forest-800 shadow-sm"
            style={{ color: "#ffffff" }}
          >
            Browse Plants
          </Link>
        </div>
      </CustomerShell>
    );
  }

  // ── 3. MAIN CHECKOUT PAGE VIEW ─────────────────────────────────────────────
  return (
    <CustomerShell>
      <CheckoutLoader
        step={
          isPlacingOrder
            ? paymentMethod === "online"
              ? "processing-payment"
              : "creating-order"
            : "idle"
        }
      />
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-ink-400 mb-6"
      >
        <Link href="/" className="hover:text-forest-700 transition-colors">
          Home
        </Link>
        <span aria-hidden="true" className="select-none text-ink-300">
          /
        </span>
        <Link href="/cart" className="hover:text-forest-700 transition-colors">
          Cart
        </Link>
        <span aria-hidden="true" className="select-none text-ink-300">
          /
        </span>
        <span className="text-ink-700 font-medium">Checkout</span>
      </nav>

      <h1 className="font-serif text-3xl font-bold text-ink-900 mb-6">
        Checkout
      </h1>

      {/* Validation & Payment Error Alert */}
      {validationError && (
        <div className="mb-6 p-4.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-red-900">Payment Notice</p>
              <p className="mt-0.5 leading-relaxed font-medium">
                {validationError}
              </p>
            </div>
          </div>

          {paymentMethod === "online" && (
            <div className="pt-2.5 border-t border-red-200/80 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("cod");
                  setValidationError(null);
                }}
                className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                Switch to Cash on Delivery (COD)
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                className="px-4 py-2 border border-red-300 hover:bg-red-100/60 text-red-900 font-bold text-xs rounded-xl transition-colors"
              >
                Try Online Payment Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Out of Stock Warning */}
      {outOfStockItems.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold">Items out of stock</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Some items in your cart exceed available stock. Please update your
              cart before placing order.
            </p>
          </div>
          <Link
            href="/cart"
            className="px-3 py-1.5 bg-amber-700 text-white text-xs font-bold rounded-lg hover:bg-amber-800 transition-colors flex-shrink-0"
          >
            Edit Cart
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* ── LEFT COLUMN ───────────────────────────────────────────────────── */}
        <div className="space-y-8">
          {/* 1. DELIVERY ADDRESS SECTION */}
          <section
            aria-labelledby="section-address"
            className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-floria-border mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-forest-800 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h2
                  id="section-address"
                  className="font-serif text-lg font-bold text-ink-900"
                >
                  Delivery Address
                </h2>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="text-xs font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1 transition-colors"
              >
                + Add New Address
              </button>
            </div>

            <div className="space-y-3">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectAddress(addr.id)}
                    className={[
                      "p-4 rounded-xl border cursor-pointer transition-all relative",
                      isSelected
                        ? "border-forest-800 bg-floria-soft-sand ring-2 ring-forest-800/15"
                        : "border-floria-border hover:border-forest-400 bg-floria-linen",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="delivery_address"
                          checked={isSelected}
                          onChange={() => handleSelectAddress(addr.id)}
                          className="w-4 h-4 text-forest-800 focus:ring-forest-800 accent-forest-800"
                        />
                        <span className="font-sans text-sm font-bold text-ink-900">
                          {addr.full_name}
                        </span>
                        {addr.is_default && (
                          <span className="text-[10px] font-bold text-forest-800 bg-forest-100 px-1.5 py-0.5 rounded uppercase">
                            Default
                          </span>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(addr, e)}
                          className="text-ink-400 hover:text-forest-800 transition-colors"
                        >
                          Edit
                        </button>
                        {!addr.is_default && (
                          <button
                            type="button"
                            onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                            className="text-ink-400 hover:text-ink-700 transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAddress(addr.id, e)}
                          className="text-ink-300 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="pl-6 text-xs text-ink-600 space-y-0.5">
                      <p>
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                      </p>
                      <p>
                        {addr.city}, {addr.state} -{" "}
                        <span className="font-semibold text-ink-800">
                          {addr.pincode}
                        </span>
                      </p>
                      <p className="text-ink-500 font-medium">
                        Phone: {addr.phone}
                      </p>
                      {addr.instructions && (
                        <p className="text-[11px] text-ink-400 italic mt-1">
                          Note: &quot;{addr.instructions}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. ORDER REVIEW (GROUPED BY NURSERY) */}
          <section
            aria-labelledby="section-review"
            className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-4 border-b border-floria-border mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-forest-800 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h2
                  id="section-review"
                  className="font-serif text-lg font-bold text-ink-900"
                >
                  Order Review
                </h2>
              </div>
              <Link
                href="/cart"
                className="text-xs font-bold text-forest-800 hover:text-forest-950 transition-colors"
              >
                Edit Cart
              </Link>
            </div>

            <div className="space-y-4">
              {nurseryGroups.map((group) => (
                <div
                  key={group.sellerId}
                  className="border border-floria-border rounded-xl overflow-hidden bg-floria-linen"
                >
                  <div className="bg-floria-soft-sand px-3.5 py-2.5 border-b border-floria-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LeafIcon size={14} className="text-forest-700" />
                      <span className="text-xs font-bold text-forest-800 uppercase tracking-wider">
                        {group.sellerName}
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-400 font-medium">
                      {group.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                      {group.items.reduce((s, i) => s + i.quantity, 0) === 1
                        ? "item"
                        : "items"}
                    </span>
                  </div>

                  <div className="p-3.5 divide-y divide-floria-border">
                    {group.items.map((item) => {
                      const { listing, quantity } = item;
                      const { product, inventory, primary_image, pricing } =
                        listing;
                      const itemUnitPricePaise =
                        pricing?.sellingPricePaise ??
                        inventory.price_paise ??
                        0;
                      return (
                        <div
                          key={product.id}
                          className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3"
                        >
                          <div className="relative w-12 h-12 rounded-lg bg-floria-natural-sand overflow-hidden flex-shrink-0 border border-floria-border">
                            <Image
                              src={primary_image?.url || "/floria-logo.png"}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-ink-900 line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-ink-400">
                              Qty: {quantity} &bull;{" "}
                              {formatINR(itemUnitPricePaise)} each
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-bold text-ink-900">
                              {formatINR(itemUnitPricePaise * quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. PAYMENT METHOD SECTION */}
          <section
            aria-labelledby="section-payment"
            className="bg-floria-linen rounded-2xl border border-floria-border p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 pb-4 border-b border-floria-border mb-4">
              <span className="w-6 h-6 rounded-full bg-forest-800 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h2
                id="section-payment"
                className="font-serif text-lg font-bold text-ink-900"
              >
                Payment Method
              </h2>
            </div>

            <div className="space-y-3">
              {/* Online Payment Option */}
              <label
                className={[
                  "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                  paymentMethod === "online"
                    ? "border-forest-800 bg-floria-soft-sand ring-2 ring-forest-800/15"
                    : "border-floria-border hover:border-forest-400 bg-floria-linen",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="payment_option"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  className="w-4 h-4 text-forest-800 focus:ring-forest-800 accent-forest-800 mt-0.5"
                />
                <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0 text-forest-800">
                  <CreditCardIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ink-900">
                      Online Payment
                    </p>
                    <span className="text-[10px] font-bold text-forest-800 bg-forest-100 px-2 py-0.5 rounded uppercase">
                      Fast & Secure
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Pay using UPI, Credit / Debit Card, Net Banking, or Wallets
                  </p>
                </div>
              </label>

              {/* Cash on Delivery Option */}
              <label
                className={[
                  "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                  paymentMethod === "cod"
                    ? "border-forest-800 bg-floria-soft-sand ring-2 ring-forest-800/15"
                    : "border-floria-border hover:border-forest-400 bg-floria-linen",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="payment_option"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="w-4 h-4 text-forest-800 focus:ring-forest-800 accent-forest-800 mt-0.5"
                />
                <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0 text-forest-800">
                  <LeafIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink-900">
                    Cash on Delivery (COD)
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Pay in cash when your plants arrive at your doorstep
                  </p>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN: PRICE SUMMARY & FINAL CTA ──────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="p-5 bg-floria-linen rounded-2xl border border-floria-border shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-900 pb-3 border-b border-floria-border">
              Price Details
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Price ({totalItemsCount} items)</span>
                <span className="font-semibold text-ink-900">
                  {formatINR(subtotalPaise + discountPaise)}
                </span>
              </div>

              {discountPaise > 0 && (
                <div className="flex justify-between text-forest-700">
                  <span>Discount</span>
                  <span className="font-semibold">
                    −{formatINR(discountPaise)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-ink-600">
                <span>Delivery</span>
                <span
                  className={
                    estimatedDeliveryFeePaise === 0
                      ? "text-forest-700 font-semibold text-xs uppercase"
                      : "font-semibold text-ink-900"
                  }
                >
                  {estimatedDeliveryFeePaise === 0
                    ? "FREE (estimated)"
                    : `${formatINR(estimatedDeliveryFeePaise)} (estimated)`}
                </span>
              </div>

              {estimatedMaintenanceFeePaise > 0 && (
                <div className="flex justify-between text-ink-600">
                  <span className="flex items-center gap-1">
                    <span>Platform Maintenance Fee</span>
                    <span
                      className="text-[11px] text-forest-700 font-bold cursor-help"
                      title="Helps us operate the Floria marketplace and services."
                    >
                      ⓘ
                    </span>
                  </span>
                  <span className="font-semibold text-ink-900">
                    {formatINR(estimatedMaintenanceFeePaise)} (estimated)
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-floria-border text-ink-900 font-bold text-base">
                <span>Total</span>
                <span className="text-forest-800">
                  {formatINR(estimatedTotalPaise)} (estimated)
                </span>
              </div>
            </div>

            {/* Primary Order Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={outOfStockItems.length > 0 || isPlacingOrder}
                onClick={handlePlaceOrder}
                style={{ color: "#ffffff" }}
                className={[
                  "w-full py-3.5 font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2",
                  outOfStockItems.length > 0 || isPlacingOrder
                    ? "bg-floria-sand text-ink-400 cursor-not-allowed"
                    : "bg-terracotta-700 hover:bg-terracotta-800 !text-white focus:ring-terracotta-700 active:scale-[0.98]",
                ].join(" ")}
              >
                {isPlacingOrder
                  ? "Placing Order..."
                  : paymentMethod === "online"
                    ? "Continue to Payment"
                    : "Place Order"}
              </button>
            </div>

            <div className="flex items-center gap-1.5 justify-center text-[11px] text-ink-400 pt-1">
              <ShieldIcon size={14} className="text-forest-700" />
              <span>100% Encrypted Safe Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal Component */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        initialAddress={editingAddress}
      />
    </CustomerShell>
  );
}
