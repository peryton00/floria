import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  experimental: {
    externalDir: true,
  },
  async rewrites() {
    return [
      {
        source: "/admin/:path*",
        destination: "/:path*",
      },
    ];
  },
};

export default nextConfig;
