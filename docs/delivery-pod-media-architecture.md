# Floria Delivery Mobile — Proof of Delivery (POD) & Media Architecture Contract

---

## 1. PURPOSE & STATUS

This document defines the authoritative architecture, data contracts, storage models, security policies, and implementation specifications for **Proof of Delivery (POD)** photo capture and media lifecycle in Floria.

- **Status**: `[IMPLEMENTED & VERIFIED IN STEP 5B.3]`
- **Authoritative Implementation**:
  - Migration: `supabase/migrations/0028_delivery_pod_metadata.sql`
  - Backend Media: `backend/api/src/media/` (`DELIVERY_POD` profile, Sharp WebP processing, private storage routing)
  - Backend Operations: `backend/api/src/operations/` (`/deliveries/:id/complete`, `/deliveries/:id/pod`)
  - API Client: `packages/api-client/src/index.ts` (`completeDeliveryWithPod`, `getDeliveryPod`, `createUploadSession`, `completeUploadSession`)
  - Mobile UI: `apps/delivery-mobile/app/deliveries/[id].tsx` (`expo-image-picker`, POD capture, preview, retake modal, upload, atomic completion)

---

## 2. IDEMPOTENCY AUDIT MATRIX `[VERIFIED & IMPLEMENTED]`

| Operation                       | Endpoint                                                | Actual Mechanism                                                                                             | Truly Idempotent?                 | Evidence in Code            | Invariant / Guarantee                                                   |
| :------------------------------ | :------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------- | :-------------------------------- | :-------------------------- | :---------------------------------------------------------------------- |
| **Create Upload Session**       | `POST /api/v1/media/upload-session`                     | Generates random `UUID` on every request; inserts new row in `media_upload_sessions`.                        | **NO**                            | `media.service.ts:92`       | Do not retry session creation in infinite loop.                         |
| **Complete Upload Session**     | `POST /api/v1/media/upload-session/:sessionId/complete` | Deduplicated on `sessionId`. If `status === "COMPLETED"`, returns existing asset.                            | **YES**                           | `media.service.ts:194`      | Retrying with same `sessionId` is completely safe.                      |
| **Update Delivery Status**      | `POST /api/v1/operations/deliveries/:id/status`         | Generic status transition. Updates timestamp and creates audit log.                                          | **NO (Partially Mutating)**       | `operations.service.ts:224` | Retained for admin/manual recovery.                                     |
| **Dedicated Complete Delivery** | `POST /api/v1/operations/deliveries/:id/complete`       | Status guard: if `status === "delivered"` with matching `pod_asset_id`, returns existing record immediately. | **YES (For identical POD retry)** | `operations.service.ts:270` | Prevents timestamp drift and duplicate `DELIVERY_COMPLETED` audit logs. |

---

## 3. DELIVERY COMPLETION ATOMICITY & TRANSACTION SUPPORT `[VERIFIED]`

### 3.1 Existing Database Client Mechanism

- The backend communicates with PostgreSQL via Supabase PostgREST client (`supabase-js` via `getAdminDb()`).
- Individual repository calls (`deliveryRepository.completeWithPod()`, `orderRepository.updateOrderStatus()`, `auditRepository.log()`) execute as **sequential PostgREST statements**.

### 3.2 Atomicity & Failure Model

- **Primary Statement**: Mutates `delivery_assignments` with `status: "delivered"`, `delivered_at: now()`, `pod_asset_id`, `recipient_name`, and `pod_notes`.
- **Order Reconciliation**: Sequentially updates `orders.status = "delivered"` and `seller_order_fulfillments.status = "Delivered"`.
- **Audit Logging**: Logs `DELIVERY_COMPLETED` with non-blocking error handling to ensure audit storage drops do not fail the core business event.

---

## 4. PROOF OF DELIVERY BUSINESS RULE STATUS `[VERIFIED & IMPLEMENTED]`

- **Courier Mobile Flow**: Enforces taking a POD photo via device camera before enabling the "CONFIRM & COMPLETE DROP-OFF" action.
- **Dedicated Completion API**: Rejects requests lacking a valid, READY POD asset owned by the courier.
- **Admin/Operations Exemption**: Admin users retain manual override capability on generic `/status` for edge-case resolution.

---

## 5. STORAGE ARCHITECTURE & BUCKET USAGE `[IMPLEMENTED]`

### 5.1 Storage Buckets Audit (`0024_storage_buckets_and_policies.sql`)

| Bucket Name         | Public / Private       | Allowed Types              | Access & RLS Policy                                                                                |
| :------------------ | :--------------------- | :------------------------- | :------------------------------------------------------------------------------------------------- |
| `media-staging`     | **Private** (10 MB)    | JPEG, PNG, WebP, HEIC, PDF | Upload allowed ONLY with active, unexpired `media_upload_sessions` matching `uploaded_by_user_id`. |
| `public-media`      | **Public CDN** (10 MB) | WebP, AVIF, JPEG, PNG, SVG | Public CDN read. Writes strictly restricted to server `service_role`.                              |
| `private-documents` | **Private** (10 MB)    | PDF, JPEG, PNG, WebP       | Private read for document owners and Admin/Operations. Zero direct client INSERT.                  |

