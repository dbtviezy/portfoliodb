/**
 * Build-time helper for Vercel: create prisma/deploy.db with schema + admin/blank rows.
 * Runtime copies this file to /tmp when Turso is not configured.
 * Does NOT seed Unsplash demo projects — content comes from Studio/Turso.
 */
import { spawnSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "deploy.db");
const databaseUrl = `file:${dbPath.replace(/\\/g, "/")}`;

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      // Prefer file DB during prepare — ignore Turso for the snapshot.
      TURSO_DATABASE_URL: "",
      TURSO_AUTH_TOKEN: "",
      SEED_NO_DOTENV: "1",
    },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}

console.log(`Preparing deploy SQLite at ${dbPath}`);
run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);
run("npx", ["tsx", "prisma/seed.ts"]);
console.log("Deploy DB ready.");
