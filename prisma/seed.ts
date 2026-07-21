import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import en from "../locales/en.json";
import ru from "../locales/ru.json";

const prisma = new PrismaClient();

type LocaleData = typeof en;

async function seedLanguage(lang: "en" | "ru", data: LocaleData) {
  await prisma.portfolio.upsert({
    where: { lang },
    create: {
      lang,
      heroLocation: data.hero.location,
      heroText1: data.hero.text1,
      heroText2: data.hero.text2,
      heroDesc: data.hero.desc,
      heroBtn: data.hero.btn,
      aboutTitle: data.about.title,
      aboutDesc1: data.about.desc1,
      aboutDesc2: data.about.desc2,
      aboutExpertise: data.about.expertise,
      profileImage: data.about.profileImage,
      aboutStats1Value: data.about.stats[0].value,
      aboutStats1Label: data.about.stats[0].label,
      aboutStats2Value: data.about.stats[1].value,
      aboutStats2Label: data.about.stats[1].label,
      aboutStats3Value: data.about.stats[2].value,
      aboutStats3Label: data.about.stats[2].label,
      contactSubtitle: data.contact.subtitle,
      contactTitle1: data.contact.title1,
      contactTitle2: data.contact.title2,
      contactBtn: data.contact.button,
      contactEmail: "daniilbautin0@gmail.com",
      contactTelegram: "@dbtviezy",
      contactBehance: "behance.net/3606019f",
      contactDribbble: "dribbble.com/db-tviezy",
      navbarProjects: data.navbar.projects,
      navbarContact: data.navbar.contact,
      skillsTitle: data.skills.title,
      projectsTitle: data.projects.title,
      projectsShowing: data.projects.showing,
      projectsOf: data.projects.of,
      projectsViewAll: data.projects.viewAll,
      projectsAllTitle: data.projects.allTitle,
    },
    update: {
      heroLocation: data.hero.location,
      heroText1: data.hero.text1,
      heroText2: data.hero.text2,
      heroDesc: data.hero.desc,
      heroBtn: data.hero.btn,
      aboutTitle: data.about.title,
      aboutDesc1: data.about.desc1,
      aboutDesc2: data.about.desc2,
      aboutExpertise: data.about.expertise,
      profileImage: data.about.profileImage,
      aboutStats1Value: data.about.stats[0].value,
      aboutStats1Label: data.about.stats[0].label,
      aboutStats2Value: data.about.stats[1].value,
      aboutStats2Label: data.about.stats[1].label,
      aboutStats3Value: data.about.stats[2].value,
      aboutStats3Label: data.about.stats[2].label,
      contactSubtitle: data.contact.subtitle,
      contactTitle1: data.contact.title1,
      contactTitle2: data.contact.title2,
      contactBtn: data.contact.button,
      navbarProjects: data.navbar.projects,
      navbarContact: data.navbar.contact,
      skillsTitle: data.skills.title,
      projectsTitle: data.projects.title,
      projectsShowing: data.projects.showing,
      projectsOf: data.projects.of,
      projectsViewAll: data.projects.viewAll,
      projectsAllTitle: data.projects.allTitle,
    },
  });

  await prisma.skill.deleteMany({ where: { lang } });
  await prisma.skill.createMany({
    data: data.skills.items.map((name, order) => ({ lang, name, order })),
  });

  await prisma.expertiseItem.deleteMany({ where: { lang } });
  await prisma.expertiseItem.createMany({
    data: data.about.expertiseItems.map((name, order) => ({ lang, name, order })),
  });

  await prisma.project.deleteMany({ where: { lang } });
  await prisma.project.createMany({
    data: data.projects.allItems.map((project, order) => ({
      lang,
      title: project.title,
      category: project.category,
      year: project.year,
      description: project.description,
      image: project.image,
      featured: data.projects.featured.some((item) => item.title === project.title),
      order,
    })),
  });
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@portfoliodb.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  const passwordHash = bcrypt.hashSync(password, 12);

  await prisma.admin.upsert({
    where: { email },
    create: { email, password: passwordHash },
    update: { password: passwordHash },
  });

  await seedLanguage("en", en);
  await seedLanguage("ru", ru);

  console.log(`Seeded admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
