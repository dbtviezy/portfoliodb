import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const DEPLOY_DB_RELATIVE = path.join("prisma", "deploy.db");

/**
 * On Vercel (and similar serverless hosts) without Turso, copy the
 * build-time SQLite snapshot to /tmp so Prisma can open a writable file.
 * Edits are per-instance / ephemeral until Turso is configured.
 */
export function resolveServerlessSqliteUrl(): string | null {
  const onServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!onServerless) return null;

  const source = path.join(process.cwd(), DEPLOY_DB_RELATIVE);
  if (!existsSync(source)) return null;

  const destDir = "/tmp";
  try {
    mkdirSync(destDir, { recursive: true });
  } catch {
    // /tmp should exist on Lambda/Vercel
  }

  const dest = path.join(destDir, "portfoliodb.db");
  if (!existsSync(dest)) {
    copyFileSync(source, dest);
  }

  // Prisma file URLs: absolute paths need three slashes — file:///tmp/...
  return `file:${dest}`;
}

export { DEPLOY_DB_RELATIVE };
