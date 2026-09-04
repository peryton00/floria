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

export type UserRole = "customer" | "seller" | "operations" | "admin" | "delivery_partner" | "courier";

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

export type SellerStatus =
  | "application_incomplete"
  | "application_submitted"
  | "under_review"
  | "needs_correction"
  | "rejected"
  | "approved"
  | "active"
  | "suspended"
  | "deactivated"
  | "pending";

export type BusinessType =
  | "nursery"
  | "plant_shop"
  | "garden_centre"
  | "landscaping"
  | "gardening_supplier"
  | "other";

export type PreferredContactMethod = "phone" | "whatsapp" | "email";

export interface SellerProfile {
  id: UUID;
  user_id: UUID;
  public_seller_id?: string;
  username?: string | null;
  business_name: string;
  business_description: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  logo_url: string | null;
  logo_asset_id?: string | null;
  logo_variants?: Record<string, string>;
  banner_asset_id?: string | null;
  banner_url?: string | null;
  banner_variants?: Record<string, string>;
  status: SellerStatus;
  is_active: boolean;
  gst_number?: string | null;
  gst_status?: string | null;

  // Nursery Onboarding & Profile Attributes
  business_type?: BusinessType | string | null;
  owner_name?: string | null;
  year_established?: number | null;

  primary_contact_person?: string | null;
  whatsapp_number?: string | null;
  whatsapp_available?: boolean;
  alternate_phone?: string | null;
  preferred_contact_method?: PreferredContactMethod | string | null;

  address_line1?: string | null;
  address_line2?: string | null;
  landmark?: string | null;
  locality?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  nursery_category?: string | null;
  plant_categories?: string[] | null;
  specializations?: string[] | null;
  nursery_size?: string | null;
  years_experience?: number | null;
  short_description?: string | null;
  detailed_description?: string | null;
  seasonal_availability?: string | null;
  bulk_orders_supported?: boolean;
  custom_requirements_supported?: boolean;
  landscaping_services?: boolean;
  gardening_services?: boolean;

