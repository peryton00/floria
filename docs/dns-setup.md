# Floria — Custom DNS Setup Guide

This guide provides step-by-step instructions for pointing your custom domain (e.g. `floria.in`) to the production web application on Vercel, the REST API on Render, and Supabase Auth.

---

## 1. Domain Overview & Subdomains

| Service              | Target Domain / Subdomain | Target Provider Record Type | Target Destination                   |
| -------------------- | ------------------------- | --------------------------- | ------------------------------------ |
| **Web App Root**     | `floria.in`               | **A Record**                | `76.76.21.21` (Vercel IP)            |
| **Web App WWW**      | `www.floria.in`           | **CNAME Record**            | `cname.vercel-dns.com`               |
| **Backend REST API** | `api.floria.in`           | **CNAME Record**            | `<your-render-service>.onrender.com` |

---

## 2. Step-by-Step DNS Provider Configuration (GoDaddy / Namecheap / Cloudflare)

Log into your DNS Registrar dashboard (where you bought `floria.in`) and add the following records under **DNS Management**:

### A. Point Web Frontend (`floria.in` & `www.floria.in`)

1. **Apex/Root (`@`)**:
   - **Type**: `A`
   - **Name**: `@` (or leave blank depending on provider)
   - **Value**: `76.76.21.21`
   - **TTL**: Auto / 3600
2. **WWW Subdomain**:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: Auto / 3600

### B. Point Backend API (`api.floria.in`)

1. In your **Render Dashboard** → Select `floria-api` web service → **Settings** → **Custom Domains** → Click **Add Custom Domain** → Enter `api.floria.in`.
2. In your **DNS Registrar Dashboard**:
   - **Type**: `CNAME`
   - **Name**: `api`
   - **Value**: `floria-api.onrender.com` _(Copy exact CNAME provided by Render)_
   - **TTL**: Auto / 3600

---

## 3. Update Vercel / Web Host Dashboard

1. Go to **Vercel Dashboard → Project Settings → Domains**.
2. Add `floria.in` and `www.floria.in`.
3. Vercel will automatically verify DNS propagation and issue a free Let's Encrypt TLS/SSL Certificate.

---

## 4. Update Supabase Auth & Google OAuth Settings

Once your custom domains are active:

1. **Supabase Dashboard → Authentication → URL Configuration**:
   - **Site URL**: `https://floria.in`
   - **Redirect URIs**:
     - `https://floria.in/auth/callback`
     - `https://www.floria.in/auth/callback`

2. **Google Cloud Console → Credentials → Your OAuth 2.0 Client ID**:
   - **Authorized JavaScript origins**:
     - `https://floria.in`
     - `https://www.floria.in`
   - **Authorized redirect URIs**:
     - `https://flymwzdtsrkiiriqaswc.supabase.co/auth/v1/callback`
     - `https://floria.in/auth/callback`

3. **Update Environment Variables**:
   - On **Vercel**: Set `NEXT_PUBLIC_APP_URL=https://floria.in` and `NEXT_PUBLIC_API_URL=https://api.floria.in/api/v1`
   - On **Render**: Set `CORS_ALLOWED_ORIGINS=https://floria.in,https://www.floria.in`

---

## 5. Verification Commands

After DNS records propagate (usually 5 to 15 minutes):

```bash
# Verify Web App DNS
nslookup floria.in

# Verify API DNS
nslookup api.floria.in

# Verify Live HTTPS API Liveness
curl -i https://api.floria.in/health
```
