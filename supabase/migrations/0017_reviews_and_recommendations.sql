-- ============================================================
-- Floria — Phase 3.14: Reviews, Ratings & Recommendations
-- Migration: 0017_reviews_and_recommendations.sql
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE review_status AS ENUM (
  'pending',    -- awaiting admin moderation
  'approved',   -- visible publicly
  'rejected',   -- not visible; stored for audit
  'flagged'     -- seller flagged; awaiting re-moderation
);

-- ============================================================
-- PRODUCT REVIEWS
-- One review per order_item_id (enforces verified purchase uniqueness)
-- ============================================================

CREATE TABLE product_reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id          UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  order_item_id        UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  rating               SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                TEXT,
  body                 TEXT CHECK (char_length(body) <= 2000),
  is_verified_purchase BOOLEAN NOT NULL DEFAULT TRUE, -- always TRUE via server check; stored for display
  status               review_status NOT NULL DEFAULT 'pending',
  helpful_count        INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  reported_count       INTEGER NOT NULL DEFAULT 0 CHECK (reported_count >= 0),
  seller_reply         TEXT,
  seller_replied_at    TIMESTAMPTZ,
  moderation_note      TEXT,      -- internal admin note
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One review per order item (prevents duplicates even if order has multiple quantities)
  CONSTRAINT uq_review_order_item UNIQUE (order_item_id)
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews only
CREATE POLICY "product_reviews: public read approved" ON product_reviews
  FOR SELECT USING (status = 'approved');

-- Customer reads own reviews (all statuses)
CREATE POLICY "product_reviews: customer read own" ON product_reviews
  FOR SELECT USING (auth.uid() = customer_id);

-- Customer inserts own review (server validates verified purchase via order_item_id)
CREATE POLICY "product_reviews: customer insert own" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Customer can update own review only while pending (not after approval)
CREATE POLICY "product_reviews: customer update own pending" ON product_reviews
  FOR UPDATE USING (auth.uid() = customer_id AND status = 'pending');

-- Customer can delete own review only while pending
CREATE POLICY "product_reviews: customer delete own pending" ON product_reviews
  FOR DELETE USING (auth.uid() = customer_id AND status = 'pending');

CREATE INDEX idx_reviews_product    ON product_reviews(product_id, status);
CREATE INDEX idx_reviews_customer   ON product_reviews(customer_id);
CREATE INDEX idx_reviews_order_item ON product_reviews(order_item_id);
CREATE INDEX idx_reviews_status     ON product_reviews(status);
CREATE INDEX idx_reviews_created    ON product_reviews(created_at DESC);

-- ============================================================
-- REVIEW HELPFUL VOTES
-- Customers can mark reviews as helpful — one vote per review per user
-- ============================================================

CREATE TABLE review_helpful_votes (
  review_id   UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, customer_id)
);

ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_helpful_votes: customer manage own" ON review_helpful_votes
  FOR ALL USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- ============================================================
-- PRODUCT RATING SUMMARY
-- Maintained server-side only — never written to by clients
-- Aggregates: raw avg, Bayesian estimate, Wilson lower bound, star distribution
-- ============================================================