### 5.2 Storage Bucket: **`private-documents`**

- **Location**: Stored in `private-documents` under `pod/<courier_id>/<asset_id>.webp`.
- **Signed URL**: Generated server-side with 3600-second (1 hour) expiration TTL.

---

## 6. IMAGE ENGINE & PRIVACY SPECIFICATION `[IMPLEMENTED]`

### 6.1 Server-Side Sharp Processing (`image-engine.ts` & `media.service.ts`)

- **Magic Bytes Validation**: Sharp inspects binary headers (`\xFF\xD8\xFF` JPEG, `RIFF....WEBP`), rejecting spoofed MIME types.
- **Format Conversion**: Transcodes raw inputs to optimized WebP variant (1600x1200, 80% quality).
- **EXIF & Privacy**: Calling `.rotate().toColorspace("srgb").webp()` **completely strips all EXIF metadata and GPS coordinates** by default. Customer home GPS coordinates are never leaked in asset files.

### 6.2 Mobile Compression (`apps/delivery-mobile`)

- `expo-image-picker` with `quality: 0.8`, `allowsEditing: true`, `aspect: [4, 3]`.

---

## 7. SECURITY THREAT MODEL & MITIGATIONS `[IMPLEMENTED]`

| Threat                             | Scenario                                                           | Implemented Mitigation                                                                                                | Evidence                        |
| :--------------------------------- | :----------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :------------------------------ |
| **Cross-Courier Attachment**       | Courier A uploads a photo and attaches it to Courier B's delivery. | Server validates `asset.uploaded_by_user_id === user.id` and `delivery.assigned_to === user.id`.                      | `operations.service.ts:260-295` |
| **Unprocessed Media Attachment**   | Attaching asset before WebP conversion finishes.                   | Server validates `asset.status === 'READY'` and `storage_bucket === 'private-documents'`.                             | `operations.service.ts:298-305` |
| **Unauthorized Signed URL Access** | A customer or courier views another order's POD photo.             | Server checks authorization and generates signed URLs only for assigned couriers, customers, or admins.               | `operations.service.ts:340-365` |
| **Tampered File Type**             | Attacker uploads executable disguised as image.                    | Sharp magic bytes decoder throws `CorruptImageError` or `UnsupportedFormatError`.                                     | `image-engine.ts:65-85`         |
| **Duplicate Delivery Completion**  | Flaky mobile network retries complete request.                     | Idempotency guard in `/complete` checks if already delivered with matching POD, returning 200 OK without re-auditing. | `operations.service.ts:268-271` |

---

## 8. IMPLEMENTED API & API-CLIENT CONTRACT `[IMPLEMENTED]`

### 8.1 Backend Operations Endpoints

#### 1. Complete Delivery with POD

- `POST /api/v1/operations/deliveries/:id/complete`
- Headers: `Authorization: Bearer <jwt>`
- Body: `{ podAssetId: string, recipientName?: string, notes?: string }`
- Response: `ApiResponse<DeliveryAssignment>`

#### 2. Get Signed POD URL

- `GET /api/v1/operations/deliveries/:id/pod`
- Headers: `Authorization: Bearer <jwt>`
- Response: `ApiResponse<DeliveryPodDetails>`

### 8.2 API Client Methods (`FloriaApiClient`)

```typescript
public async completeDeliveryWithPod(
  id: string,
  data: CompleteDeliveryPayload
): Promise<ApiResponse<DeliveryAssignment>>;

public async getDeliveryPod(
  id: string
): Promise<ApiResponse<DeliveryPodDetails>>;
```

---

## 9. DATABASE SCHEMA `[MIGRATION 0028]`

```sql
-- Migration: supabase/migrations/0028_delivery_pod_metadata.sql
ALTER TABLE delivery_assignments
  ADD COLUMN IF NOT EXISTS pod_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS pod_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_pod_asset
  ON delivery_assignments(pod_asset_id);
```

---

## 10. MOBILE WORKFLOW & ERROR STATES `[IMPLEMENTED]`

- **Step 1**: On `out_for_delivery`, courier taps "CAPTURE PROOF OF DELIVERY".
- **Step 2**: Contextual camera permission requested.
- **Step 3**: Camera viewfinder captures photo.
- **Step 4**: Modal opens with photo thumbnail, recipient chips (`"Customer"`, `"Security / Guard"`, `"Doorstep / Porch"`, `"Family Member"`), custom name input, and notes input.
- **Step 5**: Tap "CONFIRM & COMPLETE DROP-OFF" -> Uploads to staging -> Completes upload session -> Completes delivery with POD.
- **Step 6**: On completion, status badge updates to `delivered` and button changes to "VIEW PROOF OF DELIVERY RECEIPT".
- **Retry**: In-memory local photo URI is preserved on network errors, enabling instant retry without retaking the photo.
