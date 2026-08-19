# Floria Image Asset Audit Report

> **Audit Date:** August 18, 2026  
> **Status:** READ-ONLY COMPLETED  
> **Scope:** Full-repository scan of image assets, source code references, database schemas, API endpoints, and storage structures.

---

## 1. Executive Summary

| Audit Metric | Count | Details |
| :--- | :--- | :--- |
| **Total Repository Image Files** | **65** | 48 SVG system icons, 16 `public/` web assets, 1 favicon |
| **Total Code Base References** | **98** | Direct imports, `<Image>` tags, `<img>` tags, and CSS paths |
| **Unsplash External References** | **88** | Found in SQL seed data, API seeds, mock data, and catalog views |
| **Database Image Columns** | **6** | Across `product_images`, `seller_profiles`, `seller_documents`, `user_profiles`, `categories`, `reviews` |
| **Oversized Repository Assets (>500KB)** | **12** | Totaling **10.48 MB** stored in Git (`apps/web/public/`) |
| **Supabase Storage Buckets** | **0 active in repo** | Production upload pipeline not yet wired to Supabase Storage |

---

## 2. Current Architecture Map

The current application relies on a **hybrid static & external URL model** rather than a unified Image Infrastructure:

```
+-----------------------------------------------------------------------------------+
|                                  FLORIA FRONTEND                                  |
|                             (apps/web - Next.js 16)                               |
+----------------------------------------+------------------------------------------+
                                         |
            +----------------------------+----------------------------+
            |                                                         |
            v                                                         v
+------------------------+                               +--------------------------+
|  Local Static Assets   |                               |  External Unsplash URLs  |
|  (apps/web/public/*)   |                               |  (images.unsplash.com)   |
|                        |                               |                          |
| - /nursery-[1-4].png   |                               | - Used in seeds & tests  |
| - /cat-[name].png      |                               | - Product catalog images |
| - /hero-plants.png     |                               | - Category banners       |
| - /floria-logo.png     |                               |                          |
+------------------------+                               +--------------------------+
            |                                                         |
            v                                                         v
+-----------------------------------------------------------------------------------+
|                             EXPRESS BACKEND + POSTGRES                            |
|                          (backend/api - Supabase Postgres)                        |
|                                                                                   |
| - Database stores string URLs directly (product_images.url, seller_profiles.logo) |
| - No binary image processing worker or direct Supabase Storage stream handler     |
+-----------------------------------------------------------------------------------+
```

---

## 3. Physical Repository Image Asset Inventory

Below is the summary of all **65** media files discovered in the repository:

| Classification | Count | Total Disk Size | Typical Path | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| **ICON** | 48 | ~17.5 KB | `floria-svg-icon-system/*` | `KEEP_IN_REPOSITORY` |
| **NURSERY_IMAGE** | 4 | 5.09 MB | `apps/web/public/nursery-*.png` | `MIGRATE_TO_SUPABASE_STORAGE` |
| **CATEGORY_IMAGE** | 6 | 3.61 MB | `apps/web/public/cat-*.png` | `MIGRATE_TO_SUPABASE_STORAGE` |
| **BANNER** | 1 | 666 KB | `apps/web/public/hero-plants.png` | `MIGRATE_TO_SUPABASE_STORAGE` |
| **LOGO** | 1 | 647 KB | `apps/web/public/floria-logo.png` | `KEEP_IN_REPOSITORY` (Optimize format) |
| **APPLICATION_ASSET** | 5 | 29.2 KB | `apps/web/public/*.svg`, `favicon.ico` | `KEEP_IN_REPOSITORY` |

---

## 4. Database Schema Image Columns

Inspection of Supabase SQL migrations (`0001_initial_schema.sql` through `0022_nursery_onboarding_profile.sql`) reveals **6 core database image attributes**:

