# Floria Media Architectural Decision Records (ADRs — V2)

## ADR-001: Centralized `media_assets` & `media_variants` Schema vs Direct URL Columns

- **Status**: APPROVED (V2 REVISION)
- **Context**: Currently, Floria stores plain URL strings directly across domain tables (`product_images.url`, `seller_profiles.logo_url`, `categories.image_url`). This prevents multi-variant resolution, checksum deduplication, metadata auditing, and reference-aware orphan asset deletion.
- **Decision**: Introduce a centralized core media model comprising `media_assets` (file metadata, state machine, checksum, ownership) and `media_variants` (processed resolutions/formats), linked to domain tables via foreign key `asset_id`.
- **Alternatives Considered**:
  1. *Continue storing direct string URLs in domain tables*: Low initial effort, but impossible to maintain responsive image variants, asset security, or orphan purges.
  2. *Single monolithic media table containing all variant URLs in JSONB*: Difficult to query, lacks clear relational integrity and index capabilities.
- **Consequences**: Provides clean multi-variant resolution, automated lifecycle tracking, and database integrity. Requires a 2-step schema migration stage with backward compatibility fallbacks.

---

## ADR-002: Direct-to-Staging Upload Architecture & Upload Sessions

- **Status**: APPROVED (V2 REVISION)
- **Context**: Uploading 10MB raw binaries directly through the Express API node increases CPU/RAM overhead, blocks event loops, and risks request timeout failures under high multi-seller upload concurrency.
- **Decision**: Adopt a **Direct-to-Staging Upload Architecture**. The API serves as a control plane issuing presigned 15-minute PUT URLs targeting the private `media-staging` bucket. Client browsers stream binaries directly to storage, then call `/complete` to trigger BullMQ worker verification.
- **Alternatives Considered**:
  1. *Stream binary files through Express API endpoint*: Increases backend node RAM consumption and bandwidth cost.
- **Consequences**: Offloads file transfer overhead from Express API nodes; enables clean upload session lifecycle management (`CREATED`, `COMPLETED`, `EXPIRED`, `ABANDONED`).

---

## ADR-003: Strict Service-Role Write Lockdown for `public-media` Bucket

- **Status**: APPROVED (V2 REVISION)
- **Context**: Allowing seller tokens to write or overwrite files directly in `public-media` exposes the platform to public file vandalism, un-optimized asset uploads, and executable payload injections.
- **Decision**: Sellers have **zero direct write/delete permissions** on `public-media`. Client tokens upload only to `media-staging`. Background workers using server-side `service_role` keys are the sole publishers of processed WebP variants into `public-media`.
- **Alternatives Considered**:
  1. *Allow seller write access with path restrictions in `public-media`*: Risky; fails to enforce server-side image validation before public publishing.
- **Consequences**: Guarantees that 100% of media in public distribution is validated, EXIF-stripped, resized, and converted to WebP.

---

## ADR-004: Node.js + Sharp Engine for Background Processing

- **Status**: APPROVED (V2 REVISION)
- **Context**: Image processing requires metadata stripping, orientation correction, resizing, and format conversion (WebP).
- **Decision**: Standardize on **Sharp** (libvips C++ wrapper) inside Node.js background workers deployed alongside the existing Express backend stack.
- **Alternatives Considered**:
  1. *Python / OpenCV Microservice*: Adds multi-language runtime operational overhead, complex build pipelines, and unnecessary infrastructure.
  2. *Cloud Third-Party SaaS (Cloudinary / Imgix)*: High recurring vendor lock-in and usage bandwidth cost.
- **Consequences**: Sharp is 4x-5x faster than ImageMagick, executes within native Node.js event loops, uses low memory footprint, and preserves the single-language TypeScript ecosystem across Floria.

---

## ADR-005: BullMQ + Redis Asynchronous Processing Queue

- **Status**: APPROVED (V2 REVISION)
- **Context**: Heavy Sharp image transformations must not block the Express HTTP API event loop or delay customer HTTP responses.
- **Decision**: Use **BullMQ + Redis** as the asynchronous job queue to decouple upload session completion (`202 Accepted`) from worker variant generation.
- **Alternatives Considered**:
  1. *In-Process Synchronous Sharp Execution*: Blocks Express API event loops, causes request timeouts during multi-image uploads.
  2. *PG-Boss (Postgres Queue)*: Increases PostgreSQL write/lock contention on the primary transactional database.
- **Consequences**: Enables worker instances to scale independently from API containers, provides robust exponential backoff retries, and maintains sub-100ms API session latency.

---

## ADR-006: WebP V1 Primary Format & Derived Delivery URLs

- **Status**: APPROVED (V2 REVISION)
- **Context**: Storing full absolute public URLs in the database (`https://.../thumb.webp`) prevents domain, CDN, or bucket migration without heavy database update scripts.
- **Decision**: Database records (`media_variants`) store relative `storage_bucket` and `storage_path` attributes. The API/delivery layer dynamically constructs absolute delivery URLs. WebP is the canonical V1 generated delivery format.
- **Alternatives Considered**:
  1. *Store canonical public_url strings in database*: Fragile; breaks when CDN domain or bucket topology changes.
  2. *Mandate double storage for WebP + AVIF in V1*: Increases V1 storage and processing CPU costs without immediate necessity.
- **Consequences**: Decouples database storage from CDN domain topology; schema supports future AVIF extension without data migrations.

---

## ADR-007: Scoped SHA-256 Deduplication & Immediate Staging Purge

- **Status**: APPROVED (V2 REVISION)
- **Context**: Re-uploading identical images wastes processing CPU and cloud storage space. Retaining raw staging binaries inflates storage bills.
- **Decision**: Scope SHA-256 binary deduplication per seller (`seller_id + sha256_hash`). Purge raw staging `.tmp` binaries immediately after worker variant generation and `public-media` publishing complete.
- **Alternatives Considered**:
  1. *Global cross-seller deduplication*: Violates tenant privacy isolation; Seller B could infer Seller A uploaded an asset.
  2. *Permanent retention of raw uncompressed originals*: High long-term storage cost with zero operational benefit.
- **Consequences**: Preserves strict multi-tenant privacy, prevents redundant processing, and eliminates raw file storage accumulation.
