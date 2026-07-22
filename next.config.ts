import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include the build-time SQLite snapshot in serverless function traces
  // so runtime can copy it to /tmp when Turso is not configured.
  outputFileTracingIncludes: {
    "/**": ["./prisma/deploy.db"],
    "/api/content": ["./prisma/deploy.db"],
    "/api/auth/login": ["./prisma/deploy.db"],
    "/api/auth/me": ["./prisma/deploy.db"],
    "/api/admin/portfolio": ["./prisma/deploy.db"],
    "/api/admin/projects": ["./prisma/deploy.db"],
    "/api/admin/projects/[id]": ["./prisma/deploy.db"],
    "/studio/dashboard": ["./prisma/deploy.db"],
  },
};

export default nextConfig;
