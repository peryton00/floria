# Floria Global Loading & Skeleton System Documentation

## Overview

The Floria Global Loading & Skeleton System enforces context-appropriate loading patterns across the entire Floria platform (Customer, Seller, Operations, Admin). In accordance with Floria UI guidelines, generic full-screen spinners for page data fetching are banned. Structural skeletons match the final content layouts to eliminate Cumulative Layout Shift (CLS).

---

## 1. Loader Taxonomy & Guidelines

| Context | Recommended Primitive | Purpose & Behavior |
|---|---|---|
| **Product Listings** | `<ProductGridSkeleton count={8} />` | Preserves 4/3 image aspect ratio, title lines, rating, price & button bounds |
| **Nursery Directory** | `<NurseryGridSkeleton count={6} />` | Preserves nursery avatar, title, rating, badge, and CTA button |
| **Product Detail** | `<ProductDetailSkeleton />` | Two-column skeleton representing main gallery, price, seller box, care guide & reviews |
| **Admin Dashboard** | `<AdminDashboardSkeleton />` | Structural skeleton displaying KPI grid, line/donut chart skeletons, and activity table |
| **Seller Dashboard** | `<SellerDashboardSkeleton />` | Structural skeleton matching banner, KPI grid, recent orders & product stock tables |
| **Operations Dashboard**| `<OperationsDashboardSkeleton />` | Structural skeleton for operational KPI cards and dispatch/packing queue tables |
| **Data Tables** | `<TableSkeleton rows={8} columns={5} />` | Renders header, customizable row skeletons, and responsive mobile `<CardSkeleton />` fallback |
| **Form Data Fetching** | `<FormSkeleton fields={4} />` | Label and input container skeletons before data population |
| **Modal API Fetching** | `<ModalSkeleton />` | Modal header, form lines, and footer action skeletons |
| **Button Action** | `<Button loading={true}>Save</Button>` | Disables button, renders inline `<Spinner size="sm" />`, preserves button text & width |
| **Search Inputs** | `<SearchLoader />` | Compact inline spinner inside input field without interrupting layout |
| **Upload Progress** | `<UploadLoader progress={72} />` | Displays filename, size, progress percentage bar, thumbnail preview & status badge |
| **Checkout Gateway** | `<CheckoutLoader step="processing-payment" />` | Modal overlay tracking explicit stages (`validating`, `creating-order`, `processing-payment`) |

---

## 2. Component API Reference

```tsx
import {
  Spinner,
  Skeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  NurseryCardSkeleton,
  ProductDetailSkeleton,
  TableSkeleton,
  KpiSkeleton,
  ChartSkeleton,
  AdminDashboardSkeleton,
  SellerDashboardSkeleton,
  OperationsDashboardSkeleton,
  FormSkeleton,
  ModalSkeleton,
  InlineLoader,
  SearchLoader,
  UploadLoader,
  CheckoutLoader,
} from "@/components/ui/loading";
```

### `<Spinner />`
- **Sizes**: `xs` (12px), `sm` (16px), `md` (24px), `lg` (32px), `xl` (48px)
- **Accessibility**: Includes `role="status"` and `aria-label="Loading..."` by default.

### `<Skeleton />`
- **Variants**: `text`, `avatar`, `image`, `rectangle`, `circle`
- **Reduced Motion**: Applies `motion-reduce:animate-none motion-reduce:opacity-60` to respect OS reduced-motion preferences.

### `<Button loading={true}>`
- Preserves button children text alongside `<Spinner size="sm" />`.
- Disables interaction and sets `aria-busy="true"`.

---

## 3. Accessibility & Performance Controls

1. **Accessibility (`aria-busy`, `role="status"`)**: Structural containers apply `aria-busy="true"` and `aria-label` to inform assistive technology without cluttering screen readers with individual decorative skeleton blocks.
2. **Preventing Cumulative Layout Shift (CLS)**: Skeletons mirror final component height, width, padding, and flex properties so content replaces skeleton blocks without layout jumping.
3. **Stale-While-Revalidate**: For background updates, existing data remains rendered while subtle inline refresh indicators (`<InlineLoader>Updating...</InlineLoader>`) inform the user.
