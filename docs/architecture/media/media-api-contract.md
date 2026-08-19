# Floria Media API Contract Specification

## 1. Upload Session Control Plane

### 1.1 Create Upload Session
`POST /api/v1/media/uploads`

Creates a new upload session, validates caller quota, and returns a 15-minute presigned upload target in `media-staging`.

- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "targetDomain": "PRODUCT",
  "filename": "ficus-bonsai.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 2457600
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "assetId": "asset_fa82910a-4c12-4122-b91c-99d82e11a204",
    "status": "CREATED",
    "expiresAt": "2026-08-18T01:45:00.000Z",
    "upload": {
      "method": "PUT",
      "url": "https://<supabase-id>.supabase.co/storage/v1/object/media-staging/staging/s1/sess_9b1deb4d/asset_fa82910a.tmp?token=...",
      "headers": {
        "Content-Type": "image/jpeg"
      }
    }
  }
}
```

---

### 1.2 Trigger Session Completion & Processing
`POST /api/v1/media/uploads/:sessionId/complete`

Called by the client after direct-to-staging PUT binary transfer succeeds. Verifies binary presence in `media-staging`, updates status to `QUEUED`, and dispatches BullMQ worker job.

- **Headers**: `Authorization: Bearer <token>`
- **Response `202 Accepted`**:
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "assetId": "asset_fa82910a-4c12-4122-b91c-99d82e11a204",
    "status": "QUEUED"
  }
}
```

---

### 1.3 Batch Upload Sessions
`POST /api/v1/media/uploads/batch`

Creates up to 10 upload sessions in a single request.

- **Request Body**:
```json
{
  "targetDomain": "PRODUCT",
  "files": [
    { "filename": "plant1.jpg", "mimeType": "image/jpeg", "sizeBytes": 1048576 },
    { "filename": "plant2.jpg", "mimeType": "image/jpeg", "sizeBytes": 2097152 }
  ]
}
```
- **Response `201 Created`**: Array of upload session objects with presigned URLs.

---

## 2. Asset Query & Management Endpoints

### 2.1 Get Media Asset Status & Delivery Payload
`GET /api/v1/media/:assetId`

- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "assetId": "asset_fa82910a-4c12-4122-b91c-99d82e11a204",
    "status": "READY",
    "originalFilename": "ficus-bonsai.jpg",
    "mimeType": "image/jpeg",
    "variants": {
      "thumbnail": "https://cdn.floria.in/public-media/products/s1/asset_fa82910a/thumb.webp",
      "medium": "https://cdn.floria.in/public-media/products/s1/asset_fa82910a/medium.webp",
      "large": "https://cdn.floria.in/public-media/products/s1/asset_fa82910a/large.webp"
    }
  }
}
```

---

### 2.2 Delete / Retire Asset
`DELETE /api/v1/media/:assetId`

Transitions asset status from `READY` to `RETIRED`. The asset is unlinked from domain relationships and scheduled for reference-aware garbage collection.

- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "assetId": "asset_fa82910a-4c12-4122-b91c-99d82e11a204",
    "status": "RETIRED"
  }
}
```

---

## 3. Frontend Client Delivery Contract

Frontend components (`apps/web`) consume normalized media objects without exposure to raw storage buckets or internal database paths:

```typescript
export interface FloriaMediaVariantMap {
  thumbnail?: string;
  medium?: string;
  large?: string;
  cover?: string;
  avatar?: string;
}

export interface FloriaMediaAssetResponse {
  assetId: string;
  status: "QUEUED" | "PROCESSING" | "READY" | "FAILED";
  altText?: string;
  variants: FloriaMediaVariantMap;
}
```
