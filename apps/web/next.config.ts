import type { NextConfig } from "next";
import path from "path";

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
    ],
  },
  // Allow TypeScript path aliases to reach workspace packages
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
