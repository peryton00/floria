# Phase 3.13 — Seller Portal Audit & Task Ledger

## Audit Findings

### 1. Mock / Placeholder Data Occurrences
- `apps/web/src/app/seller/documents/page.tsx`:
  - Line 9: `mockDocuments` array containing static PDF/image document metadata.
  - Line 27: Static "Approved" status banner text instead of fetching `seller_documents` status from backend.
- `apps/web/src/app/seller/reviews/page.tsx`:
  - Line 18: Empty visual placeholder state ("No Reviews Recorded Yet").
- `apps/web/src/app/seller/payouts/page.tsx`:
  - Line 78: Status alert indicating payout processor is disabled pending external provider integration.
- `apps/web/src/app/seller/settings/page.tsx`:
  - Line 38 & 51: Visual toggle cards for Notification Preferences and Security 2FA marked "Disabled".

### 2. Product Image & Upload Storage Analysis
- `apps/web/src/app/seller/products/new/page.tsx`:
  - Line 273: Image URL is currently inputted as plain text string URL.
  - No direct binary image file upload endpoint exists under `/api/v1/seller/products/upload` or Supabase Storage bucket integration.
- `apps/web/src/app/seller/profile/page.tsx`:
  - Logo upload preview uses `FileReader.readAsDataURL(file)` for browser-local Data URL preview instead of uploading to Supabase Storage.

### 3. Seller Document Upload & Security Analysis
- `seller_documents` database table was defined in `0001_initial_schema.sql`, but lacked backend API endpoints (`GET /api/v1/seller/documents`, `POST /api/v1/seller/documents`).
- Seller document file uploads were not connected to a private storage bucket.

### 4. Seller Settings & Notification Preferences Analysis
- `apps/web/src/app/seller/settings/page.tsx` was a static menu without API backing.
- `/api/v1/seller/settings/notifications` endpoint did not exist to manage seller notification preferences.

---

## Action Plan for Phase 3.13

1. **Private Document & Image Storage API**:
   - Add backend endpoints `GET /api/v1/seller/documents` and `POST /api/v1/seller/documents`.
   - Implement database storage for seller verification documents (`seller_documents` table) with status tracking (`pending`, `under_review`, `approved`, `rejected`).
   - Implement security checks for document file uploads (file type validation, max size 5MB, ownership verification).

2. **Seller Settings & Notification Preferences API**:
   - Create `GET /api/v1/seller/settings/notifications` and `PATCH /api/v1/seller/settings/notifications`.
   - Create user notification settings preferences table or JSON configuration so sellers can customize alert preferences (`new_order`, `low_stock`, `order_updates`).
   - Connect `/seller/settings/page.tsx` to live API state.

3. **Payout Readiness & Financial Hardening**:
   - Document immutable earnings calculations and historical order commission snapshots.
   - Document external payment gateway payout provider dependency.

4. **Security, Responsive, Accessibility & E2E Testing**:
   - Add unit tests for document authorization, notification preferences, IDOR, and fulfillment transitions.
   - Run typecheck, unit tests, and production build.
