import { z } from "zod";

// =============================================================
// Floria — Shared Validation Schemas (Zod)
// Server-side validation. Never trust client input.
// =============================================================

// ------------------------------------------------------------------
// Address
// ------------------------------------------------------------------

export const addressSchema = z.object({
  label: z.string().max(50).optional(),
  full_name: z.string().min(1).max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/, "Must be a 6-digit Indian PIN code"),
  country: z.string().default("India"),
  is_default: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ------------------------------------------------------------------
// Cart operations
// ------------------------------------------------------------------

export const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

// ------------------------------------------------------------------
// Checkout
// ------------------------------------------------------------------

export const checkoutSchema = z.object({
  cart_id: z.string().uuid(),
  delivery_address_id: z.string().uuid(),
  // payment_method resolved server-side from Cashfree response
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ------------------------------------------------------------------
// Product (seller)
// ------------------------------------------------------------------

export const productSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens")
    .min(1)
    .max(200),
  description: z.string().max(5000).optional(),
  care_instructions: z.string().max(2000).optional(),
  status: z.enum(["draft", "active", "inactive"]),
});

export type ProductInput = z.infer<typeof productSchema>;

export const inventorySchema = z.object({
  price_paise: z
    .number()
    .int()
    .min(1, "Price must be at least ₹0.01")
    .max(100_000_00, "Price must be under ₹1,00,000"),
  stock_quantity: z.number().int().min(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  sku: z.string().max(100).optional(),
});

export type InventoryInput = z.infer<typeof inventorySchema>;

// ------------------------------------------------------------------
// Order transitions (seller)
// ------------------------------------------------------------------

export const orderTransitionSchema = z.object({
  order_id: z.string().uuid(),
  to_status: z.enum([
    "accepted",
    "preparing",
    "ready_for_pickup",
    "picked_up",
    "packing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
  notes: z.string().max(500).optional(),
});

export type OrderTransitionInput = z.infer<typeof orderTransitionSchema>;

// ------------------------------------------------------------------
// Webhook & Session Payloads (Cashfree) — validated server-side only
// ------------------------------------------------------------------

export const createPaymentSessionSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

export type CreatePaymentSessionInput = z.infer<typeof createPaymentSessionSchema>;

export const cashfreeWebhookBodySchema = z.object({
  type: z.string().optional(),
  event_time: z.string().optional(),
  data: z
    .object({
      order: z
        .object({
          order_id: z.string(),
          order_amount: z.number().or(z.string()).optional(),
          order_currency: z.string().optional(),
          order_status: z.string().optional(),
        })
        .optional(),
      payment: z
        .object({
          cf_payment_id: z.number().or(z.string()).optional(),
          payment_status: z.string().optional(),
          payment_amount: z.number().or(z.string()).optional(),
          payment_currency: z.string().optional(),
          payment_message: z.string().optional(),
          payment_time: z.string().optional(),
          bank_reference: z.string().optional(),
          auth_id: z.string().optional(),
          payment_method: z.any().optional(),
        })
        .optional(),
      refund: z
        .object({
          cf_refund_id: z.string().optional(),
          refund_id: z.string().optional(),
          refund_status: z.string().optional(),
          refund_amount: z.number().or(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type CashfreeWebhookBody = z.infer<typeof cashfreeWebhookBodySchema>;
