import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable turbopack for API routes to avoid runtime issues
    turbo: {
      resolveAlias: {
        // Ensure proper module resolution
        '@': './src',
      },
    },
  },
};

export default nextConfig;
