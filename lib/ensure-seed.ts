import { prisma } from "@/lib/prisma";
import { serializeContactChannels } from "@/lib/contact-channels";

/**
 * Ensure EN/RU Portfolio rows exist without importing locale demo copy,
 * Unsplash projects, skills, or bio text.
 */
export async function ensureBlankPortfolioRows(): Promise<void> {
  for (const lang of ["en", "ru"] as const) {
    const existing = await prisma.portfolio.findFirst({ where: { lang } });
    if (existing) continue;

    await prisma.portfolio.create({
      data: {
        lang,
        heroLocation: "",
        heroText1: "",
        heroText2: "",
        heroDesc: "",
        heroBtn: lang === "ru" ? "Работы" : "Work",
        aboutTitle: lang === "ru" ? "Обо мне" : "About",
        aboutDesc1: "",
        aboutDesc2: "",
        aboutExpertise: "",
        profileImage: "",
        aboutStats1Label: "",
        aboutStats1Value: "",
        aboutStats2Label: "",
        aboutStats2Value: "",
        aboutStats3Label: "",
        aboutStats3Value: "",
        contactSubtitle: "",
        contactTitle1: "",
        contactTitle2: "",
        contactBtn: lang === "ru" ? "Написать" : "Write",
        contactEmail: "",
        contactTelegram: "",
        contactBehance: "",
        contactDribbble: "",
        contactInstagram: "",
        contactChannels: serializeContactChannels([]),
        navbarProjects: lang === "ru" ? "Проекты" : "Projects",
        navbarContact: lang === "ru" ? "Контакты" : "Contact",
        skillsTitle: lang === "ru" ? "Навыки" : "Skills",
        projectsTitle: lang === "ru" ? "Работы" : "Work",
        projectsShowing: lang === "ru" ? "Показано" : "Showing",
        projectsOf: lang === "ru" ? "из" : "of",
        projectsViewAll: lang === "ru" ? "Все работы" : "View all",
        projectsAllTitle: lang === "ru" ? "Все работы" : "All work",
      },
    });
  }
}

/** @deprecated Demo locale seeding removed — use ensureBlankPortfolioRows. */
export async function ensurePortfolioSeeded(): Promise<void> {
  await ensureBlankPortfolioRows();
}
