# Floria Media Data Model & Database Schema (V2)

## 1. Domain Model & Entity Overview

The Floria media domain maps canonical asset tracking (`media_assets`), upload tracking (`media_upload_sessions`), resolution variants (`media_variants`), and multi-tenant domain entity integrations (`products`, `seller_profiles`, `categories`, `reviews`, `user_profiles`).

```
                    ┌───────────────────────────────┐
                    │     media_upload_sessions     │
                    │ ───────────────────────────── │
                    │ id (UUID, PK)                 │
                    │ seller_id (UUID, FK)          │
                    │ status (ENUM)                 │
                    │ presigned_url (TEXT)          │
                    │ expires_at (TIMESTAMPTZ)      │
                    └───────────────┬───────────────┘
                                    │
                                    │ 1 : 1
                                    ▼
                    ┌───────────────────────────────┐
                    │         media_assets          │
                    │ ───────────────────────────── │
                    │ id (UUID, PK)                 │
                    │ seller_id (UUID, FK)          │
                    │ sha256_hash (TEXT)            │
                    │ status (ENUM)                 │
                    │ failure_stage / code / msg    │
                    └───────────────┬───────────────┘
                                    │
                                    │ 1 : N
                                    ▼
                    ┌───────────────────────────────┐
                    │        media_variants         │
                    │ ───────────────────────────── │
                    │ id (UUID, PK)                 │
                    │ asset_id (UUID, FK)           │
                    │ variant_name (TEXT)           │
                    │ format (TEXT)                 │
                    │ width / height (INT)          │
                    │ storage_bucket / path (TEXT)  │
                    │ (NO CANONICAL public_url)     │
                    └───────────────────────────────┘
                                    ▲
                                    │ Foreign Key Integration
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────┴────────┐         ┌────────┴───────┐         ┌─────────┴────────┐
│ product_images │         │ seller_profiles│         │ categories       │
└────────────────┘         └────────────────┘         └──────────────────┘
```

---

## 2. PostgreSQL DDL Schema Specification

```sql
-- 1. Custom Enums
CREATE TYPE media_asset_status AS ENUM (
  'RECEIVED',
  'VALIDATING',
  'QUEUED',
  'PROCESSING',
  'STORING',
  'READY',
  'FAILED',
  'RETIRED',
  'DELETING',
  'DELETED'
);

CREATE TYPE upload_session_status AS ENUM (
  'CREATED',
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
  'ABANDONED'
);

-- 2. Media Upload Sessions Table
CREATE TABLE IF NOT EXISTS media_upload_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID REFERENCES seller_profiles(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  target_domain       TEXT NOT NULL, -- 'PRODUCT', 'NURSERY', 'AVATAR', etc.
  original_filename   TEXT NOT NULL,
  expected_mime_type  TEXT NOT NULL,
  expected_size_bytes BIGINT NOT NULL CHECK (expected_size_bytes > 0),
  status              upload_session_status NOT NULL DEFAULT 'CREATED',
  staging_path        TEXT NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_upload_sessions_seller ON media_upload_sessions(seller_id);
CREATE INDEX idx_upload_sessions_status ON media_upload_sessions(status, expires_at);

-- 3. Core Media Assets Table
CREATE TABLE IF NOT EXISTS media_assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID REFERENCES seller_profiles(id) ON DELETE SET NULL,
  uploaded_by_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  session_id          UUID REFERENCES media_upload_sessions(id) ON DELETE SET NULL,
  original_filename   TEXT NOT NULL,
  mime_type           TEXT NOT NULL,
  file_size_bytes     BIGINT NOT NULL CHECK (file_size_bytes > 0),
  sha256_hash         TEXT NOT NULL,
  status              media_asset_status NOT NULL DEFAULT 'RECEIVED',
  failure_stage       TEXT, -- 'VALIDATION', 'PROCESSING', 'STORAGE'
  failure_code        TEXT, -- 'INVALID_MIME', 'PIXEL_BOMB', 'STORAGE_TIMEOUT'
  failure_message     TEXT,
  storage_bucket      TEXT NOT NULL DEFAULT 'public-media',
  is_system_seeded    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_assets_seller ON media_assets(seller_id);
CREATE INDEX idx_media_assets_hash ON media_assets(seller_id, sha256_hash);
CREATE INDEX idx_media_assets_status ON media_assets(status);

-- 4. Processed Media Variants Table (No Canonical public_url)
CREATE TABLE IF NOT EXISTS media_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  variant_name    TEXT NOT NULL, -- 'thumbnail', 'medium', 'large', 'cover'
  format          TEXT NOT NULL, -- 'webp', 'avif'
  width           INT NOT NULL CHECK (width > 0),
  height          INT NOT NULL CHECK (height > 0),
  size_bytes      BIGINT NOT NULL CHECK (size_bytes > 0),
  storage_bucket  TEXT NOT NULL DEFAULT 'public-media',
  storage_path    TEXT NOT NULL, -- Relative path (e.g. 'products/s1/asset-1/medium.webp')
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_asset_variant UNIQUE (asset_id, variant_name, format)
);

CREATE INDEX idx_media_variants_asset ON media_variants(asset_id);
```

---

## 3. Complete Domain Relationship Integration Model

| Audited Field                   | Target Schema Entity                                       | Relationship Cardinality    | FK Constraint & Deletion Rule                                                                                |
| :------------------------------ | :--------------------------------------------------------- | :-------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `product_images.url`            | `product_images.asset_id` (FK to `media_assets.id`)        | 1 Product : N Images        | `ON DELETE RESTRICT` (Product deletion triggers cascade on `product_images`, asset transitions to `RETIRED`) |
| `seller_profiles.logo_url`      | `seller_profiles.logo_asset_id` (FK to `media_assets.id`)  | 1 Seller : 1 Showcase Asset | `ON DELETE SET NULL`                                                                                         |
| `categories.image_url`          | `categories.banner_asset_id` (FK to `media_assets.id`)     | 1 Category : 1 Banner Asset | `ON DELETE SET NULL`                                                                                         |
| `user_profiles.avatar_url`      | `user_profiles.avatar_asset_id` (FK to `media_assets.id`)  | 1 User : 1 Avatar Asset     | `ON DELETE SET NULL`                                                                                         |
| `reviews.image_url`             | `review_media` join table (`review_id`, `asset_id`)        | 1 Review : N Attachments    | `ON DELETE CASCADE` on join table                                                                            |
| `seller_documents.document_url` | `seller_documents.file_asset_id` (FK to `media_assets.id`) | 1 Seller : N Documents      | `ON DELETE CASCADE` (`storage_bucket = 'private-documents'`)                                                 |

---

## 4. Deduplication & Content Hashing Semantics

- **Deduplication Scope**: Computed as `seller_id + sha256_hash`. If Seller A uploads an identical binary image that Seller A already has in state `READY`, the API reuses the existing `asset_id` and variants.
- **Cross-Seller Privacy Isolation**: SHA-256 deduplication is strictly scoped per `seller_id`. Seller B uploading the same photo as Seller A will result in a separate `media_asset` and isolated storage path for Seller B, maintaining zero data exposure across nurseries.
- **System Seeded Scope**: For system-wide assets (`is_system_seeded = TRUE`), the scope is global `sha256_hash`.