CREATE TABLE product_rating_summary (
  product_id          UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  review_count        INTEGER NOT NULL DEFAULT 0,
  avg_rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  bayesian_rating     NUMERIC(3,2) NOT NULL DEFAULT 0,   -- shrunk toward global mean when count is low
  wilson_lower_bound  NUMERIC(5,4) NOT NULL DEFAULT 0,   -- used for ranking
  star_1_count        INTEGER NOT NULL DEFAULT 0,
  star_2_count        INTEGER NOT NULL DEFAULT 0,
  star_3_count        INTEGER NOT NULL DEFAULT 0,
  star_4_count        INTEGER NOT NULL DEFAULT 0,
  star_5_count        INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_rating_summary ENABLE ROW LEVEL SECURITY;

-- Public can read rating summaries (no writes)
CREATE POLICY "product_rating_summary: public read" ON product_rating_summary
  FOR SELECT USING (TRUE);

CREATE INDEX idx_product_rating_wilson ON product_rating_summary(wilson_lower_bound DESC);
CREATE INDEX idx_product_rating_bayesian ON product_rating_summary(bayesian_rating DESC);

-- ============================================================
-- SELLER RATING SUMMARY (nursery reputation)
-- Aggregated from product_rating_summary for all seller products
-- ranking_score = weighted combination used for nursery listing order
-- ============================================================

CREATE TABLE seller_rating_summary (
  seller_id       UUID PRIMARY KEY REFERENCES seller_profiles(id) ON DELETE CASCADE,
  review_count    INTEGER NOT NULL DEFAULT 0,
  avg_rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
  bayesian_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  ranking_score   NUMERIC(6,4) NOT NULL DEFAULT 0,  -- final nursery rank score
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE seller_rating_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_rating_summary: public read" ON seller_rating_summary
  FOR SELECT USING (TRUE);

CREATE INDEX idx_seller_rating_rank ON seller_rating_summary(ranking_score DESC);

-- ============================================================
-- PL/pgSQL: Wilson Score Lower Bound
-- Gives a confidence interval lower bound for a Bernoulli proportion
-- Used to rank products fairly regardless of sample size
-- z=1.96 → 95% confidence
-- ============================================================

CREATE OR REPLACE FUNCTION wilson_score_lower_bound(
  positive  NUMERIC,
  total     NUMERIC,
  z         NUMERIC DEFAULT 1.96
) RETURNS NUMERIC AS $$
DECLARE
  phat NUMERIC;
BEGIN
  IF total = 0 THEN RETURN 0; END IF;
  phat := positive / total;
  RETURN (
    phat + z * z / (2 * total) -
    z * sqrt((phat * (1 - phat) + z * z / (4 * total)) / total)
  ) / (1 + z * z / total);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- PL/pgSQL: Refresh Product Rating Summary
-- Called server-side after any review status change
-- Global prior: m=3.5 (neutral), C=10 (prior weight)
-- ponytail: O(n) scan over approved reviews for this product.
--           Upgrade to incremental update if product reviews exceed ~10k.
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_product_rating_summary(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_count       INTEGER;
  v_avg         NUMERIC;
  v_s1          INTEGER;
  v_s2          INTEGER;
  v_s3          INTEGER;
  v_s4          INTEGER;
  v_s5          INTEGER;
  v_bayesian    NUMERIC;
  v_wilson      NUMERIC;
  v_positive    NUMERIC; -- 4+5 star treated as "positive" for Wilson
  c_prior_mean  CONSTANT NUMERIC := 3.5;
  c_prior_weight CONSTANT NUMERIC := 10.0;
BEGIN
  SELECT
    COUNT(*)                                          AS cnt,
    COALESCE(AVG(rating), 0)                          AS avg_r,
    COUNT(*) FILTER (WHERE rating = 1)                AS s1,
    COUNT(*) FILTER (WHERE rating = 2)                AS s2,
    COUNT(*) FILTER (WHERE rating = 3)                AS s3,
    COUNT(*) FILTER (WHERE rating = 4)                AS s4,
    COUNT(*) FILTER (WHERE rating = 5)                AS s5
  INTO v_count, v_avg, v_s1, v_s2, v_s3, v_s4, v_s5
  FROM product_reviews
  WHERE product_id = p_product_id AND status = 'approved';

  -- Bayesian average (shrinks toward prior mean when count is low)
  v_bayesian := (c_prior_weight * c_prior_mean + v_count * v_avg) /
                (c_prior_weight + v_count);

  -- Wilson lower bound treating 4+5 stars as "positive"
  v_positive := v_s4 + v_s5;
  v_wilson   := wilson_score_lower_bound(v_positive::NUMERIC, v_count::NUMERIC);

  INSERT INTO product_rating_summary (
    product_id, review_count, avg_rating, bayesian_rating,
    wilson_lower_bound, star_1_count, star_2_count, star_3_count,
    star_4_count, star_5_count, updated_at
  ) VALUES (
    p_product_id, v_count, ROUND(v_avg, 2), ROUND(v_bayesian, 2),
    ROUND(v_wilson, 4), v_s1, v_s2, v_s3, v_s4, v_s5, now()
  )
  ON CONFLICT (product_id) DO UPDATE SET
    review_count       = EXCLUDED.review_count,
    avg_rating         = EXCLUDED.avg_rating,
    bayesian_rating    = EXCLUDED.bayesian_rating,
    wilson_lower_bound = EXCLUDED.wilson_lower_bound,
    star_1_count       = EXCLUDED.star_1_count,
    star_2_count       = EXCLUDED.star_2_count,
    star_3_count       = EXCLUDED.star_3_count,
    star_4_count       = EXCLUDED.star_4_count,
    star_5_count       = EXCLUDED.star_5_count,
    updated_at         = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PL/pgSQL: Refresh Seller Rating Summary
-- Aggregates all product summaries for this seller's products
-- ranking_score = bayesian * log(1 + review_count) — rewards volume
-- ============================================================

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

  -- ranking_score: bayesian × log(1 + total_reviews) — zero if no reviews
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

-- ============================================================
-- Trigger: auto-initialize rating summary row on new product
-- ============================================================

CREATE OR REPLACE FUNCTION init_product_rating_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_rating_summary (product_id)
  VALUES (NEW.id)
  ON CONFLICT (product_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_init_product_rating_summary
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION init_product_rating_summary();

-- Backfill: init summary row for all existing products
INSERT INTO product_rating_summary (product_id)
SELECT id FROM products
ON CONFLICT (product_id) DO NOTHING;

-- Backfill: init seller summary row for all existing approved sellers
INSERT INTO seller_rating_summary (seller_id)
SELECT id FROM seller_profiles WHERE status = 'approved'
ON CONFLICT (seller_id) DO NOTHING;
