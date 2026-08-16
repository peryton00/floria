-- ============================================================================
-- FLORIA MIGRATION 0018: FINANCIAL LEDGER, PAYMENTS & PAYOUT ARCHITECTURE
-- ============================================================================

-- 1. SELLER ORDER FINANCIALS (Multi-Nursery Attribution Per Sub-Order)
CREATE TABLE IF NOT EXISTS public.seller_order_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
    seller_gross_paise BIGINT NOT NULL CHECK (seller_gross_paise >= 0),
    commission_rate NUMERIC(5, 4) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 1),
    commission_paise BIGINT NOT NULL CHECK (commission_paise >= 0),
    seller_net_paise BIGINT NOT NULL CHECK (seller_net_paise >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_seller_order_financials UNIQUE (order_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_order_fin_order ON public.seller_order_financials(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_order_fin_seller ON public.seller_order_financials(seller_id);

-- 2. ALTER / EXTEND PAYMENTS (Master Order Payment Intent & Status Tracking)
-- Note: 'payments' table is created in 0001_initial_schema.sql with 'order_id'. We alter table to ensure new columns exist.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS raw_provider_response JSONB;

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 3. PAYMENT EVENTS (Webhook Audit & State Transitions)
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'payment_created', 'payment_captured', 'payment_failed', 'webhook_received', 'refund_initiated', 'refund_completed'
    provider_event_id VARCHAR(100) UNIQUE,
    status VARCHAR(50) NOT NULL,
    amount_paise BIGINT NOT NULL DEFAULT 0,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON public.payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON public.payment_events(event_type);

-- 4. REFUNDS
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.seller_profiles(id),
    refund_reference VARCHAR(100) NOT NULL UNIQUE,
    idempotency_key VARCHAR(100) UNIQUE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_seller ON public.refunds(seller_id);

-- 5. SELLER LEDGER ENTRIES (Immutable Append-Only Financial Ledger)
CREATE TABLE IF NOT EXISTS public.seller_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id),
    payment_id UUID REFERENCES public.payments(id),
    refund_id UUID REFERENCES public.refunds(id),
    entry_type VARCHAR(50) NOT NULL, -- 'earning_credit', 'commission_debit', 'refund_debit', 'payout_debit', 'adjustment_credit', 'adjustment_debit'
    amount_paise BIGINT NOT NULL, -- positive for credit, negative for debit
    balance_state VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'available', 'paid', 'refunded'
    description TEXT NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_ledger_seller ON public.seller_ledger_entries(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_ledger_state ON public.seller_ledger_entries(seller_id, balance_state);
CREATE INDEX IF NOT EXISTS idx_seller_ledger_order ON public.seller_ledger_entries(order_id);

-- 6. PAYOUTS & PAYOUT ITEMS
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
    payout_reference VARCHAR(100) NOT NULL UNIQUE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed', 'cancelled'
    provider_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_seller ON public.payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);

CREATE TABLE IF NOT EXISTS public.payout_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id UUID NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
    ledger_entry_id UUID NOT NULL REFERENCES public.seller_ledger_entries(id),
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_payout_ledger_item UNIQUE (payout_id, ledger_entry_id)
);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.seller_order_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if present before recreating to avoid duplicate policy errors
DROP POLICY IF EXISTS "Service role full access seller_order_financials" ON public.seller_order_financials;
DROP POLICY IF EXISTS "Service role full access payments" ON public.payments;
DROP POLICY IF EXISTS "Service role full access payment_events" ON public.payment_events;
DROP POLICY IF EXISTS "Service role full access refunds" ON public.refunds;
DROP POLICY IF EXISTS "Service role full access seller_ledger_entries" ON public.seller_ledger_entries;
DROP POLICY IF EXISTS "Service role full access payouts" ON public.payouts;
DROP POLICY IF EXISTS "Service role full access payout_items" ON public.payout_items;
DROP POLICY IF EXISTS "Customer can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Customer can view own refunds" ON public.refunds;
DROP POLICY IF EXISTS "Seller can view own order financials" ON public.seller_order_financials;
DROP POLICY IF EXISTS "Seller can view own ledger entries" ON public.seller_ledger_entries;
DROP POLICY IF EXISTS "Seller can view own payouts" ON public.payouts;

-- Service Role Full Access Policies
CREATE POLICY "Service role full access seller_order_financials" ON public.seller_order_financials USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access payments" ON public.payments USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access payment_events" ON public.payment_events USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access refunds" ON public.refunds USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access seller_ledger_entries" ON public.seller_ledger_entries USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access payouts" ON public.payouts USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access payout_items" ON public.payout_items USING (auth.role() = 'service_role');

-- Customer Read Policy: Only own payments & refunds
CREATE POLICY "Customer can view own payments" ON public.payments
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM public.orders WHERE customer_id = auth.uid()
        )
    );

CREATE POLICY "Customer can view own refunds" ON public.refunds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.payments p
            WHERE p.id = refunds.payment_id AND p.order_id IN (
                SELECT id FROM public.orders WHERE customer_id = auth.uid()
            )
        )
    );

-- Seller Read Policy: Only own financials, ledger entries, and payouts
CREATE POLICY "Seller can view own order financials" ON public.seller_order_financials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.seller_profiles sp
            WHERE sp.id = seller_order_financials.seller_id AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "Seller can view own ledger entries" ON public.seller_ledger_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.seller_profiles sp
            WHERE sp.id = seller_ledger_entries.seller_id AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "Seller can view own payouts" ON public.payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.seller_profiles sp
            WHERE sp.id = payouts.seller_id AND sp.user_id = auth.uid()
        )
    );
