-- Migration 0031: Fix product_rating_summary and seller_rating_summary RLS and trigger permissions

-- 1. Ensure init_product_rating_summary trigger function runs as SECURITY DEFINER
CREATE OR REPLACE FUNCTION init_product_rating_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_rating_summary (product_id)
  VALUES (NEW.id)
  ON CONFLICT (product_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add explicit INSERT and UPDATE policies on product_rating_summary
DROP POLICY IF EXISTS "product_rating_summary: system insert" ON product_rating_summary;
CREATE POLICY "product_rating_summary: system insert" ON product_rating_summary
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "product_rating_summary: system update" ON product_rating_summary;
CREATE POLICY "product_rating_summary: system update" ON product_rating_summary
  FOR UPDATE USING (TRUE);

-- 3. Ensure refresh_seller_rating_summary has SECURITY DEFINER and rating summaries have write access
CREATE OR REPLACE FUNCTION refresh_seller_rating_summary(p_seller_id UUID)
RETURNS VOID AS $$
DECLARE
  v_count    INTEGER;
  v_avg      NUMERIC;
  v_bayesian NUMERIC;
  v_rank     NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(prs.review_count), 0),
    COALESCE(AVG(prs.avg_rating), 0),
    COALESCE(AVG(prs.bayesian_rating), 0)
  INTO v_count, v_avg, v_bayesian
  FROM product_rating_summary prs
  JOIN products p ON p.id = prs.product_id
  WHERE p.seller_id = p_seller_id AND p.status = 'active';

  v_rank := CASE WHEN v_count = 0 THEN 0
                 ELSE ROUND(v_bayesian * LN(1 + v_count), 4) END;

  INSERT INTO seller_rating_summary (
    seller_id, review_count, avg_rating, bayesian_rating, ranking_score, updated_at
  ) VALUES (
    p_seller_id, v_count, ROUND(v_avg, 2), ROUND(v_bayesian, 2), v_rank, now()
  )
  ON CONFLICT (seller_id) DO UPDATE SET
    review_count    = EXCLUDED.review_count,
    avg_rating      = EXCLUDED.avg_rating,
    bayesian_rating = EXCLUDED.bayesian_rating,
    ranking_score   = EXCLUDED.ranking_score,
    updated_at      = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "seller_rating_summary: system insert" ON seller_rating_summary;
CREATE POLICY "seller_rating_summary: system insert" ON seller_rating_summary
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "seller_rating_summary: system update" ON seller_rating_summary;
CREATE POLICY "seller_rating_summary: system update" ON seller_rating_summary
  FOR UPDATE USING (TRUE);
