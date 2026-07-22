/**
 * Apply Prisma schema + optional admin seed to Turso.
 *
 * Usage:
 *   TURSO_DATABASE_URL="libsql://..." \
 *   TURSO_AUTH_TOKEN="..." \
 *   ADMIN_EMAIL="you@email.com" \
 *   ADMIN_PASSWORD="your-password" \
 *   npm run db:turso
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { createPrismaClient } from "../lib/create-prisma";
import { hashPassword } from "../lib/auth";

function splitSqlStatements(sql: string): string[] {
  const withoutBlockComments = sql.replace(/\/\*[\s\S]*?\*\//g, "");
  return withoutBlockComments
    .split(";")
    .map((chunk) =>
      chunk
        .split("\n")
        .map((line) => line.replace(/^\s*--.*$/, "").trimEnd())
        .join("\n")
        .trim()
    )
    .filter((statement) => statement.length > 0);
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url?.startsWith("libsql:")) {
    console.error("Set TURSO_DATABASE_URL=libsql://...");
    process.exit(1);
  }
  if (!authToken) {
    console.error("Set TURSO_AUTH_TOKEN=...");
    process.exit(1);
  }

  const sqlPath = path.join(process.cwd(), "prisma", "turso-schema.sql");
  const sql = readFileSync(sqlPath, "utf8");
  const statements = splitSqlStatements(sql);

  const client = createClient({ url, authToken });

  console.log(`Applying ${statements.length} SQL statements to Turso...`);
  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/already exists|duplicate/i.test(message)) {
        console.log(`skip: ${message}`);
        continue;
      }
      throw error;
    }
  }
  console.log("Schema applied.");

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const prisma = createPrismaClient();
    await prisma.admin.upsert({
      where: { email },
      create: { email, password: hashPassword(password) },
      update: { password: hashPassword(password) },
    });
    console.log(`Admin ready: ${email}`);
    await prisma.$disconnect();
  } else {
    console.log("Skip admin (set ADMIN_EMAIL + ADMIN_PASSWORD to upsert).");
  }

  console.log("Done. Open /studio and sign in.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
