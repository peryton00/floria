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

/** Convenience type joining Product + primary image + inventory */
export interface ProductListing {
  product: Product;
  inventory: Inventory;
  primary_image: ProductImage | null;
  seller: Pick<SellerProfile, "id" | "business_name">;
  category: Pick<Category, "id" | "name" | "slug"> | null;
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
