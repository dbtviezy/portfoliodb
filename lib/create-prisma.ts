import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

function prismaLog() {
  return process.env.NODE_ENV === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);
}

/**
 * Local: DATABASE_URL=file:./dev.db (default).
 * Production on serverless: set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 * (libSQL). Plain file: SQLite will not persist on Vercel.
 */
export function createPrismaClient(): PrismaClient {
  const tursoUrl =
    process.env.TURSO_DATABASE_URL?.trim() ||
    (process.env.DATABASE_URL?.startsWith("libsql:")
      ? process.env.DATABASE_URL.trim()
      : undefined);
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl) {
    const libsql = createClient({
      url: tursoUrl,
      authToken,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({
      adapter,
      log: [...prismaLog()],
    });
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }

  return new PrismaClient({
    log: [...prismaLog()],
  });
}
