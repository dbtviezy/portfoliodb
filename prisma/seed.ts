import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../lib/create-prisma";
import { ensureBlankPortfolioRows } from "../lib/ensure-seed";

// Do not load dotenv during Vercel build / prepare-deploy-db — host env wins.
if (!process.env.VERCEL && !process.env.SEED_NO_DOTENV) {
  config({ path: ".env.example" });
  config({ path: ".env" });
}

const prisma = createPrismaClient();

/**
 * Default seed: admin (+ blank EN/RU portfolio rows).
 * Does NOT load Unsplash demo projects or locale bio.
 * Opt-in demo: SEED_DEMO=1 npm run db:seed
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (email && password) {
    const passwordHash = bcrypt.hashSync(password, 12);
    await prisma.admin.upsert({
      where: { email },
      create: { email, password: passwordHash },
      update: { password: passwordHash },
    });
    console.log(`Seeded admin user: ${email}`);
  } else {
    console.log(
      "Skipping admin seed (set ADMIN_EMAIL + ADMIN_PASSWORD). First Studio login can bootstrap when the Admin table is empty."
    );
  }

  await ensureBlankPortfolioRows();
  console.log("Blank portfolio rows ready (no demo projects/bio).");

  if (process.env.SEED_DEMO === "1") {
    console.warn("SEED_DEMO=1 is set, but demo locale seeding is disabled in production path.");
    console.warn("Add content only via Studio — it persists in Turso.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
