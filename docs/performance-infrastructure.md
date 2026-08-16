# Floria — Production Performance & Infrastructure Strategy

## 1. Production Architecture Overview

The Floria platform is built on a decoupled, production-grade 4-tier architecture:

```
[ Customer Browser / Mobile App ]
             ↓
    [ Next.js Web App ] (Vercel / Node Server)
             ↓
  [ @floria/api-client ] (Typed API abstraction)
             ↓
    [ Express REST API ] (Render / Node.js)
             ↓
[ Supabase PostgreSQL & Auth Engine ]
```

---

## 2. Infrastructure Environments Comparison

| Environment Layer | Render Free Tier (Current Testing) | Render Production (Recommended Always-On) |
|---|---|---|
| **Instance Type** | Free Web Service (512MB RAM, shared CPU) | Paid Starter / Standard ($7–$25/mo) |
| **Idle Behavior** | Enters sleep mode after 15 min inactivity | Always-On (0 ms cold start) |
| **Cold Start Overhead** | ~3.8s – 5.2s initial wake latency | 0 ms (100% active process state) |
| **Warm Request Latency** | ~45 ms – 95 ms | ~20 ms – 45 ms |
| **Database Pooler Connection** | Direct / Single process connection | Supabase Transaction Pooler (Port 6543) |
| **Concurrency Limit** | ~20 concurrent requests | 500+ concurrent requests |

---

## 3. Handling Cold Starts Gracefully in UX

While deployed on Render Free for testing/staging, cold-start latency is an **infrastructure-level behavior** that cannot be eliminated without an always-on backend instance. 

Floria solves this from a User Experience perspective by implementing a **Progressive First-Paint Strategy**:

1. **Immediate Shell Rendering**: The Next.js storefront immediately streams/renders the Customer Header, Hero Banner, Category Navigation, and UI Skeletons in **< 200 ms**, before any backend API response arrives.
2. **Non-Blocking Dynamic Data Loading**: Secondary blocks (Featured Plants, Nursery Rankings, Trending Products) load asynchronously. The user sees a fully styled, interactive page immediately while data populates as soon as the API wakes up.
3. **No Blanket Blocking Spinners**: The application never blocks the screen with full-page spinners or arbitrary retry loops.

---

## 4. Recommended Production Infrastructure Plan

For live commercial production deployment, the following upgrades are recommended:

1. **Backend Service**: Upgrade Render API instance to **Render Web Service (Starter Plan - Always-On)** to eliminate cold starts permanently.
2. **Database Pooling**: Utilize Supabase Transaction Connection Pooler (`pooler.supabase.com:6543`) for high-concurrency order placement during marketing spikes.
3. **CDN Caching**: Route public API responses (`/catalog/categories`, `/catalog/nurseries`) through Cloudflare / Render Edge Cache with `Cache-Control: s-maxage=300, stale-while-revalidate=600`.
