-- Migration 0016: Seller Documents and Seller Settings Tables & RLS
CREATE TABLE IF NOT EXISTS seller_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'gstin', 'business_license', 'pan_card', 'trade_license', 'other'
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected'
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_settings (
  seller_id UUID PRIMARY KEY REFERENCES seller_profiles(id) ON DELETE CASCADE,
  new_order_notifications BOOLEAN DEFAULT TRUE,
  low_stock_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_documents_seller_id ON seller_documents(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_documents_status ON seller_documents(status);

-- Enable RLS
ALTER TABLE seller_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_documents
CREATE POLICY "seller_documents: seller read own" ON seller_documents
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "seller_documents: seller insert own" ON seller_documents
  FOR INSERT WITH CHECK (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "seller_documents: admin read all" ON seller_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for seller_settings
CREATE POLICY "seller_settings: seller read own" ON seller_settings
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "seller_settings: seller write own" ON seller_settings
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM seller_profiles WHERE user_id = auth.uid()
    )
  );
