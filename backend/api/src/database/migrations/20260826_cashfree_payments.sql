-- Floria Backend API Migration: Cashfree Payments Columns
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cf_order_id VARCHAR(100);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cf_payment_id VARCHAR(100);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_session_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_payments_cf_order ON public.payments(cf_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_cf_payment ON public.payments(cf_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON public.payments(payment_session_id);
