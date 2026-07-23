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
import {
  detectRuOrEnFromFields,
  otherLang,
  translateFields,
  translateStringList,
} from "@/lib/translate-text";

async function ensurePortfolioRow(lang: LangCode) {
  const { ensureBlankPortfolioRows } = await import("@/lib/ensure-seed");
  await ensureBlankPortfolioRows();
  const existing = await prisma.portfolio.findFirst({ where: { lang } });
  if (!existing) {
    throw new Error(`Portfolio row missing for ${lang}`);
  }
  return existing;
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

/**
 * Read portfolio from Studio lang row, auto-detect RU/EN from the text,
 * translate to the other language, save into that cloud row.
 */
export async function translatePortfolioToOtherLang(
  studioLang: LangCode
): Promise<{ sourceLang: LangCode; targetLang: LangCode; content: PortfolioContent }> {
  const source = await getPortfolioContent(studioLang);

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

  // Auto-detect from real copy (not only Studio tab).
  const detected = detectRuOrEnFromFields(textFields, studioLang);
  const targetLang = otherLang(detected);

  const translated = await translateFields(textFields, detected, targetLang);
  const skills = await translateStringList(source.skills.items, detected, targetLang);
  const expertiseItems = await translateStringList(
    source.about.expertiseItems,
    detected,
    targetLang
  );

  const channelLabelFields = Object.fromEntries(
    source.contact.channels.map((channel, index) => [`c${index}`, channel.label])
  );
  const translatedLabels = await translateFields(
    channelLabelFields,
    detected,
    targetLang
  );
  const channels: ContactChannel[] = source.contact.channels.map((channel, index) => ({
    ...channel,
    label: translatedLabels.fields[`c${index}`] || channel.label,
  }));

  const target = await ensurePortfolioRow(targetLang);
  await prisma.portfolio.update({
    where: { id: target.id },
    data: {
      ...translated.fields,
      profileImage: source.about.profileImage,
      contactEmail: source.contact.email,
      contactTelegram: source.contact.telegram,
      contactBehance: source.contact.behance,
      contactDribbble: source.contact.dribbble,
      contactInstagram: source.contact.instagram,
      contactChannels: serializeContactChannels(channels),
    },
  });

  await syncListItems(targetLang, "skill", skills.items);
  await syncListItems(targetLang, "expertise", expertiseItems.items);

  const content = await getPortfolioContent(targetLang);
  return { sourceLang: detected, targetLang, content };
}

/** Translate one project: detect RU/EN from its text → write into the other lang row. */
export async function translateProjectToOtherLang(projectId: number): Promise<{
  sourceLang: LangCode;
  targetLang: LangCode;
  projectId: number;
}> {
  const source = await prisma.project.findUnique({ where: { id: projectId } });
  if (!source) {
    throw new Error("Project not found");
  }

  const rowLang = (source.lang === "ru" ? "ru" : "en") as LangCode;
  const links = parseProjectLinks(source.links);

  const textFields: Record<string, string> = {
    // title + category stay shared across EN/RU — do not translate
    description: source.description,
    detail: source.detail ?? "",
  };
  links.forEach((link, index) => {
    textFields[`linkLabel${index}`] = link.label;
  });

  const detected = detectRuOrEnFromFields(
    {
      ...textFields,
      // Include title only for language detection, not for translation output.
      _sample: `${source.title} ${source.description} ${source.detail ?? ""}`,
    },
    rowLang
  );
  const targetLang = otherLang(detected);

  const translated = await translateFields(textFields, detected, targetLang);
  const translatedLinks = links.map((link, index) => ({
    label: translated.fields[`linkLabel${index}`] || link.label,
    url: link.url,
  }));

  const images = parseProjectImages(source.images);
  const gallery = images.length > 0 ? images : source.image ? [source.image] : [];

  const existing = await prisma.project.findFirst({
    where: { lang: targetLang, order: source.order },
  });

  const data = {
    title: source.title,
    category: source.category,
    year: source.year,
    description: translated.fields.description || source.description,
    detail: translated.fields.detail ?? "",
    image: source.image,
    images: serializeProjectImages(gallery),
    video: source.video,
    videos: source.videos || "[]",
    links: serializeProjectLinks(translatedLinks),
    featured: source.featured,
    completed: source.completed,
    order: source.order,
    imageFrame: source.imageFrame,
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

  return { sourceLang: detected, targetLang, projectId: savedId };
}

/** Translate every project in the Studio lang list with per-item auto-detect. */
export async function translateAllProjectsToOtherLang(studioLang: LangCode): Promise<{
  sourceLang: LangCode;
  targetLang: LangCode;
  count: number;
}> {
  const projects = await prisma.project.findMany({
    where: { lang: studioLang },
    orderBy: { order: "asc" },
  });

  let lastTarget: LangCode = otherLang(studioLang);
  let lastSource: LangCode = studioLang;

  for (const project of projects) {
    const result = await translateProjectToOtherLang(project.id);
    lastSource = result.sourceLang;
    lastTarget = result.targetLang;
  }

  return { sourceLang: lastSource, targetLang: lastTarget, count: projects.length };
}
