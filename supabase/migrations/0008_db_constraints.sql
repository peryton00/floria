-- ============================================================
-- Floria — Database-Level Integrity Constraints
-- Migration: 0008_db_constraints.sql
-- Enforce business rules at the DB layer as a last line of defense.
-- Server-side validation is the first defense; DB constraints catch bypasses.
-- ============================================================

-- Inventory: price and stock must be non-negative
ALTER TABLE inventory
  ADD CONSTRAINT chk_inventory_price_paise
    CHECK (price_paise >= 0),
  ADD CONSTRAINT chk_inventory_stock_quantity
    CHECK (stock_quantity >= 0),
  ADD CONSTRAINT chk_inventory_low_stock_threshold
    CHECK (low_stock_threshold >= 0);

-- order_items: quantity must be positive (> 0)
-- Also prevents a client-side quantity of 0 sneaking into the DB.
ALTER TABLE order_items
  ADD CONSTRAINT chk_order_items_quantity
    CHECK (quantity > 0),
  ADD CONSTRAINT chk_order_items_unit_price
    CHECK (unit_price_paise_snapshot >= 0);

-- orders: totals must be non-negative
ALTER TABLE orders
  ADD CONSTRAINT chk_orders_subtotal
    CHECK (subtotal_paise >= 0);
