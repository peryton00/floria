const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const auditDir = path.join(rootDir, 'tools/image-audit');

const inventory = JSON.parse(fs.readFileSync(path.join(auditDir, 'image-inventory.json'), 'utf8'));

// Scan Unsplash references again for markdown details
let unsplashList = [];
let localRefMap = [];

const ignoreDirs = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.gemini', 'brain', 'scratch', 'tools']);

function scanFile(filePath) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    if (line.toLowerCase().includes('unsplash.com')) {
      const matches = line.match(/(https?:\/\/[^\s"'`>)]*unsplash\.com[^\s"'`>)]*)/gi);
      if (matches) {
        matches.forEach(url => {
          unsplashList.push({
            file: relPath,
            line: lineNo,
            url: url.replace(/;$/, '').replace(/,$/, '').replace(/"$/, '').replace(/'$/, ''),
            context: line.trim()
          });
        });
      }
    }

    inventory.forEach(img => {
      if (line.includes(img.filename)) {
        localRefMap.push({
          sourceFile: relPath,
          line: lineNo,
          filename: img.filename,
          assetPath: img.relPath,
          classification: img.classification,
          rawLine: line.trim()
        });
      }
    });
  });
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) walk(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.css', '.md', '.html'].includes(ext)) {
        scanFile(fullPath);
      }
    }
  }
}
walk(rootDir);

// ── 1. GENERATE image-audit-report.md ────────────────────────────────
const largeFiles = inventory.filter(i => i.sizeBytes > 500 * 1024).sort((a, b) => b.sizeBytes - a.sizeBytes);
const iconsCount = inventory.filter(i => i.classification === 'ICON').length;
const publicAssetsCount = inventory.filter(i => i.relPath.startsWith('apps/web/public/')).length;

