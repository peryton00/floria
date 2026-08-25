-- Floria Stage 12 Migration — Notification Idempotency Partial Unique Index
-- Ensures atomic database-level deduplication for notifications with source_type and source_id.

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_source_unique
ON notifications (user_id, source_type, source_id)
WHERE source_type IS NOT NULL AND source_id IS NOT NULL;
