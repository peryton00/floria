# Floria — Global Toast Notification System Audit (Phase 3.18)

This document audits the global Toast Notification System implemented across the Floria web application (`apps/web`).

---

## 1. Architecture Overview

- **Global Context Provider**: [`ToastProvider`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/apps/web/src/lib/contexts/ToastContext.tsx) mounted at the root in [`Providers.tsx`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/apps/web/src/components/ui/Providers.tsx).
- **Consuming Hook**: `useToast()` accessible across Customer, Seller, Admin, and Operations portals.
- **Floating Viewport**: Stacks at top-right on desktop (`top-4 right-4 z-[9999]`), top-center / top-right with safe margins on mobile (`left-4 right-4 sm:left-auto sm:right-4 max-w-sm w-full`).

---

## 2. Notification Types & Defaults

| Type        | Auto-Dismiss Duration              | ARIA Role       | Icon                         |
| ----------- | ---------------------------------- | --------------- | ---------------------------- |
| **Success** | `4000ms` (4s)                      | `role="status"` | `CheckCircle2` (Emerald)     |
| **Error**   | `6000ms` (6s)                      | `role="alert"`  | `AlertCircle` (Red)          |
| **Warning** | `5000ms` (5s)                      | `role="alert"`  | `AlertTriangle` (Amber)      |
| **Info**    | `4000ms` (4s)                      | `role="status"` | `Info` (Sky)                 |
| **Loading** | Persistent until updated/dismissed | `role="status"` | `Loader2` (Forest, Animated) |

---

## 3. Core System Features

1. **Queueing**: Enforces a maximum of **3 visible simultaneous toasts**. Extra toasts are queued and rendered as earlier toasts dismiss.
2. **Deduplication**: Suppresses duplicate identical toasts triggered within a 1.5-second window.
3. **Async Update Pattern**: Supports `toast.loading("Saving...")` returning a `toastId`, followed by `toast.update(toastId, { type: "success", title: "Saved" })` to seamlessly transition loading state into completion feedback without notification spam.
4. **Accessibility**:
   - `role="status"` / `role="alert"`
   - `aria-live="polite"` / `aria-live="assertive"`
   - Accessible dismissal button (`aria-label="Dismiss notification"` with min 44px touch target on mobile)
   - Reduced motion fallback (`motion-reduce:transition-none motion-reduce:transform-none`)
5. **Route Transition Resilience**: The global provider lives at root level, ensuring toast popups persist across client-side route navigation.

---

## 4. Portal Migration Summary

| Portal         | Migrated Actions                           | Toast Type                                      |
| -------------- | ------------------------------------------ | ----------------------------------------------- |
| **Customer**   | Item added to Cart                         | `toast.success("Added to cart", ...)`           |
| **Customer**   | Item removed from Cart                     | `toast.info("Removed from cart", ...)`          |
| **Customer**   | Item added to Wishlist                     | `toast.success("Saved to wishlist", ...)`       |
| **Customer**   | Item removed from Wishlist                 | `toast.info("Removed from wishlist", ...)`      |
| **Admin**      | Pricing Policy saved                       | `toast.success("Pricing policy updated", ...)`  |
| **Admin**      | Commission Rate updated                    | `toast.success("Commission rate updated", ...)` |
| **Admin**      | Product Status (Publish/Unpublish/Archive) | `toast.success("Product updated", ...)`         |
| **Admin**      | Product & Inventory details saved          | `toast.success("Product updated", ...)`         |
| **Admin**      | Category Created / Updated / Deactivated   | `toast.success("Category updated", ...)`        |
| **Admin**      | Seller Status (Approve/Reject/Suspend)     | `toast.success("Seller status updated", ...)`   |
| **Admin**      | Customer User Status (Suspend/Reactivate)  | `toast.success("User status updated", ...)`     |
| **Admin**      | Master Order Status Overridden             | `toast.success("Order status updated", ...)`    |
| **Seller**     | Product Status Toggled (Active/Draft)      | `toast.success("Status updated", ...)`          |
| **Seller**     | Inventory Stock Saved                      | `toast.success("Stock updated", ...)`           |
| **Seller**     | Product Listing Archived                   | `toast.success("Product archived", ...)`        |
| **Operations** | Delivery Assigned                          | `toast.success("Delivery assigned", ...)`       |
| **Operations** | Delivery Status Updated                    | `toast.success("Delivery status updated", ...)` |
| **Operations** | Packing Task Status Updated                | `toast.success("Packing status updated", ...)`  |

---

## 5. Intentionally Retained Contextual Alerts

- **Field Validation Errors**: In-line validation messages below specific input fields (e.g. "Please enter a valid email address", "Seller commission rate must be between 0% and 50%") are retained contextually per design guidelines.
- **Destructive Confirmation Modals**: Confirmation dialogs before irreversible actions (e.g. category deactivation, user suspension confirmation) are retained as modal dialogs, with the resulting feedback emitted as a post-action toast notification.

---

## Final Verdict

### **APPROVED FOR GLOBAL TOAST NOTIFICATION SYSTEM**
