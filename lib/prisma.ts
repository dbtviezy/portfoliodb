import { PrismaClient } from "@prisma/client";

// Next.js loads .env. Do not dotenv .env.example here — it can give Node a
// different JWT_SECRET than Edge middleware and break studio login.

import { createPrismaClient } from "@/lib/create-prisma";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
