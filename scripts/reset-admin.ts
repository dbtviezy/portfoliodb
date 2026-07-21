import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.example" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@portfoliodb.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  const passwordHash = bcrypt.hashSync(password, 12);

  await prisma.admin.upsert({
    where: { email },
    create: { email, password: passwordHash },
    update: { password: passwordHash },
  });

  console.log(`Admin account synced for: ${email}`);
  console.log("Sign in with ADMIN_EMAIL and ADMIN_PASSWORD from your .env file.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
