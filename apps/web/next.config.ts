import type { NextConfig } from "next";
import path from "path";

// Supabase project hostname (used in CSP without hardcoding the full URL)
const supabaseHostname = process.env["NEXT_PUBLIC_SUPABASE_URL"]
  ? new URL(process.env["NEXT_PUBLIC_SUPABASE_URL"]).hostname
  : "*.supabase.co";

// Content-Security-Policy
// - Allows self, Supabase (API + Storage), Unsplash images, Google Fonts
// - No inline scripts (Next.js uses nonce in production; dev uses unsafe-inline)
// - unsafe-eval needed for Next.js dev mode only
const isDev = process.env["NODE_ENV"] === "development";

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https://${supabaseHostname} https://images.unsplash.com https://plus.unsplash.com`,
  `connect-src 'self' https://${supabaseHostname} https://nominatim.openstreetmap.org`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
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
        hostname: "*.supabase.co",
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