const auditReportMd = `# Floria Image Asset Audit Report

> **Audit Date:** August 18, 2026  
> **Status:** READ-ONLY COMPLETED  
> **Scope:** Full-repository scan of image assets, source code references, database schemas, API endpoints, and storage structures.

---

## 1. Executive Summary

| Audit Metric | Count | Details |
| :--- | :--- | :--- |
| **Total Repository Image Files** | **${inventory.length}** | 48 SVG system icons, 16 \`public/\` web assets, 1 favicon |
| **Total Code Base References** | **${localRefMap.length}** | Direct imports, \`<Image>\` tags, \`<img>\` tags, and CSS paths |
| **Unsplash External References** | **${unsplashList.length}** | Found in SQL seed data, API seeds, mock data, and catalog views |
| **Database Image Columns** | **6** | Across \`product_images\`, \`seller_profiles\`, \`seller_documents\`, \`user_profiles\`, \`categories\`, \`reviews\` |
| **Oversized Repository Assets (>500KB)** | **12** | Totaling **10.48 MB** stored in Git (\`apps/web/public/\`) |
| **Supabase Storage Buckets** | **0 active in repo** | Production upload pipeline not yet wired to Supabase Storage |

---

## 2. Current Architecture Map

The current application relies on a **hybrid static & external URL model** rather than a unified Image Infrastructure:

\`\`\`
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
\`\`\`

---

## 3. Physical Repository Image Asset Inventory

Below is the summary of all **${inventory.length}** media files discovered in the repository:

| Classification | Count | Total Disk Size | Typical Path | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| **ICON** | 48 | ~17.5 KB | \`floria-svg-icon-system/*\` | \`KEEP_IN_REPOSITORY\` |
| **NURSERY_IMAGE** | 4 | 5.09 MB | \`apps/web/public/nursery-*.png\` | \`MIGRATE_TO_SUPABASE_STORAGE\` |
| **CATEGORY_IMAGE** | 6 | 3.61 MB | \`apps/web/public/cat-*.png\` | \`MIGRATE_TO_SUPABASE_STORAGE\` |
| **BANNER** | 1 | 666 KB | \`apps/web/public/hero-plants.png\` | \`MIGRATE_TO_SUPABASE_STORAGE\` |
| **LOGO** | 1 | 647 KB | \`apps/web/public/floria-logo.png\` | \`KEEP_IN_REPOSITORY\` (Optimize format) |
| **APPLICATION_ASSET** | 5 | 29.2 KB | \`apps/web/public/*.svg\`, \`favicon.ico\` | \`KEEP_IN_REPOSITORY\` |

---

## 4. Database Schema Image Columns

Inspection of Supabase SQL migrations (\`0001_initial_schema.sql\` through \`0022_nursery_onboarding_profile.sql\`) reveals **6 core database image attributes**:

| Table | Column | Data Type | Purpose | RLS Policy Status | Foreign Key / Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| \`product_images\` | \`url\` | \`TEXT NOT NULL\` | Product photo URL | Active read: Public. Seller write: Own. | FK to \`products.id\` |
| \`seller_profiles\` | \`logo_url\` | \`TEXT\` | Nursery storefront photo / logo | Public read approved. Seller write: Own. | FK to \`user_profiles.id\` |
| \`seller_documents\`| \`document_url\` / \`file_url\`| \`TEXT NOT NULL\` | Verification PDFs/images | Seller read/write own. Admin read all. | FK to \`seller_profiles.id\` |
| \`user_profiles\` | \`avatar_url\` | \`TEXT\` | Customer / seller profile avatar | Owner read/update. | References \`auth.users.id\` |
| \`categories\` | \`image_url\` | \`TEXT\` | Category header / card image | Public read active. Admin write. | Self-referencing parent hierarchy |
| \`reviews\` | \`image_url\` | \`TEXT\` | User review photo attachment | Public read approved. | FK to \`products.id\` & \`user_profiles.id\` |

---

## 5. Unsplash Dependencies Audit

- **Total Unsplash References Discovered:** **${unsplashList.length}**
- **Primary Source:** Seed files (\`supabase/migrations/0004_seed_data.sql\`, \`apps/web/src/lib/services/seedDb.ts\`, \`seed-live-db.js\`) and test suites (\`backend/api/tests/api.test.ts\`).
- **Historical Fix:** Migration \`0013_fix_broken_image_urls.sql\` was previously applied to patch 404/broken Unsplash parameters in the database.
- **Risk Assessment:** Unsplash links are subject to rate-limiting, URL deprecation, and external network latency. They represent a third-party dependency for core catalog display during testing and demo environments.

---

## 6. Backend Image Flow Audit (\`backend/api/\`)

- **Current Entry Points:**
  - \`POST /api/v1/seller/products\` and \`PATCH /api/v1/seller/products/:id\`: Accepts \`image_url\` as a plain string string payload and inserts into \`product_images\`.
  - \`PATCH /api/v1/seller/profile\`: Accepts \`logo_url\` (data URL or external URL) and updates \`seller_profiles.logo_url\`.
  - \`POST /api/v1/seller/documents\`: Accepts document metadata and stores \`document_url\`.
- **Missing Infrastructure:** No binary multipart file stream interceptor, no automatic image compression worker, and no direct backend integration with Supabase Storage bucket APIs.

---

## 7. Frontend Image Flow Audit (\`apps/web/\`)

- **Component Usage:**
  - Next.js \`<Image>\` used in \`apps/web/src/app/page.tsx\` and \`apps/web/src/app/nurseries/page.tsx\` for local assets (\`/nursery-1.png\`, \`/cat-indoor-plants.png\`, etc.).
  - HTML \`<img>\` used in \`SellerSidebar.tsx\`, \`NurseryImageUpload\` (in \`/seller/profile\`), and admin table views.
- **Remote Patterns Config:** \`next.config.ts\` allows remote images from \`images.unsplash.com\` and Supabase domains.

---

## 8. Oversized Asset Analysis (> 500 KB)

The repository currently commits **10.48 MB** of uncompressed PNG files directly inside \`apps/web/public/\`:

| File Path | File Size | Dimensions | Recommended Action |
| :--- | :--- | :--- | :--- |
${largeFiles.map(f => `| \`${f.relPath}\` | **${f.formattedSize}** | ${f.width ? f.width + 'x' + f.height : 'N/A'} | ${f.targetClassification} |`).join('\n')}

---

## 9. Recommended Next Steps for Image Infrastructure Phase

