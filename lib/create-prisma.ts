import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { resolveServerlessSqliteUrl } from "@/lib/runtime-db";

function prismaLog() {
  return process.env.NODE_ENV === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);
}

/**
 * Local: DATABASE_URL=file:./dev.db (default).
 * Production on serverless: prefer TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 * Fallback: build-time prisma/deploy.db copied to /tmp (ephemeral).
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

  const serverlessFile = resolveServerlessSqliteUrl();
  if (serverlessFile) {
    process.env.DATABASE_URL = serverlessFile;
    return new PrismaClient({
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
