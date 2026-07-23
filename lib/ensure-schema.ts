import { createClient } from "@libsql/client";

/**
 * Safe additive upgrades for existing Turso/SQLite DBs that were created
 * before newer Prisma fields existed. Idempotent — duplicate column errors
 * are ignored.
 */
const UPGRADES = [
  `ALTER TABLE "Project" ADD COLUMN "video" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Project" ADD COLUMN "videos" TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "Project" ADD COLUMN "images" TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "Project" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "Project" ADD COLUMN "imageFrame" TEXT NOT NULL DEFAULT '{"zoom":1,"x":50,"y":50}'`,
] as const;

let schemaReady: Promise<void> | null = null;

function tursoConfig(): { url: string; authToken?: string } | null {
  const url =
    process.env.TURSO_DATABASE_URL?.trim() ||
    (process.env.DATABASE_URL?.startsWith("libsql:")
      ? process.env.DATABASE_URL.trim()
      : undefined);
  if (!url) return null;
  return {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
  };
}

async function applyUpgrades(): Promise<void> {
  const turso = tursoConfig();
  if (!turso) return;

  const client = createClient({
    url: turso.url,
    authToken: turso.authToken,
  });

  for (const statement of UPGRADES) {
    try {
      await client.execute(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/duplicate column|already exists/i.test(message)) continue;
      // Older libsql phrasing for "column already there"
      if (/(video|videos|images|completed|imageFrame)/i.test(message) && /exists|duplicate/i.test(message)) {
        continue;
      }
      console.warn("[ensure-schema]", message);
    }
  }
}

/** Run once per process; safe to call from every content/admin request. */
export function ensureSchemaUpgrades(): Promise<void> {
  if (!schemaReady) {
    schemaReady = applyUpgrades().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
