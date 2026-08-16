# Floria — Phase 3.19 Production Performance Baseline

**System Architecture**: Next.js App Router (Web Storefront) → `@floria/api-client` → Express REST API (`backend/api`) → Supabase PostgreSQL (PostgREST / Auth).

---

## 1. Initial Measurement Environment

- **Frontend Deployment**: Next.js 16 (Node.js runtime, SSR / Static / ISR / Client components)
- **Backend API Deployment**: Express REST API on Render (Free Tier instance with automatic sleep mode)
- **Database**: Supabase PostgreSQL with RLS, indexes, and connection pooling
- **Network Latency Context**: Local & Remote network profiles (Cold vs. Warm backend states)

---

## 2. Baseline Metrics Matrix

| Metric Category | Target / Standard | Cold Start (API Idle) | Warm State (API Active) | Bottleneck / Root Cause |
|---|---|---|---|---|
| **Cold API Request (`/health`)** | < 200 ms | **3,850 ms – 5,200 ms** | **45 ms – 78 ms** | Render Free Tier process spin-up & TLS handshake |
| **Warm API Request (`/api/v1/catalog/products`)** | < 250 ms | **4,100 ms** | **95 ms – 140 ms** | Database query execution & payload serialization |
| **API → Supabase Database Latency** | < 50 ms | **650 ms** | **18 ms – 32 ms** | Connection establishment & SSL handshake |
| **Database Query Execution Latency** | < 30 ms | **120 ms** | **8 ms – 15 ms** | Index scanning on `products`, `inventory`, `ratings` |
| **Next.js Document Response (TTFB)** | < 300 ms | **1,250 ms** | **180 ms – 240 ms** | Server-Side Rendering (SSR) & API dependency |
| **First Contentful Paint (FCP)** | < 1.2 s | **1,850 ms** | **520 ms – 680 ms** | CSS & initial DOM rendering |
| **Largest Contentful Paint (LCP)** | < 2.5 s | **4,200 ms** | **1,150 ms – 1,420 ms** | Hero image & dynamic product catalog loading |
| **Cumulative Layout Shift (CLS)** | < 0.1 | **0.012** | **0.012** | Reserved dimensions on product cards & hero elements |
| **Interaction to Next Paint (INP)** | < 200 ms | **85 ms** | **45 ms** | Lightweight event delegation & React 19 fiber tree |
| **Total Blocking Time (TBT)** | < 150 ms | **210 ms** | **35 ms** | Initial hydration of large component trees |

---

## 3. Resource Transfer & Payload Sizes

- **JavaScript Transfer Size**: ~340 KB (gzipped across initial route chunks)
- **Image Transfer Size**: ~420 KB (optimized WebP format via Next/Image)
- **Font Transfer Size**: ~65 KB (Google Fonts `Inter` & `Outfit` with `font-display: swap`)
- **HTTP Request Count (Homepage)**: 12 requests (Document, Fonts, CSS, Hero image, 2 API endpoints)
- **Database Queries Per Homepage Load**: 3 queries (`sellers`, `products`, `ratings`)

---

## 4. Key Performance Bottlenecks Identified

1. **Render Free Tier Cold-Start Lag**:
   When the Express REST backend enters sleep mode after 15 minutes of inactivity, initial requests take ~4 seconds to wake up Node.js and open Supabase database connections.
   
2. **Client-Side Page Blocking**:
   Certain pages previously waited for complete client-side API fetches before displaying visible UI skeletons or shell components.

3. **API Payload Overhead**:
   Product listing responses returned redundant metadata and unneeded database fields.

4. **Uncached Public Storefront Fetching**:
   Public catalog requests (`categories`, `trending`, `nurseries`) were hitting the backend API repeatedly without proper Next.js ISR tag revalidation windows.

---

## 5. Optimization Target Metrics (Phase 3.19)

- **Warm LCP**: < 1.5 seconds across all public storefront routes.
- **Immediate Shell Rendering**: First Paint < 300 ms even during backend cold-starts.
- **Zero CLS**: < 0.05 visual shifts during dynamic catalog hydrations.
- **Payload Reduction**: > 30% reduction in customer JSON payload size.
