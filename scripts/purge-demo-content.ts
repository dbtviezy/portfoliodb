/**
 * One-shot: remove demo projects / skills / expertise and clear seeded bio copy
 * from Turso, keeping contacts + portrait.
 *
 *   npx dotenv -e .env -- npx tsx scripts/purge-demo-content.ts
 */
import { createPrismaClient } from "../lib/create-prisma";

async function main() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!url?.startsWith("libsql:") || !authToken) {
    console.error("Need TURSO_DATABASE_URL + TURSO_AUTH_TOKEN");
    process.exit(1);
  }

  const prisma = createPrismaClient();

  const deletedProjects = await prisma.project.deleteMany({});
  const deletedSkills = await prisma.skill.deleteMany({});
  const deletedExpertise = await prisma.expertiseItem.deleteMany({});

  await prisma.portfolio.updateMany({
    data: {
      heroLocation: "",
      heroText1: "",
      heroText2: "",
      heroDesc: "",
      aboutDesc1: "",
      aboutDesc2: "",
      aboutExpertise: "",
      aboutStats1Label: "",
      aboutStats1Value: "",
      aboutStats2Label: "",
      aboutStats2Value: "",
      aboutStats3Label: "",
      aboutStats3Value: "",
      // keep profileImage, contacts, navbar/section labels, CTAs
    },
  });

  console.log("Purged demo content from Turso:", {
    projects: deletedProjects.count,
    skills: deletedSkills.count,
    expertise: deletedExpertise.count,
  });
  console.log("Kept: portrait, contacts, Studio admin.");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
