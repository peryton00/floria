-- ============================================================
-- Floria — Seller Order Fulfillments Schema & RLS
-- Migration: 0006_seller_order_fulfillments.sql
-- ============================================================

CREATE TYPE seller_fulfillment_status AS ENUM (
  'Order Placed',
  'Nursery Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Picked Up',
  'Cancelled'
);

CREATE TABLE IF NOT EXISTS seller_order_fulfillments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id    UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE RESTRICT,
  status       seller_fulfillment_status NOT NULL DEFAULT 'Order Placed',
  confirmed_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at     TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_seller_order_fulfillment UNIQUE (order_id, seller_id)
);

ALTER TABLE seller_order_fulfillments ENABLE ROW LEVEL SECURITY;

-- SELECT: seller sees own fulfillment records; customer sees fulfillment records for own orders
CREATE POLICY "seller_order_fulfillments: seller read own" ON seller_order_fulfillments
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "seller_order_fulfillments: customer read own" ON seller_order_fulfillments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- INSERT: created upon order placement (system/checkout or authenticated seller)
CREATE POLICY "seller_order_fulfillments: seller insert own" ON seller_order_fulfillments
  FOR INSERT WITH CHECK (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

-- UPDATE: seller updates own fulfillment status
CREATE POLICY "seller_order_fulfillments: seller update own" ON seller_order_fulfillments
  FOR UPDATE USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_seller_fulfillments_order ON seller_order_fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_fulfillments_seller ON seller_order_fulfillments(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_fulfillments_status ON seller_order_fulfillments(status);
