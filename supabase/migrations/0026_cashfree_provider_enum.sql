-- ============================================================================
-- FLORIA MIGRATION 0026: ADD CASHFREE TO PAYMENT_PROVIDER ENUM
-- ============================================================================
-- PostgreSQL requires this specific syntax to add a new value to an existing enum.
-- The IF NOT EXISTS guard (pg >= 14) prevents duplicate-value errors on re-run.

ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'cashfree';
