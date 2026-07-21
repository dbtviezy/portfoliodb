import { prisma } from "@/lib/prisma";

export type LangCode = "en" | "ru";

export type ProjectItem = {
  id?: number;
  title: string;
  category: string;
  year: string;
  description: string;
  image: string;
  featured?: boolean;
  order?: number;
};

export type PortfolioContent = {
  navbar: {
    projects: string;
    contact: string;
  };
  hero: {
    location: string;
    text1: string;
    text2: string;
    desc: string;
    btn: string;
  };
  about: {
    title: string;
    profileImage: string;
    desc1: string;
    desc2: string;
    expertise: string;
    expertiseItems: string[];
    stats: Array<{ value: string; label: string }>;
  };
  projects: {
    title: string;
    showing: string;
    of: string;
    viewAll: string;
    allTitle: string;
    featured: ProjectItem[];
    allItems: ProjectItem[];
  };
  skills: {
    title: string;
    items: string[];
  };
  contact: {
    subtitle: string;
    title1: string;
    title2: string;
    button: string;
    email: string;
    telegram: string;
    behance: string;
    dribbble: string;
  };
};

export function toLangCode(lang: "RU" | "EN" | string): LangCode {
  return lang.toLowerCase() === "ru" ? "ru" : "en";
}

export function toDisplayLang(lang: LangCode): "RU" | "EN" {
  return lang === "ru" ? "RU" : "EN";
}

export async function getPortfolioContent(langInput: LangCode | "RU" | "EN"): Promise<PortfolioContent> {
  const lang = typeof langInput === "string" && langInput.length === 2
    ? toLangCode(langInput.toUpperCase() as "RU" | "EN")
    : (langInput as LangCode);

  const [portfolio, skills, expertise, projects] = await Promise.all([
    prisma.portfolio.findUnique({ where: { lang } }),
    prisma.skill.findMany({ where: { lang }, orderBy: { order: "asc" } }),
    prisma.expertiseItem.findMany({ where: { lang }, orderBy: { order: "asc" } }),
    prisma.project.findMany({ where: { lang }, orderBy: { order: "asc" } }),
  ]);

  if (!portfolio) {
    throw new Error(`Portfolio content for "${lang}" was not found`);
  }

  const allItems = projects.map(({ id, title, category, year, description, image, featured, order }) => ({
    id,
    title,
    category,
    year,
    description,
    image,
    featured,
    order,
  }));

  const featured = allItems.filter((project) => project.featured);

  return {
    navbar: {
      projects: portfolio.navbarProjects,
      contact: portfolio.navbarContact,
    },
    hero: {
      location: portfolio.heroLocation,
      text1: portfolio.heroText1,
      text2: portfolio.heroText2,
      desc: portfolio.heroDesc,
      btn: portfolio.heroBtn,
    },
    about: {
      title: portfolio.aboutTitle,
      profileImage: portfolio.profileImage,
      desc1: portfolio.aboutDesc1,
      desc2: portfolio.aboutDesc2,
      expertise: portfolio.aboutExpertise,
      expertiseItems: expertise.map((item) => item.name),
      stats: [
        { value: portfolio.aboutStats1Value, label: portfolio.aboutStats1Label },
        { value: portfolio.aboutStats2Value, label: portfolio.aboutStats2Label },
        { value: portfolio.aboutStats3Value, label: portfolio.aboutStats3Label },
      ],
    },
    projects: {
      title: portfolio.projectsTitle,
      showing: portfolio.projectsShowing,
      of: portfolio.projectsOf,
      viewAll: portfolio.projectsViewAll,
      allTitle: portfolio.projectsAllTitle,
      featured,
      allItems,
    },
    skills: {
      title: portfolio.skillsTitle,
      items: skills.map((skill) => skill.name),
    },
    contact: {
      subtitle: portfolio.contactSubtitle,
      title1: portfolio.contactTitle1,
      title2: portfolio.contactTitle2,
      button: portfolio.contactBtn,
      email: portfolio.contactEmail,
      telegram: portfolio.contactTelegram,
      behance: portfolio.contactBehance,
      dribbble: portfolio.contactDribbble,
    },
  };
}