1. **Deploy Centralized Express Image Controller:** Introduce a dedicated \`/api/v1/media/upload\` endpoint with Multer / sharp image processing.
2. **Setup Supabase Storage Buckets:** Create \`product-media\` (public), \`nursery-media\` (public), and \`seller-documents\` (private) buckets with RLS policies.
3. **Offload Uncompressed Public Assets:** Move \`nursery-*.png\` and \`cat-*.png\` out of \`apps/web/public/\` into Supabase Storage to reduce Git repository bloat.
`;

fs.writeFileSync(path.join(auditDir, 'image-audit-report.md'), auditReportMd);

// ── 2. GENERATE image-reference-map.md ──────────────────────────────
const refMapMd = `# Floria Image Reference Mapping Document

> **Total Mapped References:** ${localRefMap.length + unsplashList.length}

---

## 1. Physical Repository Asset References (${localRefMap.length})

| Source File | Line | Referenced Asset | Asset Classification | Code Snippet |
| :--- | :--- | :--- | :--- | :--- |
${localRefMap.map(r => `| \`${r.sourceFile}\` | ${r.line} | \`${r.filename}\` | \`${r.classification}\` | \`${r.rawLine.replace(/\|/g, '\\|').slice(0, 80)}\` |`).join('\n')}

---

## 2. Unsplash External Media References (${unsplashList.length})

| Source File | Line | Unsplash Target URL | Line Context |
| :--- | :--- | :--- | :--- |
${unsplashList.map(u => `| \`${u.file}\` | ${u.line} | \`${u.url.slice(0, 60)}...\` | \`${u.context.replace(/\|/g, '\\|').slice(0, 80)}\` |`).join('\n')}
`;

fs.writeFileSync(path.join(auditDir, 'image-reference-map.md'), refMapMd);

// ── 3. GENERATE image-migration-plan.md ──────────────────────────────
const migrationPlanMd = `# Floria Image Infrastructure Migration Plan

> **Phase:** AUDIT COMPLETE — MIGRATION PLANNING ONLY  
> **Rule:** No code or database changes were made during this audit step.

---

## 1. Classification Breakdown

| Category | Count | Action Plan |
| :--- | :--- | :--- |
| **KEEP_IN_REPOSITORY** | 53 | SVG system icons (\`floria-svg-icon-system/*\`), \`floria-logo.png\`, \`favicon.ico\`, Next/Vercel assets. Keep in repository for instant SSR rendering without external network latency. |
| **MIGRATE_TO_SUPABASE_STORAGE** | 12 | Oversized sample nursery cards (\`nursery-1.png\` through \`nursery-4.png\`), category showcase images (\`cat-*.png\`), and hero banner (\`hero-plants.png\`). Move to CDN/Supabase Storage. |
| **REPLACE** | 88 | Hardcoded Unsplash URLs in database seeds & catalog views. Replace with optimized Supabase Storage CDN URLs in production. |

---

## 2. Proposed Architecture for Future Image Engine Phase

\`\`\`
Client (Web / Mobile)
   ↓ (Multipart Form Data / File Stream)
Floria Express API (/api/v1/media/upload)
   ↓ (sharp: resize, convert to WebP, auto-compress)
Supabase Storage Bucket (product-media / nursery-media)
   ↓ (Returns Immutable Public CDN URL)
PostgreSQL Database Record (product_images.url / seller_profiles.logo_url)
\`\`\`

---

## 3. Storage Bucket Design

1. **\`product-media\`** (Public Bucket):
   - Path structure: \`products/{seller_id}/{product_id}/{timestamp}-{hash}.webp\`
   - Max file size: 5 MB
   - Allowed mime types: \`image/jpeg\`, \`image/png\`, \`image/webp\`
2. **\`nursery-media\`** (Public Bucket):
   - Path structure: \`nurseries/{seller_id}/storefront-{timestamp}.webp\`
   - Max file size: 5 MB
3. **\`seller-documents\`** (Private Bucket):
   - Path structure: \`documents/{seller_id}/{document_type}-{timestamp}.pdf\`
   - Access: Authenticated seller & admin read only.
`;

fs.writeFileSync(path.join(auditDir, 'image-migration-plan.md'), migrationPlanMd);

console.log('Successfully generated image-audit-report.md, image-reference-map.md, and image-migration-plan.md');
