import { prisma } from "@/lib/prisma";
import { parseProjectLinks, type ProjectLink } from "@/lib/project-links";
import { resolveProjectGallery } from "@/lib/project-images";
import { resolveProjectVideos } from "@/lib/project-videos";
import { parseImageFrame } from "@/lib/image-frame";
import {
  resolveContactChannels,
  type ContactChannel,
} from "@/lib/contact-channels";

export type LangCode = "en" | "ru";

export type ProjectItem = {
  id?: number;
  title: string;
  category: string;
  year: string;
  description: string;
  detail?: string;
  image: string;
  /** Full gallery including cover; cover is also mirrored in `image`. */
  images?: string[];
  /** Cover framing: zoom + focus point for cards/carousel. */
  imageFrame?: { zoom: number; x: number; y: number };
  /** Primary / first video (file URL or Rutube/YouTube). */
  video?: string;
  /** Full video list including primary; primary is also mirrored in `video`. */
  videos?: string[];
  links?: ProjectLink[];
  featured?: boolean;
  /** Whether the work is finished. */
  completed?: boolean;
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
    channels: ContactChannel[];
    email: string;
    telegram: string;
    behance: string;
    dribbble: string;
    instagram: string;
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

  const { ensureSchemaUpgrades } = await import("@/lib/ensure-schema");
  const { ensureBlankPortfolioRows } = await import("@/lib/ensure-seed");
  const { ensureProjectLanguageMirrors } = await import("@/lib/project-sync");
  const { emptyPortfolioContent } = await import("@/lib/empty-content");
  await ensureSchemaUpgrades();
  await ensureBlankPortfolioRows();
  // Make sure EN/RU both have project rows so language switch never blanks the gallery.
  await ensureProjectLanguageMirrors();

  const other = lang === "en" ? "ru" : "en";

  const [portfolio, otherPortfolio, skills, expertise, projects] = await Promise.all([
    prisma.portfolio.findFirst({ where: { lang } }),
    prisma.portfolio.findFirst({ where: { lang: other } }),
    prisma.skill.findMany({ where: { lang }, orderBy: { order: "asc" } }),
    prisma.expertiseItem.findMany({ where: { lang }, orderBy: { order: "asc" } }),
    prisma.project.findMany({ where: { lang }, orderBy: { order: "asc" } }),
  ]);

  if (!portfolio) {
    return emptyPortfolioContent(lang);
  }

  const pickText = (value: string | null | undefined, fallback: string | null | undefined) => {
    if ((value ?? "").trim()) return value ?? "";
    return fallback ?? "";
  };

  const { isUsableProfileImage } = await import("@/lib/media");
  let profileImage = portfolio.profileImage ?? "";
  if (!isUsableProfileImage(profileImage)) {
    if (isUsableProfileImage(otherPortfolio?.profileImage)) {
      profileImage = otherPortfolio!.profileImage;
      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { profileImage },
      });
    } else {
      profileImage = "";
    }
  }

  let projectRows = projects;
  if (projectRows.length === 0) {
    projectRows = await prisma.project.findMany({
      where: { lang: other },
      orderBy: { order: "asc" },
    });
  }

  const allItems = projectRows.map(
    ({
      id,
      title,
      category,
      year,
      description,
      detail,
      image,
      images,
      imageFrame,
      video,
      videos,
      links,
      featured,
      completed,
      order,
    }) => {
      const gallery = resolveProjectGallery(image, images);
      const videoList = resolveProjectVideos(video, videos);
      return {
        id,
        title,
        category,
        year,
        description,
        detail: detail || "",
        image: gallery[0] || image,
        images: gallery,
        imageFrame: parseImageFrame(imageFrame),
        video: videoList[0] || "",
        videos: videoList,
        links: parseProjectLinks(links),
        featured,
        completed: completed !== false,
        order,
      };
    }
  );

  const featured = allItems.filter((project) => project.featured);

  let skillItems = skills.map((skill) => skill.name);
  if (skillItems.length === 0) {
    skillItems = (
      await prisma.skill.findMany({ where: { lang: other }, orderBy: { order: "asc" } })
    ).map((skill) => skill.name);
  }

  let expertiseItems = expertise.map((item) => item.name);
  if (expertiseItems.length === 0) {
    expertiseItems = (
      await prisma.expertiseItem.findMany({
        where: { lang: other },
        orderBy: { order: "asc" },
      })
    ).map((item) => item.name);
  }

  const legacy = {
    email: portfolio.contactEmail,
    telegram: portfolio.contactTelegram,
    behance: portfolio.contactBehance,
    dribbble: portfolio.contactDribbble,
    instagram: portfolio.contactInstagram ?? "",
  };
  let channels = resolveContactChannels(portfolio.contactChannels, legacy);
  if (channels.length === 0 && otherPortfolio) {
    channels = resolveContactChannels(otherPortfolio.contactChannels, {
      email: otherPortfolio.contactEmail,
      telegram: otherPortfolio.contactTelegram,
      behance: otherPortfolio.contactBehance,
      dribbble: otherPortfolio.contactDribbble,
      instagram: otherPortfolio.contactInstagram ?? "",
    });
  }

  return {
    navbar: {
      projects: pickText(portfolio.navbarProjects, otherPortfolio?.navbarProjects),
      contact: pickText(portfolio.navbarContact, otherPortfolio?.navbarContact),
    },
    hero: {
      location: pickText(portfolio.heroLocation, otherPortfolio?.heroLocation),
      text1: pickText(portfolio.heroText1, otherPortfolio?.heroText1),
      text2: pickText(portfolio.heroText2, otherPortfolio?.heroText2),
      desc: pickText(portfolio.heroDesc, otherPortfolio?.heroDesc),
      btn: pickText(portfolio.heroBtn, otherPortfolio?.heroBtn),
    },
    about: {
      title: pickText(portfolio.aboutTitle, otherPortfolio?.aboutTitle),
      profileImage,
      desc1: pickText(portfolio.aboutDesc1, otherPortfolio?.aboutDesc1),
      desc2: pickText(portfolio.aboutDesc2, otherPortfolio?.aboutDesc2),
      expertise: pickText(portfolio.aboutExpertise, otherPortfolio?.aboutExpertise),
      expertiseItems,
      stats: [
        {
          value: pickText(portfolio.aboutStats1Value, otherPortfolio?.aboutStats1Value),
          label: pickText(portfolio.aboutStats1Label, otherPortfolio?.aboutStats1Label),
        },
        {
          value: pickText(portfolio.aboutStats2Value, otherPortfolio?.aboutStats2Value),
          label: pickText(portfolio.aboutStats2Label, otherPortfolio?.aboutStats2Label),
        },
        {
          value: pickText(portfolio.aboutStats3Value, otherPortfolio?.aboutStats3Value),
          label: pickText(portfolio.aboutStats3Label, otherPortfolio?.aboutStats3Label),
        },
      ],
    },
    projects: {
      title: pickText(portfolio.projectsTitle, otherPortfolio?.projectsTitle),
      showing: pickText(portfolio.projectsShowing, otherPortfolio?.projectsShowing),
      of: pickText(portfolio.projectsOf, otherPortfolio?.projectsOf),
      viewAll: pickText(portfolio.projectsViewAll, otherPortfolio?.projectsViewAll),
      allTitle: pickText(portfolio.projectsAllTitle, otherPortfolio?.projectsAllTitle),
      featured,
      allItems,
    },
    skills: {
      title: pickText(portfolio.skillsTitle, otherPortfolio?.skillsTitle),
      items: skillItems,
    },
    contact: {
      subtitle: pickText(portfolio.contactSubtitle, otherPortfolio?.contactSubtitle),
      title1: pickText(portfolio.contactTitle1, otherPortfolio?.contactTitle1),
      title2: pickText(portfolio.contactTitle2, otherPortfolio?.contactTitle2),
      button: pickText(portfolio.contactBtn, otherPortfolio?.contactBtn),
      channels,
      email: pickText(portfolio.contactEmail, otherPortfolio?.contactEmail),
      telegram: pickText(portfolio.contactTelegram, otherPortfolio?.contactTelegram),
      behance: pickText(portfolio.contactBehance, otherPortfolio?.contactBehance),
      dribbble: pickText(portfolio.contactDribbble, otherPortfolio?.contactDribbble),
      instagram: pickText(portfolio.contactInstagram, otherPortfolio?.contactInstagram),
    },
  };
}
