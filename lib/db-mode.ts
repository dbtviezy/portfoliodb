/**
 * How the portfolio stores data — used by Studio writes and status UI.
 *
 * - Local / VPS: SQLite file (DATABASE_URL=file:...) — durable on disk
 * - Vercel + Turso: durable (required for Studio saves that stick)
 * - Vercel without Turso: /tmp copy of deploy.db — readable, writes do not stick
 */

export function isTursoConfigured(): boolean {
  const turso = process.env.TURSO_DATABASE_URL?.trim();
  const asDatabaseUrl = process.env.DATABASE_URL?.trim().startsWith("libsql:");
  return Boolean(turso || asDatabaseUrl);
}

export function isVercelServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/** True when Studio edits will not reliably persist across requests. */
export function isEphemeralDatabase(): boolean {
  return isVercelServerless() && !isTursoConfigured();
}

export type DbMode = "turso" | "ephemeral" | "sqlite-file";

export function getDbMode(): DbMode {
  if (isTursoConfigured()) return "turso";
  if (isEphemeralDatabase()) return "ephemeral";
  return "sqlite-file";
}

export function ephemeralWriteError(): string {
  return (
    "На Vercel без Turso сохранения не держатся (база в /tmp). " +
    "Добавь TURSO_DATABASE_URL и TURSO_AUTH_TOKEN в Vercel → Environment Variables, " +
    "примени схему к Turso, затем Redeploy. Подробности — в README."
  );
}
