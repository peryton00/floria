# Floria — Step 17 CI/CD & Deployment Architecture Report

**Authoritative Roadmap Milestone:** Step 17 — CI/CD, Vercel & Render Deployment Architecture
**Date:** August 2026
**Status:** Architecture Implemented & Verified
**Final Gate:** **STEP 17 FINAL GATE: CI/CD ARCHITECTURE ESTABLISHED**

---

## 1. Repository Baseline

- **Monorepo Repository**: `https://github.com/peryton00/floria.git`
- **Canonical Branch**: `main`
- **Working Tree**: Clean.
- **Classification**: **RUNTIME VERIFIED**

---

## 2. CI Architecture

- **Engine**: GitHub Actions (`.github/workflows/ci.yml`).
- **Triggers**: `push: [main]`, `pull_request: [main]`.
- **Jobs**: 3 parallelized quality gates: `secret-audit`, `typecheck-and-test`, `production-builds`.
- **Classification**: **CONFIGURED**

---

## 3. GitHub Actions

- **Permissions**: `contents: read` (least privilege enforced).
- **Concurrency**: `cancel-in-progress: true` prevents redundant older runs from consuming runner minutes.
- **Classification**: **CONFIGURED**

---

## 4. Node & pnpm Versions

- **Node.js**: `20.x` (pinned via root [`.nvmrc`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/.nvmrc) and GitHub Actions setup-node).
- **pnpm**: `9.15.9` (pinned via `packageManager: pnpm@9.15.9` in root [`package.json`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/package.json)).
- **Classification**: **CONFIGURED**

---

## 5. Dependency Reproducibility

- **Command**: `pnpm install --frozen-lockfile` enforced across CI, Render blueprint, and Vercel build configs.
- **Classification**: **RUNTIME VERIFIED**

---

## 6. Secret Scanning

- **CI Secret Guard**: Custom automated regex check in CI for tracked `.env` files, Supabase service role keys (`SUPABASE_SERVICE_ROLE_KEY=ey...`), and Cashfree secret patterns.
- **Classification**: **CONFIGURED**

---

## 7. Vercel Architecture

- **Model**: Monorepo-aware multi-project topology connecting `apps/web`, `apps/seller-web`, and `apps/admin-web` independently to `github.com/peryton00/floria`.
- **Classification**: **DOCUMENTED & CONFIGURED**

---

## 8. Customer Web Deployment

- **Live URL**: `https://floriaa-web.vercel.app`
- **Hosting Provider**: Vercel
- **Live Response**: `HTTP 200 OK` (Latency: ~1698ms).
- **Classification**: **RUNTIME VERIFIED**

---

## 9. Seller Web Deployment Readiness

- **Package**: `@floria/seller-web` (`apps/seller-web`)
- **Build Status**: Local production build compiles cleanly (`pnpm build`).
- **Vercel Readiness**: Project settings, build scripts, and `.env.example` templates configured.
- **Classification**: **CONFIGURED (NOT YET DEPLOYED)**

---

## 10. Admin Web Deployment Readiness

- **Package**: `@floria/admin-web` (`apps/admin-web`)
- **Build Status**: Local production build compiles cleanly (`pnpm build`).
- **Vercel Readiness**: Project settings, build scripts, and `.env.example` templates configured.
- **Classification**: **CONFIGURED (NOT YET DEPLOYED)**

---

## 11. Render Architecture

- **Blueprint**: [render.yaml](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/render.yaml)
- **Service Name**: `floria-api`
- **Runtime**: Node.js
- **Build Command**: `pnpm install --frozen-lockfile && pnpm --filter @floria/api-client build && pnpm --filter @floria/api build`
- **Start Command**: `pnpm --filter @floria/api start`
- **Classification**: **CONFIGURED**

---

## 12. Backend Deployment

- **Live URL**: `https://floria-api.onrender.com`
- **Hosting Provider**: Render
- **Live Status**: `HTTP 200 OK`
- **Classification**: **RUNTIME VERIFIED**

