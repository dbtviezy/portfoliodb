import en from "@/locales/en.json";
import ru from "@/locales/ru.json";
import { prisma } from "@/lib/prisma";

type LocaleData = typeof en;

async function seedLanguage(lang: "en" | "ru", data: LocaleData) {
  const portfolioData = {
    heroLocation: data.hero.location,
    heroText1: data.hero.text1,
    heroText2: data.hero.text2,
    heroDesc: data.hero.desc,
    heroBtn: data.hero.btn,
    aboutTitle: data.about.title,
    aboutDesc1: data.about.desc1,
    aboutDesc2: data.about.desc2,
    aboutExpertise: data.about.expertise,
    profileImage: data.about.profileImage || "",
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
    contactInstagram: "",
    contactChannels: JSON.stringify([
      {
        label: "Email",
        value: "daniilbautin0@gmail.com",
        url: "mailto:daniilbautin0@gmail.com",
        group: "primary",
      },
      {
        label: "Telegram",
        value: "@dbtviezy",
        url: "https://t.me/dbtviezy",
        group: "primary",
      },
      {
        label: "Behance",
        value: "behance.net/3606019f",
        url: "https://behance.net/3606019f",
        group: "social",
      },
      {
        label: "Dribbble",
        value: "dribbble.com/db-tviezy",
        url: "https://dribbble.com/db-tviezy",
        group: "social",
      },
    ]),
    navbarProjects: data.navbar.projects,
    navbarContact: data.navbar.contact,
    skillsTitle: data.skills.title,
    projectsTitle: data.projects.title,
    projectsShowing: data.projects.showing,
    projectsOf: data.projects.of,
    projectsViewAll: data.projects.viewAll,
    projectsAllTitle: data.projects.allTitle,
  };

  const existing = await prisma.portfolio.findFirst({ where: { lang } });
  if (existing) {
    await prisma.portfolio.update({ where: { id: existing.id }, data: portfolioData });
  } else {
    await prisma.portfolio.create({ data: { lang, ...portfolioData } });
  }

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
      detail: project.description,
      image: project.image,
      images: JSON.stringify(project.image ? [project.image] : []),
      imageFrame: JSON.stringify({ zoom: 1, x: 50, y: 50 }),
      video: "",
      links: JSON.stringify([
        { label: "Behance", url: "https://behance.net/3606019f" },
        { label: "Dribbble", url: "https://dribbble.com/dbtviezy" },
      ]),
      featured: data.projects.featured.some((item) => item.title === project.title),
      completed: true,
      order,
    })),
  });
}

let seedPromise: Promise<void> | null = null;

/** If Portfolio is empty (fresh Turso / empty DB), seed once from locale JSON. */
export async function ensurePortfolioSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const count = await prisma.portfolio.count();
    if (count > 0) return;
    console.info("Bootstrap: seeding portfolio content from locales");
    await seedLanguage("en", en);
    await seedLanguage("ru", ru);
  })().catch((error) => {
    seedPromise = null;
    throw error;
  });

  return seedPromise;
}
