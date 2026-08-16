// =============================================================
// Floria — Shared TypeScript Types
// Source of truth for all domain entities.
// Keep in sync with supabase/migrations/ column definitions.
// =============================================================

// ------------------------------------------------------------------
// Primitives
// ------------------------------------------------------------------

export type UUID = string;
export type Timestamp = string; // ISO-8601

// ------------------------------------------------------------------
// Roles
// ------------------------------------------------------------------

export type UserRole = "customer" | "seller" | "operations" | "admin";

// ------------------------------------------------------------------
// Order state machine
// Must match supabase/migrations/0001_initial_schema.sql enum
// ------------------------------------------------------------------

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "seller_pending"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "packing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refund_pending"
  | "refunded";

// ------------------------------------------------------------------
// Users
// ------------------------------------------------------------------

export interface UserProfile {
  id: UUID;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ------------------------------------------------------------------
// Customer
// ------------------------------------------------------------------

export interface CustomerProfile {
  id: UUID;
  user_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ------------------------------------------------------------------
// Seller (Nursery)
// ------------------------------------------------------------------

export type SellerStatus = "pending" | "approved" | "suspended" | "rejected";

export interface SellerProfile {
  id: UUID;
  user_id: UUID;
  business_name: string;
  business_description: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  logo_url: string | null;
  status: SellerStatus;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SellerDocument {
  id: UUID;
  seller_id: UUID;
  document_type: string;
  document_url: string;
  uploaded_at: Timestamp;
}

// ------------------------------------------------------------------
// Categories
// ------------------------------------------------------------------

export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: UUID | null;
  display_order: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ------------------------------------------------------------------
// Products & Inventory
// ------------------------------------------------------------------

export type ProductStatus = "draft" | "active" | "inactive" | "deleted";

export interface Product {
  id: UUID;
  seller_id: UUID;
  category_id: UUID | null;
  name: string;
  slug: string;
  description: string | null;
  care_instructions: string | null;
  status: ProductStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ProductImage {
  id: UUID;
  product_id: UUID;
  url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: Timestamp;
}

export interface Inventory {
  id: UUID;
  product_id: UUID;
  seller_id: UUID;
  price_paise: number; // price in smallest currency unit (paise for INR)
  stock_quantity: number;
  low_stock_threshold: number;
  sku: string | null;
  updated_at: Timestamp;
}

export interface CustomerProductPricingDTO {
  sellingPricePaise: number;
  originalPricePaise?: number | null;
  discountAmountPaise?: number | null;
  discountPercentage?: number | null;
  isDiscounted: boolean;
  isFreeDelivery: boolean;
  deliverySavingsPaise?: number | null;
}

/** Convenience type joining Product + primary image + inventory */
export interface ProductListing {
  product: Product;
  inventory: Inventory;
  primary_image: ProductImage | null;
  seller: Pick<SellerProfile, "id" | "business_name"> & { is_verified?: boolean; rating?: number; review_count?: number };
  category: Pick<Category, "id" | "name" | "slug"> | null;
  rating_summary?: {
    review_count: number;
    avg_rating: number;
    bayesian_rating: number;
    wilson_lower_bound: number;
  } | null;
  pricing?: CustomerProductPricingDTO | null;
}

// ------------------------------------------------------------------
// Addresses
// ------------------------------------------------------------------

export interface Address {
  id: UUID;
  user_id: UUID;
  label: string | null; // "Home", "Work" etc.
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ------------------------------------------------------------------
// Cart
// ------------------------------------------------------------------

export interface Cart {
  id: UUID;
  user_id: UUID;
  seller_id: UUID | null; // null when empty; set when first item added
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CartItem {
  id: UUID;
  cart_id: UUID;
  product_id: UUID;
  quantity: number;
  added_at: Timestamp;
}

// ------------------------------------------------------------------
// Orders
// ------------------------------------------------------------------

export interface Order {
  id: UUID;
  customer_id: UUID;
  seller_id: UUID;
  status: OrderStatus;
  delivery_address_snapshot: Address; // immutable JSON snapshot
  subtotal_paise: number;
  delivery_fee_paise: number;
  commission_rate: number; // e.g. 0.12 for 12%
  commission_paise: number;
  total_paise: number;
  notes: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  product_id: UUID;
  // Immutable snapshots at time of order
  product_name_snapshot: string;
  seller_id_snapshot: UUID;
  unit_price_paise_snapshot: number;
  quantity: number;
  line_total_paise: number;
  created_at: Timestamp;
}

// ------------------------------------------------------------------
// Payments
// ------------------------------------------------------------------

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface Payment {
  id: UUID;
  order_id: UUID;
  provider: "razorpay" | "cod";
  provider_order_id: string | null;
  provider_payment_id: string | null;
  amount_paise: number;
  currency: string; // "INR"
  status: PaymentStatus;
  webhook_verified: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ------------------------------------------------------------------
// Order Events / Audit
// ------------------------------------------------------------------

export interface OrderEvent {
  id: UUID;
  order_id: UUID;
  actor_id: UUID | null; // null for system events
  actor_role: UserRole | "system";
  event_type: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Timestamp;
}

export interface AuditRecord {
  id: UUID;
  actor_id: UUID | null;
  actor_role: UserRole | "system";
  action: string;
  entity_type: string;
  entity_id: UUID | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Timestamp;
}

// ------------------------------------------------------------------
// Commission / Settlement (configurable — rate NOT finalized)
// ------------------------------------------------------------------

export interface CommissionConfig {
  id: UUID;
  rate: number; // decimal e.g. 0.12 — configurable until finalized
  effective_from: Timestamp;
  created_by: UUID;
  notes: string | null;
  created_at: Timestamp;
}

// ------------------------------------------------------------------
// Financial Transparency & Calculation Interfaces (Phase 3.17.1)
// ------------------------------------------------------------------

export interface AdminProductFinancialCalculation {
  product: {
    id: UUID;
    name: string;
    sellerId: UUID;
    sellerName: string;
  };
  pricing: {
    sellerBasePricePaise: number;
    floriaProfitRate: number; // e.g. 2.0
    floriaProfitPaise: number;
    deliveryRecoveryPaise: number;
    customerProductPricePaise: number;
    isFreeDeliveryEligible: boolean;
  };
  commission: {
    rate: number; // percentage e.g. 12.0
    amountPaise: number;
  };
  sellerEarnings: {
    basePricePaise: number;
    commissionPaise: number;
    netPaise: number;
  };
  customerCharges: {
    productPricePaise: number;
    deliveryFeePaise: number; // 0 if not configured
    taxPaise: number; // 0 if not configured
    discountPaise: number;
    totalPaise: number;
  };
  currency: string;
}

export interface NurseryOrderFinancialAttribution {
  sellerId: UUID;
  sellerName: string;
  items: Array<{
    productId: UUID;
    productName: string;
    unitPricePaise: number;
    quantity: number;
    lineTotalPaise: number;
    commissionPaise: number;
    sellerNetPaise: number;
  }>;
  sellerGrossPaise: number;
  commissionRate: number;
  commissionPaise: number;
  sellerNetPaise: number;
}

export interface AdminOrderFinancialBreakdown {
  masterOrderId: UUID;
  customerName: string;
  customerTotalPaise: number;
  subtotalPaise: number;
  maintenanceFeePaise: number;
  deliveryFeePaise: number;
  deliveryFeeReason?: DeliveryFeeReason;
  taxPaise: number;
  discountPaise: number;
  totalPlatformCommissionPaise: number;
  totalFloriaProfitPaise?: number;
  totalDeliveryRecoveryPaise?: number;
  nurseryBreakdown: NurseryOrderFinancialAttribution[];
  currency: string;
  createdAt: Timestamp;
}

// ------------------------------------------------------------------
// Financial Settings & Unified Pricing Engine Interfaces (Phase 3.17.3)
// ------------------------------------------------------------------

export interface FinancialSettings {
  sellerCommissionRate: number; // e.g. 12.0 for 12%
  floriaProfitRate: number; // e.g. 2.0 for 2%
  platformMaintenanceFeePaise: number; // e.g. 1000 for ₹10.00
  freeDeliveryThresholdPaise: number; // e.g. 59900 for ₹599.00
  freeDeliveryRecoveryPaise: number; // e.g. 2000 for ₹20.00
}

export interface ProductPricingCalculation {
  sellerBasePricePaise: number;
  sellerCommissionRate: number;
  sellerCommissionPaise: number;
  sellerNetPaise: number;
  floriaProfitRate: number;
  floriaProfitPaise: number;
  deliveryRecoveryPaise: number;
  customerProductPricePaise: number;
  isFreeDeliveryEligible: boolean;
  freeDeliveryThresholdPaise: number;
}

// ------------------------------------------------------------------
// Delivery Fee Engine & Policy Interfaces (Phase 3.17.2)
// ------------------------------------------------------------------

export type DeliveryFeeReason =
  | "FREE_DELIVERY_THRESHOLD"
  | "PAID_BELOW_THRESHOLD"
  | "FREE_DELIVERY_PROMOTION"
  | "FREE_DELIVERY_ADMIN"
  | "DELIVERY_DISABLED";

export interface DeliverySettings {
  deliveryEnabled: boolean;
  baseDeliveryFeePaise: number; // e.g. 4000 for ₹40.00
  freeDeliveryEnabled: boolean;
  freeDeliveryThresholdPaise: number; // e.g. 99900 for ₹999.00
  masterOrderDeliveryMode: "master_order_single" | "per_nursery";
}

export interface DeliveryCalculationResult {
  deliveryFeePaise: number;
  isFreeDelivery: boolean;
  reason: DeliveryFeeReason;
  thresholdPaise: number;
  eligibleSubtotalPaise: number;
  baseDeliveryFeePaise: number;
}
