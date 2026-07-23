import { prisma } from "@/lib/prisma";
import { parseProjectLinks, type ProjectLink } from "@/lib/project-links";
import { resolveProjectGallery } from "@/lib/project-images";
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
  video?: string;
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
  const { emptyPortfolioContent } = await import("@/lib/empty-content");
  await ensureSchemaUpgrades();
  await ensureBlankPortfolioRows();

  const [portfolio, skills, expertise, projects] = await Promise.all([
    prisma.portfolio.findFirst({ where: { lang } }),
    prisma.skill.findMany({ where: { lang }, orderBy: { order: "asc" } }),
    prisma.expertiseItem.findMany({ where: { lang }, orderBy: { order: "asc" } }),
    prisma.project.findMany({ where: { lang }, orderBy: { order: "asc" } }),
  ]);

  if (!portfolio) {
    return emptyPortfolioContent(lang);
  }

  const { isUsableProfileImage } = await import("@/lib/media");
  let profileImage = portfolio.profileImage ?? "";
  if (!isUsableProfileImage(profileImage)) {
    const otherLang = lang === "en" ? "ru" : "en";
    const other = await prisma.portfolio.findFirst({
      where: { lang: otherLang },
      select: { profileImage: true },
    });
    if (isUsableProfileImage(other?.profileImage)) {
      profileImage = other!.profileImage;
      // Heal stock/empty row so the next language switch stays consistent.
      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { profileImage },
      });
    } else {
      profileImage = "";
    }
  }

  const allItems = projects.map(
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
      links,
      featured,
      completed,
      order,
    }) => {
      const gallery = resolveProjectGallery(image, images);
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
        video: video || "",
        links: parseProjectLinks(links),
        featured,
        completed: completed !== false,
        order,
      };
    }
  );

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
      profileImage,
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
      channels: resolveContactChannels(portfolio.contactChannels, {
        email: portfolio.contactEmail,
        telegram: portfolio.contactTelegram,
        behance: portfolio.contactBehance,
        dribbble: portfolio.contactDribbble,
        instagram: portfolio.contactInstagram ?? "",
      }),
      email: portfolio.contactEmail,
      telegram: portfolio.contactTelegram,
      behance: portfolio.contactBehance,
      dribbble: portfolio.contactDribbble,
      instagram: portfolio.contactInstagram ?? "",
    },
  };
}
