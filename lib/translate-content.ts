import { prisma } from "@/lib/prisma";
import {
  getPortfolioContent,
  type LangCode,
  type PortfolioContent,
} from "@/lib/content";
import {
  serializeContactChannels,
  type ContactChannel,
} from "@/lib/contact-channels";
import { parseProjectLinks, serializeProjectLinks } from "@/lib/project-links";
import { parseProjectImages, serializeProjectImages } from "@/lib/project-images";
import { translateFields, translateStringList } from "@/lib/translate-text";

function otherLang(lang: LangCode): LangCode {
  return lang === "en" ? "ru" : "en";
}

async function ensurePortfolioRow(lang: LangCode) {
  const existing = await prisma.portfolio.findFirst({ where: { lang } });
  if (existing) return existing;
  return prisma.portfolio.create({ data: { lang } });
}

async function syncListItems(
  lang: LangCode,
  model: "skill" | "expertise",
  items: string[]
) {
  if (model === "skill") {
    await prisma.skill.deleteMany({ where: { lang } });
    const cleaned = items.map((name) => name.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    await prisma.skill.createMany({
      data: cleaned.map((name, index) => ({ lang, name, order: index })),
    });
    return;
  }

  await prisma.expertiseItem.deleteMany({ where: { lang } });
  const cleaned = items.map((name) => name.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  await prisma.expertiseItem.createMany({
    data: cleaned.map((name, index) => ({ lang, name, order: index })),
  });
}

/** Read portfolio from source lang in DB, translate text, write to target lang. */
export async function translatePortfolioToOtherLang(
  sourceLang: LangCode
): Promise<{ targetLang: LangCode; content: PortfolioContent }> {
  const targetLang = otherLang(sourceLang);
  const source = await getPortfolioContent(sourceLang);

  const textFields = {
    heroLocation: source.hero.location,
    heroText1: source.hero.text1,
    heroText2: source.hero.text2,
    heroDesc: source.hero.desc,
    heroBtn: source.hero.btn,
    aboutTitle: source.about.title,
    aboutDesc1: source.about.desc1,
    aboutDesc2: source.about.desc2,
    aboutExpertise: source.about.expertise,
    aboutStats1Label: source.about.stats[0]?.label ?? "",
    aboutStats1Value: source.about.stats[0]?.value ?? "",
    aboutStats2Label: source.about.stats[1]?.label ?? "",
    aboutStats2Value: source.about.stats[1]?.value ?? "",
    aboutStats3Label: source.about.stats[2]?.label ?? "",
    aboutStats3Value: source.about.stats[2]?.value ?? "",
    contactSubtitle: source.contact.subtitle,
    contactTitle1: source.contact.title1,
    contactTitle2: source.contact.title2,
    contactBtn: source.contact.button,
    navbarProjects: source.navbar.projects,
    navbarContact: source.navbar.contact,
    skillsTitle: source.skills.title,
    projectsTitle: source.projects.title,
    projectsShowing: source.projects.showing,
    projectsOf: source.projects.of,
    projectsViewAll: source.projects.viewAll,
    projectsAllTitle: source.projects.allTitle,
  };

  const translated = await translateFields(textFields, sourceLang, targetLang);
  const skills = await translateStringList(source.skills.items, sourceLang, targetLang);
  const expertiseItems = await translateStringList(
    source.about.expertiseItems,
    sourceLang,
    targetLang
  );

  const channelLabelFields = Object.fromEntries(
    source.contact.channels.map((channel, index) => [`c${index}`, channel.label])
  );
  const translatedLabels = await translateFields(
    channelLabelFields,
    sourceLang,
    targetLang
  );
  const channels: ContactChannel[] = source.contact.channels.map((channel, index) => ({
    ...channel,
    label: translatedLabels[`c${index}`] || channel.label,
  }));

  const target = await ensurePortfolioRow(targetLang);
  await prisma.portfolio.update({
    where: { id: target.id },
    data: {
      ...translated,
      profileImage: source.about.profileImage,
      contactEmail: source.contact.email,
      contactTelegram: source.contact.telegram,
      contactBehance: source.contact.behance,
      contactDribbble: source.contact.dribbble,
      contactInstagram: source.contact.instagram,
      contactChannels: serializeContactChannels(channels),
    },
  });

  await syncListItems(targetLang, "skill", skills);
  await syncListItems(targetLang, "expertise", expertiseItems);

  const content = await getPortfolioContent(targetLang);
  return { targetLang, content };
}

/** Translate one project row into the other language (match by order, else create). */
export async function translateProjectToOtherLang(projectId: number): Promise<{
  targetLang: LangCode;
  projectId: number;
}> {
  const source = await prisma.project.findUnique({ where: { id: projectId } });
  if (!source) {
    throw new Error("Project not found");
  }

  const sourceLang = (source.lang === "ru" ? "ru" : "en") as LangCode;
  const targetLang = otherLang(sourceLang);
  const links = parseProjectLinks(source.links);

  const textFields: Record<string, string> = {
    title: source.title,
    category: source.category,
    description: source.description,
    detail: source.detail ?? "",
  };
  links.forEach((link, index) => {
    textFields[`linkLabel${index}`] = link.label;
  });

  const translated = await translateFields(textFields, sourceLang, targetLang);
  const translatedLinks = links.map((link, index) => ({
    label: translated[`linkLabel${index}`] || link.label,
    url: link.url,
  }));

  const images = parseProjectImages(source.images);
  const gallery = images.length > 0 ? images : source.image ? [source.image] : [];

  const existing = await prisma.project.findFirst({
    where: { lang: targetLang, order: source.order },
  });

  const data = {
    title: translated.title || source.title,
    category: translated.category || source.category,
    year: source.year,
    description: translated.description || source.description,
    detail: translated.detail ?? "",
    image: source.image,
    images: serializeProjectImages(gallery),
    video: source.video,
    links: serializeProjectLinks(translatedLinks),
    featured: source.featured,
    completed: source.completed,
    order: source.order,
  };

  let savedId: number;
  if (existing) {
    const updated = await prisma.project.update({
      where: { id: existing.id },
      data,
    });
    savedId = updated.id;
  } else {
    const created = await prisma.project.create({
      data: { lang: targetLang, ...data },
    });
    savedId = created.id;
  }

  return { targetLang, projectId: savedId };
}

/** Translate every project from source lang into the other lang. */
export async function translateAllProjectsToOtherLang(sourceLang: LangCode): Promise<{
  targetLang: LangCode;
  count: number;
}> {
  const targetLang = otherLang(sourceLang);
  const projects = await prisma.project.findMany({
    where: { lang: sourceLang },
    orderBy: { order: "asc" },
  });

  for (const project of projects) {
    await translateProjectToOtherLang(project.id);
  }

  return { targetLang, count: projects.length };
}
