import type { NextConfig } from "next";
import path from "path";

// Supabase project hostname (used in CSP without hardcoding the full URL)
const supabaseHostname = process.env["NEXT_PUBLIC_SUPABASE_URL"]
  ? new URL(process.env["NEXT_PUBLIC_SUPABASE_URL"]).hostname
  : "*.supabase.co";

// API Backend project hostname (used in CSP)
const apiHostname = process.env["NEXT_PUBLIC_API_URL"]
  ? new URL(process.env["NEXT_PUBLIC_API_URL"]).hostname
  : "*.onrender.com";

// Content-Security-Policy
// - Allows self, Supabase (API + Storage), Render API, Unsplash images, Google Fonts, Vercel Live
const isDev = process.env["NODE_ENV"] === "development";

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://sdk.cashfree.com https://*.cashfree.com https://js.sentry-cdn.com https://*.sentry.io https://vercel.live https://*.vercel.app${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://sdk.cashfree.com https://*.cashfree.com`,
  `font-src 'self' https://fonts.gstatic.com https://vercel.live https://*.vercel.app`,
  `img-src 'self' data: blob: https://${supabaseHostname} https://*.supabase.co https://images.unsplash.com https://plus.unsplash.com https://sdk.cashfree.com https://*.cashfree.com${isDev ? " http://localhost:* http://127.0.0.1:*" : ""}`,
  `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname} https://*.supabase.co wss://*.supabase.co https://${apiHostname} https://*.onrender.com https://floria-api.onrender.com https://sdk.cashfree.com https://*.cashfree.com https://sandbox.cashfree.com https://api.cashfree.com https://payments.cashfree.com https://*.sentry.io https://nominatim.openstreetmap.org https://vercel.live https://*.vercel.app wss://*.vercel.app https://*.pusher.com wss://*.pusher.com${isDev ? " http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*" : ""}`,
  `frame-src 'self' https://sdk.cashfree.com https://*.cashfree.com https://sandbox.cashfree.com https://api.cashfree.com https://payments.cashfree.com https://vercel.live https://*.vercel.app`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self' https://*.cashfree.com https://sandbox.cashfree.com https://api.cashfree.com https://payments.cashfree.com`,
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=*" },
  { key: "Content-Security-Policy", value: csp },
  // HSTS only in production — avoid breaking local dev with http://
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // Allow Turbopack to resolve monorepo packages from the workspace root
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  // Image optimization — allow Supabase storage domain once configured
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flymwzdtsrkiiriqaswc.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
  // Allow TypeScript path aliases to reach workspace packages
  experimental: {
    externalDir: true,
  },
  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
