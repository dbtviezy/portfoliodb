import { existsSync, unlinkSync } from "node:fs";
import { createPrismaClient } from "../lib/create-prisma";

async function main() {
  const dest = "/tmp/portfoliodb.db";
  if (existsSync(dest)) unlinkSync(dest);

  process.env.VERCEL = "1";
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;

  const prisma = createPrismaClient();
  const portfolios = await prisma.portfolio.count();
  const admins = await prisma.admin.count();
  console.log({ portfolios, admins, databaseUrl: process.env.DATABASE_URL });
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