  is_profile_completed?: boolean;
  onboarding_step?: number;
  profile_completed_at?: Timestamp | null;

  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SellerApplication {
  id: UUID;
  seller_id?: UUID | null;
  user_id?: UUID | null;
  username: string;
  email: string;
  business_name: string;
  business_type?: string | null;
  business_description?: string | null;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  gst_number?: string | null;
  gst_legal_name?: string | null;
  gst_status?: string | null;
  settlement_account?: {
    bank_account_number?: string;
    ifsc_code?: string;
    account_holder_name?: string;
  } | null;
  submitted_documents?: Array<{
    document_type: string;
    file_name: string;
    file_url: string;
  }>;
  status: SellerStatus;
  rejection_reason?: string | null;
  correction_reason?: string | null;
  reviewed_at?: Timestamp | null;
  reviewed_by?: UUID | null;
  submitted_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SellerCredential {
  id: UUID;
  seller_id: UUID;
  user_id?: UUID | null;
  public_seller_id: string;
  username: string;
  email: string;
  failed_login_attempts: number;
  locked_until?: Timestamp | null;
  password_updated_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SellerAuthResponse {
  user: {
    id: UUID;
    email: string;
    role: "seller" | "admin" | "super_admin";
    sellerId: UUID;
    publicSellerId: string;
    username: string;
    sellerStatus: SellerStatus;
  };
  seller: SellerProfile;
  token: string;
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
  banner_asset_id?: string | null;
  banner_url?: string | null;
  banner_variants?: Record<string, string>;
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
  customerPricePaise: number;
  sellingPricePaise: number;
  originalPricePaise?: number | null;
  compareAtPricePaise?: number | null;
  discountAmountPaise?: number | null;
  discountPercentage?: number | null;
  isDiscounted: boolean;
  isFreeDelivery: boolean;
  isOverride?: boolean;
  pricingPolicyVersion?: number;
  deliverySavingsPaise?: number | null;
}

/** Convenience type joining Product + primary image + inventory */
export interface ProductListing {
  product: Product;
  inventory: Inventory;
  primary_image: ProductImage | null;
  seller: Pick<SellerProfile, "id" | "business_name"> & {
    is_verified?: boolean;
    rating?: number;
    review_count?: number;
  };
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
  | "paid"
  | "failed"
  | "cancelled"
  | "expired"
  | "refund_pending"
  | "partially_refunded"
  | "refunded";

export interface Payment {
  id: UUID;
  order_id: UUID;
  customer_id?: UUID;
  payment_reference?: string;
  provider: "cashfree" | "cod" | "online";
  cf_order_id?: string | null;
  cf_payment_id?: string | null;
  payment_session_id?: string | null;
  provider_order_id?: string | null;
  provider_payment_id?: string | null;
  amount_paise: number;
  currency: string; // "INR"
  status: PaymentStatus;
  webhook_verified: boolean;
  raw_provider_response?: Record<string, unknown>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CashfreeCheckoutSession {
  paymentSessionId: string;
  cfOrderId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  environment: "SANDBOX" | "PRODUCTION";
}

export interface PaymentRefundRequest {
  paymentId: string;
  amountPaise: number;
  reason?: string;
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
// Versioned Pricing Policy & Recalculation Engine (Phase 3.23)
// ------------------------------------------------------------------

export type PricingPolicyStatus =
  "draft" | "preparing" | "ready" | "active" | "archived" | "failed";

export interface PricingPolicyVersion {
  id: string;
  versionNumber: number;
  sellerCommissionRate: number; // e.g. 12.0 for 12%
  floriaProfitRate: number; // e.g. 2.0 for 2%
  platformMaintenanceFeePaise: number; // e.g. 1000 for ₹10.00
  freeDeliveryThresholdPaise: number; // e.g. 59900 for ₹599.00
  freeDeliveryRecoveryPaise: number; // e.g. 2000 for ₹20.00
  status: PricingPolicyStatus;
  notes?: string | null;
  createdBy?: string | null;
  activatedAt?: Timestamp | null;
  archivedAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RecalculationJobStatus =
  "queued" | "in_progress" | "completed" | "failed" | "cancelled";

export interface PricingRecalculationJob {
  id: string;
  policyVersionId: string;
  status: RecalculationJobStatus;
  totalListings: number;
  processedListings: number;
  failedListings: number;
  batchSize: number;
  currentBatch: number;
  totalBatches: number;
  errorMessage?: string | null;
  createdBy?: string | null;
  startedAt?: Timestamp | null;
  completedAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductPricingReadModel {
  id: string;
  productId: string;
  sellerId: string;
  policyVersionId: string;
  sellerBasePricePaise: number;
  floriaProfitRate: number;
  floriaProfitPaise: number;
  deliveryRecoveryPaise: number;
  customerProductPricePaise: number;
  isFreeDeliveryEligible: boolean;
  sellerCommissionRate: number;
  sellerCommissionPaise: number;
  sellerNetPaise: number;
  isOverride: boolean;
  overrideReason?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductPricingOverride {
  id: string;
  productId: string;
  policyVersionId?: string | null;
  customCustomerPricePaise: number;
  reason: string;
  createdBy?: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PolicyImpactPreview {
  policyVersionId?: string;
  affectedListingsCount: number;
  averageCustomerPriceChangePaise: number;
  freeDeliveryEligibleListingsCount: number;
  priceIncreaseCount: number;
  priceDecreaseCount: number;
  priceUnchangedCount: number;
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

// ------------------------------------------------------------------
// Delivery Assignments & Logistics (Phase 5B.1)
// ------------------------------------------------------------------

export type DeliveryAssignmentStatus =
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "reassigned"
  | "failed";

export interface DeliveryAssignment {
  id: UUID;
  order_id: string;
  assigned_to: string;
  delivery_partner_id?: UUID | null;
  status: DeliveryAssignmentStatus;
  assigned_at: Timestamp;
  picked_up_at?: Timestamp | null;
  out_for_delivery_at?: Timestamp | null;
  delivered_at?: Timestamp | null;
  pod_asset_id?: UUID | null;
  recipient_name?: string | null;
  pod_notes?: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DeliveryListParams {
  status?: DeliveryAssignmentStatus | "all" | string;
  search?: string;
}

export interface UpdateDeliveryStatusPayload {
  status: DeliveryAssignmentStatus;
}

export interface CompleteDeliveryPayload {
  podAssetId: UUID;
  recipientName?: string;
  notes?: string;
}

export interface DeliveryPodDetails {
  signedUrl: string;
  expiresAt: string;
  assetId: UUID;
  recipientName?: string | null;
  notes?: string | null;
  deliveredAt?: Timestamp | null;
}

// ------------------------------------------------------------------
// Delivery Partner Ecosystem (Phase 6)
// ------------------------------------------------------------------

export type DeliveryApplicationStatus = "pending" | "approved" | "rejected";
export type DeliveryPartnerStatus = "active" | "suspended" | "inactive";

export interface DeliveryPartnerApplication {
  id: UUID;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  vehicle_type: string;
  vehicle_number: string;
  driving_license: string;
  status: DeliveryApplicationStatus;
  rejection_reason?: string | null;
  submitted_documents?: any[];
  reviewed_by?: UUID | null;
  reviewed_at?: Timestamp | null;
  submitted_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DeliveryPartner {
  id: UUID;
  user_id?: UUID | null;
  public_partner_id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  vehicle_type: string;
  vehicle_number: string;
  driving_license: string;
  status: DeliveryPartnerStatus;
  on_duty: boolean;
  active_delivery_id?: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SubmitDeliveryApplicationInput {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  vehicle_type: string;
  vehicle_number: string;
  driving_license: string;
}

export interface ActivateDeliveryPartnerInput {
  token: string;
  password: string;
}

export type DeliveryEarningStatus = "pending" | "available" | "paid";

export interface DeliveryEarning {
  id: UUID;
  partner_id: UUID;
  delivery_id: UUID;
  order_id: string;
  base_earning_paise: number;
  extra_items_earning_paise: number;
  total_earning_paise: number;
  status: DeliveryEarningStatus;
  payout_id?: UUID | null;
  metadata?: Record<string, any>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type DeliveryPayoutStatus = "scheduled" | "processing" | "paid" | "failed";

export interface DeliveryPayout {
  id: UUID;
  partner_id: UUID;
  amount_paise: number;
  status: DeliveryPayoutStatus;
  period_start?: Timestamp | null;
  period_end?: Timestamp | null;
  paid_at: Timestamp;
  created_at: Timestamp;
}

// ------------------------------------------------------------------
// Phase P1: Device Tokens & Dynamic Delivery Rate Card
// ------------------------------------------------------------------

export type DevicePlatform = "android" | "ios" | "web";

export interface DeviceToken {
  id: UUID;
  user_id: UUID;
  partner_id?: UUID | null;
  token: string;
  platform: DevicePlatform;
  device_info?: Record<string, any>;
  is_active: boolean;
  last_used_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface RegisterDeviceTokenInput {
  token: string;
  platform: DevicePlatform;
  device_info?: Record<string, any>;
}

export type RateCardStatus = "draft" | "active" | "inactive" | "superseded";

export interface DeliveryRateCard {
  id: UUID;
  name: string;
  base_earning_paise: number;
  currency: string;
  effective_from: Timestamp;
  effective_to?: Timestamp | null;
  status: RateCardStatus;
  metadata?: Record<string, any>;
  created_by?: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateDeliveryRateCardInput {
  name: string;
  base_earning_paise: number;
  currency?: string;
  effective_from?: Timestamp;
  effective_to?: Timestamp | null;
  status?: RateCardStatus;
  metadata?: Record<string, any>;
}

export interface UpdateDeliveryRateCardInput {
  name?: string;
  base_earning_paise?: number;
  effective_to?: Timestamp | null;
  status?: RateCardStatus;
  metadata?: Record<string, any>;
}
