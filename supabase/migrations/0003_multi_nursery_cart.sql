-- ============================================================
-- Floria — Multi-Nursery Cart Constraint Fix
-- Migration: 0003_multi_nursery_cart.sql
-- ============================================================
-- Drops the single-nursery seller_id column constraint from carts table.
-- Products in cart_items reference products(id), allowing products from
-- multiple distinct nurseries to coexist in ONE cart per user.

ALTER TABLE carts DROP COLUMN IF EXISTS seller_id;
