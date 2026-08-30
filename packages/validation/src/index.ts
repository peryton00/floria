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
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers and hyphens",
    )
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

export type CreatePaymentSessionInput = z.infer<
  typeof createPaymentSessionSchema
>;

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

// ------------------------------------------------------------------
// Seller Authentication & Onboarding
// ------------------------------------------------------------------

export const sellerLoginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or Seller ID is required")
    .max(255),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type SellerLoginInput = z.infer<typeof sellerLoginSchema>;

export const sellerApplicationSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be 50 characters or less")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  email: z
    .string()
    .email("Valid email address is required")
    .max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or less"),
  business_name: z
    .string()
    .min(2, "Nursery / Business name must be at least 2 characters")
    .max(200),
  business_type: z.string().default("Botanical Nursery"),
  business_description: z.string().max(2000).optional(),
  contact_phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian phone number"),
  address: z
    .string()
    .min(5, "Nursery location / address is required")
    .max(500),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postal_code: z
    .string()
    .regex(/^\d{6}$/, "PIN code must be 6 digits"),
  gst_number: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format")
    .optional()
    .or(z.literal("")),
  settlement_account: z
    .object({
      bank_account_number: z.string().optional(),
      ifsc_code: z.string().optional(),
      account_holder_name: z.string().optional(),
    })
    .optional(),
});

export type SellerApplicationInput = z.infer<typeof sellerApplicationSchema>;

export const sellerForgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or Seller ID is required")
    .max(255),
});

export type SellerForgotPasswordInput = z.infer<typeof sellerForgotPasswordSchema>;

export const sellerResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export type SellerResetPasswordInput = z.infer<typeof sellerResetPasswordSchema>;

export const adminSellerReviewSchema = z.object({
  action: z.enum(["approve", "reject", "request_correction"]),
  reason: z.string().max(1000).optional(),
});

export type AdminSellerReviewInput = z.infer<typeof adminSellerReviewSchema>;

