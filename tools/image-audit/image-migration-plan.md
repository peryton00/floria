# Floria Image Infrastructure Migration Plan

> **Phase:** AUDIT COMPLETE — MIGRATION PLANNING ONLY  
> **Rule:** No code or database changes were made during this audit step.

---

## 1. Classification Breakdown

| Category | Count | Action Plan |
| :--- | :--- | :--- |
| **KEEP_IN_REPOSITORY** | 53 | SVG system icons (`floria-svg-icon-system/*`), `floria-logo.png`, `favicon.ico`, Next/Vercel assets. Keep in repository for instant SSR rendering without external network latency. |
| **MIGRATE_TO_SUPABASE_STORAGE** | 12 | Oversized sample nursery cards (`nursery-1.png` through `nursery-4.png`), category showcase images (`cat-*.png`), and hero banner (`hero-plants.png`). Move to CDN/Supabase Storage. |
| **REPLACE** | 88 | Hardcoded Unsplash URLs in database seeds & catalog views. Replace with optimized Supabase Storage CDN URLs in production. |

---

## 2. Proposed Architecture for Future Image Engine Phase

```
Client (Web / Mobile)
   ↓ (Multipart Form Data / File Stream)
Floria Express API (/api/v1/media/upload)
   ↓ (sharp: resize, convert to WebP, auto-compress)
Supabase Storage Bucket (product-media / nursery-media)
   ↓ (Returns Immutable Public CDN URL)
PostgreSQL Database Record (product_images.url / seller_profiles.logo_url)
```

---

## 3. Storage Bucket Design

1. **`product-media`** (Public Bucket):
   - Path structure: `products/{seller_id}/{product_id}/{timestamp}-{hash}.webp`
   - Max file size: 5 MB
   - Allowed mime types: `image/jpeg`, `image/png`, `image/webp`
2. **`nursery-media`** (Public Bucket):
   - Path structure: `nurseries/{seller_id}/storefront-{timestamp}.webp`
   - Max file size: 5 MB
3. **`seller-documents`** (Private Bucket):
   - Path structure: `documents/{seller_id}/{document_type}-{timestamp}.pdf`
   - Access: Authenticated seller & admin read only.
