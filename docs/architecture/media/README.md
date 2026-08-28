# Floria Production Media Infrastructure Architecture (V2)

> **Status:** ARCHITECTURE DESIGN V2 (IMPLEMENTATION-READY SPECIFICATION)  
> **Target Platform:** Floria Multi-Vendor Botanical Marketplace  
> **Baseline Audit:** Refer to [`tools/image-audit/`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/tools/image-audit) for empirical baseline metrics.

---

## Executive Overview (V2 Architecture)

Floria's Media Infrastructure provides a production-grade, multi-tenant asset processing, storage, and distribution system. The V2 revision establishes a **Direct-to-Staging Upload Control Plane**, isolating unvalidated client uploads in a private `media-staging` bucket before server-side background workers process, optimize, and publish clean WebP variants to public CDN distribution.

```
Seller Client (Web / Mobile)
       │
       ├─► 1. POST /api/v1/media/uploads (Request Presigned Staging URL)
       │      │  [Express API: Auth, Quota, Session Creation]
       │      ▼
       ├─► 2. PUT Raw Binary File direct to Supabase Storage: media-staging
       │
       ├─► 3. POST /api/v1/media/uploads/:id/complete (Trigger Verification)
       │      │  [Express API: Verify Staging Binary, Enqueue BullMQ Job]
       │      ▼
BullMQ Queue ──► Async Image Worker Pool (Node.js + Sharp Engine)
                        │
                        ├─► 4. Read Staging Binary & Execute Sharp Processing
                        ├─► 5. Write WebP Variants to public-media (Service Role Only)
                        ├─► 6. Purge Temporary Raw Staging Binary
                        └─► 7. Write PostgreSQL Metadata Transaction (READY)
```

---

## Architectural Principles & Core Guarantees

1. **Direct-to-Staging Control Plane**: High-volume file binaries bypass the Express API node during upload, streaming directly from the seller's browser into the private `media-staging` bucket via 15-minute presigned upload URLs.
2. **Zero Seller Direct Write to Public Media**: Sellers have **zero write or delete permissions** on the `public-media` bucket. Only authorized background workers using server-side service-role keys may publish processed variants into public distribution.
3. **Immutability & Derivative Storage**: Canonical DB variants store bucket names and relative storage paths (`storage_bucket`, `storage_path`) rather than static public URLs. Delivery URLs are dynamically derived by the API/CDN layer, allowing seamless domain/CDN migrations without database edits.
4. **Reference-Aware Garbage Collection**: Asset retirement (`RETIRED`) is followed by an automated 7-day grace window and multi-table database reference checks before permanent storage purging occurs.

---

## Architecture Documentation Index

| Document                                                   | Description                                                                                                                                   |
| :--------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| [`media-architecture.md`](./media-architecture.md)         | High-level system architecture, presigned upload flow, component topologies, and network sequence.                                            |
| [`media-data-model.md`](./media-data-model.md)             | PostgreSQL DDL schema (`media_assets`, `media_variants`, `media_upload_sessions`, domain relationships), FK indexes, and deduplication logic. |
| [`media-upload-lifecycle.md`](./media-upload-lifecycle.md) | Authoritative state machine (`RECEIVED` → `STORING` → `READY` / `FAILED`), failure codes, Sharp pipeline, and variant profile specs.          |
| [`media-storage-security.md`](./media-storage-security.md) | Bucket topology (`media-staging`, `public-media`, `private-documents`), storage & DB RLS policies, and threat mitigations.                    |
| [`media-api-contract.md`](./media-api-contract.md)         | REST API specifications for upload sessions, completion triggers, asset queries, batch uploads, and client delivery objects.                  |
| [`media-migration-plan.md`](./media-migration-plan.md)     | 15-stage zero-downtime rollout strategy, dual-read compatibility layer, and static PNG / Unsplash offloading guide.                           |
| [`media-operations.md`](./media-operations.md)             | BullMQ worker concurrency, Redis queue specs, reference-aware orphan cleanup cron, and observability log schemas.                             |
| [`media-adr.md`](./media-adr.md)                           | Architectural Decision Records (ADR-001 through ADR-007) explaining design choices and trade-offs.                                            |

---

## Baseline Audit Summary & Reference Reconciliation

Based on the factual repository audit recorded in [`tools/image-audit/image-audit-report.md`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/tools/image-audit/image-audit-report.md):

- **65 Physical Media Files**: 48 system SVG icons (`floria-svg-icon-system/*`), 16 web public assets (`apps/web/public/*`), 1 favicon.
- **Reference Reconciliation**:
  - **98 Physical Asset Reference Points**: Unique code occurrences importing or referencing local repository files.
  - **186 Total Mapped Code Lines**: Includes duplicated import statements, component re-uses, and test matches.
  - **88 Unsplash URL References**: External links present across SQL seed scripts (`0004_seed_data.sql`), TypeScript seeder scripts (`seedDb.ts`), Vitest test files (`api.test.ts`), and frontend mock arrays.
- **Oversized Repository Media**: 12 uncompressed PNG files in `apps/web/public/` totaling **10.48 MB** (including `nursery-1.png` through `nursery-4.png` and `hero-plants.png`), scheduled for offloading to `public-media/system/` during Stage 8 of migration.
