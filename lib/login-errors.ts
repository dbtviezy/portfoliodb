import { Prisma } from "@prisma/client";

export type LoginErrorResponse = {
  error: string;
  code: "invalid_credentials" | "misconfigured" | "database" | "login_failed";
  status: number;
};

function isSqliteEphemeralHint(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  const hasTurso = Boolean(process.env.TURSO_DATABASE_URL?.trim());
  return !hasTurso && (url.startsWith("file:") || !url);
}

/** Map thrown errors to safe client messages (no secrets). */
export function mapLoginError(error: unknown): LoginErrorResponse {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  const prismaCode =
    error instanceof Prisma.PrismaClientKnownRequestError
      ? error.code
      : error instanceof Prisma.PrismaClientInitializationError
        ? "P1001"
        : undefined;

  const dbUnavailable =
    prismaCode === "P1001" ||
    prismaCode === "P1010" ||
    prismaCode === "P1003" ||
    lower.includes("unable to open the database") ||
    lower.includes("sqlite") ||
    lower.includes("no such table") ||
    lower.includes("does not exist") ||
    lower.includes("readonly database") ||
    lower.includes("attempt to write a readonly") ||
    lower.includes("error code 14") ||
    lower.includes("connect econnrefused");

  if (dbUnavailable) {
    const hint = isSqliteEphemeralHint()
      ? " Local file SQLite does not work on serverless hosts — use Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN) or a host with a persistent disk, then run prisma db push and seed."
      : " Check DATABASE_URL / Turso credentials, apply the schema (prisma db push or migration SQL), then seed or sign in once with ADMIN_EMAIL / ADMIN_PASSWORD to bootstrap.";

    return {
      error: `Database unavailable.${hint}`,
      code: "database",
      status: 503,
    };
  }

  return {
    error: "Login failed",
    code: "login_failed",
    status: 500,
  };
}

export function assertProductionSecrets(): LoginErrorResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (!process.env.JWT_SECRET?.trim()) {
    return {
      error: "Server misconfigured: JWT_SECRET is required in production.",
      code: "misconfigured",
      status: 503,
    };
  }
  return null;
}
