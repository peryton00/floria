-- ============================================================================
-- FLORIA MIGRATION 0021: VERSIONED PRICING POLICIES, RECALCULATION & READ MODEL
-- ============================================================================

-- 1. PRICING POLICY VERSIONS (Immutable Versioned Policy Records)
CREATE TABLE IF NOT EXISTS public.pricing_policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number INT NOT NULL UNIQUE,
    seller_commission_rate NUMERIC(5, 2) NOT NULL CHECK (seller_commission_rate >= 0 AND seller_commission_rate <= 50),
    floria_profit_rate NUMERIC(5, 2) NOT NULL CHECK (floria_profit_rate >= 0 AND floria_profit_rate <= 50),
    platform_maintenance_fee_paise BIGINT NOT NULL CHECK (platform_maintenance_fee_paise >= 0),
    free_delivery_threshold_paise BIGINT NOT NULL CHECK (free_delivery_threshold_paise >= 0),
    free_delivery_recovery_paise BIGINT NOT NULL CHECK (free_delivery_recovery_paise >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'preparing', 'ready', 'active', 'archived', 'failed')),
    notes TEXT,
    created_by UUID REFERENCES public.user_profiles(id),
    activated_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_policy_status ON public.pricing_policy_versions(status);
CREATE INDEX IF NOT EXISTS idx_pricing_policy_version ON public.pricing_policy_versions(version_number);

-- 2. SEED INITIAL ACTIVE POLICY VERSION (Version 1 migrated from platform_settings)
INSERT INTO public.pricing_policy_versions (
    version_number,
    seller_commission_rate,
    floria_profit_rate,
    platform_maintenance_fee_paise,
    free_delivery_threshold_paise,
    free_delivery_recovery_paise,
    status,
    notes,
    activated_at
) VALUES (
    1,
    12.0,
    2.0,
    1000,
    59900,
    2000,
    'active',
    'Initial seed policy version migrated from baseline financial settings.',
    NOW()
) ON CONFLICT (version_number) DO NOTHING;

-- 3. PRICING RECALCULATION JOBS (Tracks batch recalculation lifecycle)
CREATE TABLE IF NOT EXISTS public.pricing_recalculation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_version_id UUID NOT NULL REFERENCES public.pricing_policy_versions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'completed', 'failed', 'cancelled')),
    total_listings INT NOT NULL DEFAULT 0,
    processed_listings INT NOT NULL DEFAULT 0,
    failed_listings INT NOT NULL DEFAULT 0,
    batch_size INT NOT NULL DEFAULT 500,
    current_batch INT NOT NULL DEFAULT 0,
    total_batches INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_by UUID REFERENCES public.user_profiles(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recalc_jobs_policy ON public.pricing_recalculation_jobs(policy_version_id);
CREATE INDEX IF NOT EXISTS idx_recalc_jobs_status ON public.pricing_recalculation_jobs(status);

-- 4. PRICING RECALCULATION JOB ITEMS (Audit items / failure tracking)
CREATE TABLE IF NOT EXISTS public.pricing_recalculation_job_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.pricing_recalculation_jobs(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'calculated', 'failed')),
    error_detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recalc_job_items_job ON public.pricing_recalculation_job_items(job_id);

-- 5. PRODUCT PRICING READ MODEL (Persisted read cache per policy version & product)
CREATE TABLE IF NOT EXISTS public.product_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
    policy_version_id UUID NOT NULL REFERENCES public.pricing_policy_versions(id) ON DELETE CASCADE,
    seller_base_price_paise BIGINT NOT NULL CHECK (seller_base_price_paise >= 0),
    floria_profit_rate NUMERIC(5, 2) NOT NULL,
    floria_profit_paise BIGINT NOT NULL CHECK (floria_profit_paise >= 0),
    delivery_recovery_paise BIGINT NOT NULL CHECK (delivery_recovery_paise >= 0),
    customer_product_price_paise BIGINT NOT NULL CHECK (customer_product_price_paise >= 0),
    is_free_delivery_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    seller_commission_rate NUMERIC(5, 2) NOT NULL,
    seller_commission_paise BIGINT NOT NULL CHECK (seller_commission_paise >= 0),
    seller_net_paise BIGINT NOT NULL CHECK (seller_net_paise >= 0),
    is_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_product_pricing_policy_product UNIQUE (policy_version_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_pricing_prod ON public.product_pricing(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_policy ON public.product_pricing(policy_version_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_seller ON public.product_pricing(seller_id);

-- 6. PRODUCT PRICING OVERRIDES (Admin overrides audit log)
CREATE TABLE IF NOT EXISTS public.product_pricing_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    policy_version_id UUID REFERENCES public.pricing_policy_versions(id),
    custom_customer_price_paise BIGINT NOT NULL CHECK (custom_customer_price_paise >= 0),
    reason TEXT NOT NULL,
    created_by UUID REFERENCES public.user_profiles(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overrides_prod ON public.product_pricing_overrides(product_id);
CREATE INDEX IF NOT EXISTS idx_overrides_active ON public.product_pricing_overrides(is_active);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.pricing_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_recalculation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_recalculation_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing_overrides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if present before recreating
DROP POLICY IF EXISTS "Service role full access pricing_policy_versions" ON public.pricing_policy_versions;
DROP POLICY IF EXISTS "Admin full access pricing_policy_versions" ON public.pricing_policy_versions;
DROP POLICY IF EXISTS "Service role full access pricing_recalculation_jobs" ON public.pricing_recalculation_jobs;
DROP POLICY IF EXISTS "Admin full access pricing_recalculation_jobs" ON public.pricing_recalculation_jobs;
DROP POLICY IF EXISTS "Service role full access pricing_recalculation_job_items" ON public.pricing_recalculation_job_items;
DROP POLICY IF EXISTS "Admin full access pricing_recalculation_job_items" ON public.pricing_recalculation_job_items;
DROP POLICY IF EXISTS "Service role full access product_pricing" ON public.product_pricing;
DROP POLICY IF EXISTS "Public read product_pricing" ON public.product_pricing;
DROP POLICY IF EXISTS "Service role full access product_pricing_overrides" ON public.product_pricing_overrides;
DROP POLICY IF EXISTS "Admin full access product_pricing_overrides" ON public.product_pricing_overrides;

-- Service Role Full Access
CREATE POLICY "Service role full access pricing_policy_versions" ON public.pricing_policy_versions USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access pricing_recalculation_jobs" ON public.pricing_recalculation_jobs USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access pricing_recalculation_job_items" ON public.pricing_recalculation_job_items USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access product_pricing" ON public.product_pricing USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access product_pricing_overrides" ON public.product_pricing_overrides USING (auth.role() = 'service_role');

-- Admin Full Access
CREATE POLICY "Admin full access pricing_policy_versions" ON public.pricing_policy_versions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admin full access pricing_recalculation_jobs" ON public.pricing_recalculation_jobs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admin full access pricing_recalculation_job_items" ON public.pricing_recalculation_job_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admin full access product_pricing_overrides" ON public.product_pricing_overrides
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Public Read for product_pricing (Customer store listings)
CREATE POLICY "Public read product_pricing" ON public.product_pricing
    FOR SELECT USING (true);
