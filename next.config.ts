import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include the build-time SQLite snapshot in serverless function traces
  // so runtime can copy it to /tmp when Turso is not configured.
  outputFileTracingIncludes: {
    "/**": ["./prisma/deploy.db"],
  },
};

export default nextConfig;