| Table | Column | Data Type | Purpose | RLS Policy Status | Foreign Key / Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `product_images` | `url` | `TEXT NOT NULL` | Product photo URL | Active read: Public. Seller write: Own. | FK to `products.id` |
| `seller_profiles` | `logo_url` | `TEXT` | Nursery storefront photo / logo | Public read approved. Seller write: Own. | FK to `user_profiles.id` |
| `seller_documents`| `document_url` / `file_url`| `TEXT NOT NULL` | Verification PDFs/images | Seller read/write own. Admin read all. | FK to `seller_profiles.id` |
| `user_profiles` | `avatar_url` | `TEXT` | Customer / seller profile avatar | Owner read/update. | References `auth.users.id` |
| `categories` | `image_url` | `TEXT` | Category header / card image | Public read active. Admin write. | Self-referencing parent hierarchy |
| `reviews` | `image_url` | `TEXT` | User review photo attachment | Public read approved. | FK to `products.id` & `user_profiles.id` |

---

## 5. Unsplash Dependencies Audit

- **Total Unsplash References Discovered:** **88**
- **Primary Source:** Seed files (`supabase/migrations/0004_seed_data.sql`, `apps/web/src/lib/services/seedDb.ts`, `seed-live-db.js`) and test suites (`backend/api/tests/api.test.ts`).
- **Historical Fix:** Migration `0013_fix_broken_image_urls.sql` was previously applied to patch 404/broken Unsplash parameters in the database.
- **Risk Assessment:** Unsplash links are subject to rate-limiting, URL deprecation, and external network latency. They represent a third-party dependency for core catalog display during testing and demo environments.

---

## 6. Backend Image Flow Audit (`backend/api/`)

- **Current Entry Points:**
  - `POST /api/v1/seller/products` and `PATCH /api/v1/seller/products/:id`: Accepts `image_url` as a plain string string payload and inserts into `product_images`.
  - `PATCH /api/v1/seller/profile`: Accepts `logo_url` (data URL or external URL) and updates `seller_profiles.logo_url`.
  - `POST /api/v1/seller/documents`: Accepts document metadata and stores `document_url`.
- **Missing Infrastructure:** No binary multipart file stream interceptor, no automatic image compression worker, and no direct backend integration with Supabase Storage bucket APIs.

---

## 7. Frontend Image Flow Audit (`apps/web/`)

- **Component Usage:**
  - Next.js `<Image>` used in `apps/web/src/app/page.tsx` and `apps/web/src/app/nurseries/page.tsx` for local assets (`/nursery-1.png`, `/cat-indoor-plants.png`, etc.).
  - HTML `<img>` used in `SellerSidebar.tsx`, `NurseryImageUpload` (in `/seller/profile`), and admin table views.
- **Remote Patterns Config:** `next.config.ts` allows remote images from `images.unsplash.com` and Supabase domains.

---

## 8. Oversized Asset Analysis (> 500 KB)

The repository currently commits **10.48 MB** of uncompressed PNG files directly inside `apps/web/public/`:

| File Path | File Size | Dimensions | Recommended Action |
| :--- | :--- | :--- | :--- |
| `apps/web/public/nursery-2.png` | **1.25 MB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |
| `apps/web/public/nursery-4.png` | **1.22 MB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |
| `apps/web/public/nursery-1.png` | **1.19 MB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |
| `apps/web/public/nursery-3.png` | **1.18 MB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |
| `apps/web/public/cat-fertilizers.png` | **669.17 KB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |
| `apps/web/public/hero-plants.png` | **650.41 KB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |
| `apps/web/public/cat-plants.png` | **644.79 KB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |
| `apps/web/public/floria-logo.png` | **631.71 KB** | 2000x2000 | KEEP_IN_REPOSITORY |
| `apps/web/public/cat-tools.png` | **607.43 KB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |
| `apps/web/public/cat-seeds.png` | **585.2 KB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |
| `apps/web/public/cat-pots.png` | **542.27 KB** | N/A | MIGRATE_TO_SUPABASE_STORAGE |

---

## 9. Recommended Next Steps for Image Infrastructure Phase

1. **Deploy Centralized Express Image Controller:** Introduce a dedicated `/api/v1/media/upload` endpoint with Multer / sharp image processing.
2. **Setup Supabase Storage Buckets:** Create `product-media` (public), `nursery-media` (public), and `seller-documents` (private) buckets with RLS policies.
3. **Offload Uncompressed Public Assets:** Move `nursery-*.png` and `cat-*.png` out of `apps/web/public/` into Supabase Storage to reduce Git repository bloat.