---

## 13. Environment Variables

- **Client Variables**: Restricted strictly to `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*`.
- **Server Credentials**: `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `CASHFREE_CLIENT_SECRET`, `CASHFREE_WEBHOOK_SECRET` isolated to server vaults.
- **Classification**: **PASS**

---

## 14. Cashfree Configuration

- **Environment**: `CASHFREE_ENVIRONMENT=PRODUCTION`
- **API Version**: `2023-08-01`
- **Classification**: **CONFIGURED**

---

## 15. Health Checks

- **Process Liveness**: `GET https://floria-api.onrender.com/health` $\rightarrow$ `HTTP 200 OK` (`{"status":"healthy","service":"floria-api"}`).
- **Dependency Readiness**: `GET https://floria-api.onrender.com/ready` $\rightarrow$ `HTTP 200 OK` (`{"status":"ready","database":"connected"}`).
- **Classification**: **RUNTIME VERIFIED**

---

## 16. Preview Deployment Strategy

- Pull requests trigger GitHub Actions CI; upon merge to `main`, native provider Git hooks trigger automated production deployment.
- **Classification**: **DOCUMENTED**

---

## 17. Production Deployment Strategy

- Zero-downtime rolling updates on Render; instant atomic edge aliasing on Vercel.
- **Classification**: **DOCUMENTED**

---

## 18. Branch Protection

- Recommended GitHub branch protection for `main`:
  - Require pull request before merging.
  - Require status checks to pass (`secret-audit`, `typecheck-and-test`, `production-builds`).
  - Block force pushes and branch deletion.
- **Classification**: **PENDING MANUAL CONFIGURATION (GITHUB SETTINGS)**

---

## 19. GitHub Secrets

- No deployment tokens required in repository if native Vercel/Render GitHub App integrations are used.
- **Classification**: **DOCUMENTED**

---

## 20. Rollback Procedures

- Documented instant rollback capabilities in Vercel and Render dashboards without touching database migrations.
- **Classification**: **DOCUMENTED**

---

## 21. Deployment Concurrency

- Concurrency cancel-in-progress configured in `.github/workflows/ci.yml`.
- **Classification**: **CONFIGURED**

---

## 22. Build Verification

- All 5 production builds verified locally:
  - `@floria/api-client`: PASS
  - `@floria/api`: PASS
  - `@floria/seller-web`: PASS
  - `@floria/admin-web`: PASS
  - `@floria/web`: PASS
- **Classification**: **RUNTIME VERIFIED**

---

## 23. Live Endpoint Verification

- `https://floriaa-web.vercel.app`: `HTTP 200 OK` (Verified)
- `https://floria-api.onrender.com/health`: `HTTP 200 OK` (Verified)
- `https://floria-api.onrender.com/ready`: `HTTP 200 OK` (Verified)
- `https://floria-api.onrender.com/api/v1/catalog/products`: `HTTP 200 OK` (Verified)
- **Classification**: **RUNTIME VERIFIED**

---

## 24. Security Verification

- Zero secret leaks, 0 active Razorpay references, least-privilege GitHub Actions permissions.
- **Classification**: **PASS**

---

## 25. Documentation

- Created:
  - [STEP_17_CICD_DEPLOYMENT_ARCHITECTURE.md](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/docs/deployment/STEP_17_CICD_DEPLOYMENT_ARCHITECTURE.md)
  - [STEP_17_REPORT.md](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/docs/deployment/STEP_17_REPORT.md)
- **Classification**: **PASS**

---

## 26. Remaining Manual Actions

1. Connect `apps/seller-web` and `apps/admin-web` as new projects in the Vercel Dashboard (Step 18).
2. Enable branch protection rules on `main` in GitHub Repository Settings.

---

## 27. Risks

- Free/Starter tier cold starts on Render if inactive (mitigated via liveness pings).

---

## 28. Final Gate Evaluation

```text
STEP 17 FINAL GATE: CI/CD ARCHITECTURE ESTABLISHED
```
