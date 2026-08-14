-- ============================================================
-- Floria — Wishlist Schema
-- Migration: 0002_wishlists.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_wishlist_user UNIQUE (user_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlists: owner all" ON wishlists
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id  UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_wishlist_item UNIQUE (wishlist_id, product_id)
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_items: owner all" ON wishlist_items
  USING (
    wishlist_id IN (
      SELECT id FROM wishlists WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM wishlists WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product ON wishlist_items(product_id);
