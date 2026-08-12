-- ============================================================
-- Floria — Initial Schema
-- Migration: 0001_initial_schema.sql
-- ============================================================
-- Execute via: supabase db push
-- Or: supabase migration up
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'customer',
  'seller',
  'operations',
  'admin'
);

CREATE TYPE seller_status AS ENUM (
  'pending',
  'approved',
  'suspended'
);

CREATE TYPE product_status AS ENUM (
  'draft',
  'active',
  'inactive',
  'deleted'
);

CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'paid',
  'seller_pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'packing',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refund_pending',
  'refunded'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE payment_provider AS ENUM (
  'razorpay',
  'cod'
);

-- ============================================================
-- USER PROFILES
-- One profile per Supabase auth user (auth.users)
-- role determines access — enforced server-side and via RLS
-- ============================================================

CREATE TABLE user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role NOT NULL DEFAULT 'customer',
  full_name    TEXT,
  phone        TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: user can read/update their own profile; admin can read all
CREATE POLICY "user_profiles: owner read" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles: owner update" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service-role bypass is implicit for server-side operations

CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- ============================================================
-- SELLER PROFILES (nurseries)
-- ============================================================

CREATE TABLE seller_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  business_name       TEXT NOT NULL,
  business_description TEXT,
  contact_phone       TEXT,
  contact_email       TEXT,
  address             TEXT,
  logo_url            TEXT,
  status              seller_status NOT NULL DEFAULT 'pending',
  is_active           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_seller_user UNIQUE (user_id)
);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Seller: read/update own profile
CREATE POLICY "seller_profiles: seller read own" ON seller_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "seller_profiles: seller update own" ON seller_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Public can read approved/active sellers (for storefront)
CREATE POLICY "seller_profiles: public read approved" ON seller_profiles
  FOR SELECT USING (status = 'approved' AND is_active = TRUE);

CREATE INDEX idx_seller_profiles_user ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_status ON seller_profiles(status, is_active);

-- ============================================================
-- SELLER DOCUMENTS
-- ============================================================

CREATE TABLE seller_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  document_type  TEXT NOT NULL,
  document_url   TEXT NOT NULL,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE seller_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_documents: seller read own" ON seller_documents
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_seller_docs_seller ON seller_documents(seller_id);

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  parent_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_category_slug UNIQUE (slug)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public can read active categories
CREATE POLICY "categories: public read active" ON categories
  FOR SELECT USING (is_active = TRUE);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_order ON categories(display_order);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL,
  description         TEXT,
  care_instructions   TEXT,
  status              product_status NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_slug UNIQUE (slug)
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can read active products
CREATE POLICY "products: public read active" ON products
  FOR SELECT USING (status = 'active');

-- Seller can read/write own products
CREATE POLICY "products: seller read own" ON products
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "products: seller insert own" ON products
  FOR INSERT WITH CHECK (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "products: seller update own" ON products
  FOR UPDATE USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================

CREATE TABLE product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  alt_text      TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images: public read" ON product_images
  FOR SELECT USING (TRUE); -- filtered via products join

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);

-- ============================================================
-- INVENTORY
-- Atomic updates required — use SELECT FOR UPDATE or DB functions
-- ============================================================

CREATE TABLE inventory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id           UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  price_paise         INTEGER NOT NULL CHECK (price_paise >= 0),
  stock_quantity      INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  sku                 TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_inventory_product UNIQUE (product_id)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory: public read" ON inventory
  FOR SELECT USING (TRUE);

CREATE POLICY "inventory: seller read own" ON inventory
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "inventory: seller update own" ON inventory
  FOR UPDATE USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_seller ON inventory(seller_id);

-- ============================================================
-- ADDRESSES
-- ============================================================

CREATE TABLE addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  label       TEXT,
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'India',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses: owner only" ON addresses
  USING (auth.uid() = user_id);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ============================================================
-- CARTS
-- One active cart per user; seller_id set when first item added
-- MVP: one nursery per cart
-- ============================================================

CREATE TABLE carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  seller_id   UUID REFERENCES seller_profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_cart_user UNIQUE (user_id)
);

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carts: owner only" ON carts
  USING (auth.uid() = user_id);

CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_cart_item UNIQUE (cart_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items: owner only" ON cart_items
  USING (
    cart_id IN (
      SELECT id FROM carts WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- ============================================================
-- ORDERS
-- Prices stored in paise (smallest INR unit).
-- Delivery address stored as immutable JSONB snapshot.
-- Commission rate stored at time of order (configurable — not finalized).
-- ============================================================

CREATE TABLE orders (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                  UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  seller_id                    UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  status                       order_status NOT NULL DEFAULT 'pending_payment',
  delivery_address_snapshot    JSONB NOT NULL, -- immutable snapshot of address at checkout
  subtotal_paise               INTEGER NOT NULL CHECK (subtotal_paise >= 0),
  delivery_fee_paise           INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  commission_rate              NUMERIC(5, 4) NOT NULL, -- e.g. 0.1200 for 12%
  commission_paise             INTEGER NOT NULL CHECK (commission_paise >= 0),
  total_paise                  INTEGER NOT NULL CHECK (total_paise >= 0),
  notes                        TEXT,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customer can read own orders
CREATE POLICY "orders: customer read own" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

-- Seller can read orders for their nursery
CREATE POLICY "orders: seller read own" ON orders
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================================
-- ORDER ITEMS (immutable snapshots)
-- ============================================================

CREATE TABLE order_items (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                     UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id                   UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name_snapshot        TEXT NOT NULL,
  seller_id_snapshot           UUID NOT NULL,
  unit_price_paise_snapshot    INTEGER NOT NULL CHECK (unit_price_paise_snapshot >= 0),
  quantity                     INTEGER NOT NULL CHECK (quantity >= 1),
  line_total_paise             INTEGER NOT NULL CHECK (line_total_paise >= 0),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items: customer read own" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "order_items: seller read own" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE seller_id IN (
        SELECT id FROM seller_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- PAYMENTS
-- Never trust browser payment success — verified via webhook.
-- Idempotent: provider_payment_id is unique.
-- ============================================================

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider            payment_provider NOT NULL,
  provider_order_id   TEXT,
  provider_payment_id TEXT,
  amount_paise        INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency            TEXT NOT NULL DEFAULT 'INR',
  status              payment_status NOT NULL DEFAULT 'pending',
  webhook_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_payment_provider_id UNIQUE (provider_payment_id)
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Customers can see their own payment records
CREATE POLICY "payments: customer read own" ON payments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================
-- ORDER EVENTS (audit trail for order transitions)
-- ============================================================

CREATE TABLE order_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  actor_role   TEXT NOT NULL, -- denormalized for auditability
  event_type   TEXT NOT NULL,
  from_status  order_status,
  to_status    order_status NOT NULL,
  notes        TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_events: customer read own" ON order_events
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "order_events: seller read own" ON order_events
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE seller_id IN (
        SELECT id FROM seller_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX idx_order_events_order ON order_events(order_id);
CREATE INDEX idx_order_events_created ON order_events(created_at DESC);

-- ============================================================
-- AUDIT RECORDS (general audit log for admin/critical actions)
-- ============================================================

CREATE TABLE audit_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  actor_role   TEXT NOT NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    UUID,
  metadata     JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_records ENABLE ROW LEVEL SECURITY;

-- Only admins/service role can read audit records
-- Admin policy applied via service-role or future admin RLS check
-- ponytail: admin RLS policy added when admin role check is wired in

CREATE INDEX idx_audit_records_actor ON audit_records(actor_id);
CREATE INDEX idx_audit_records_entity ON audit_records(entity_type, entity_id);
CREATE INDEX idx_audit_records_created ON audit_records(created_at DESC);

-- ============================================================
-- COMMISSION CONFIG
-- Rate is configurable — commercial rate NOT finalized.
-- Historical orders store the applied rate at time of order.
-- ============================================================

CREATE TABLE commission_config (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate           NUMERIC(5, 4) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE commission_config ENABLE ROW LEVEL SECURITY;
-- Only admins can manage commission; accessed via service-role for now

-- ============================================================
-- UPDATED_AT trigger function (reusable)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_seller_profiles_updated_at
  BEFORE UPDATE ON seller_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
