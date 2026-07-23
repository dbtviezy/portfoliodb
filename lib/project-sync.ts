import { prisma } from "@/lib/prisma";
import type { LangCode } from "@/lib/content";

function otherLang(lang: LangCode): LangCode {
  return lang === "en" ? "ru" : "en";
}

type ProjectRow = {
  id: number;
  title: string;
  category: string;
  year: string;
  description: string;
  detail: string;
  image: string;
  images: string;
  imageFrame: string;
  video: string;
  videos: string;
  links: string;
  featured: boolean;
  completed: boolean;
  order: number;
  lang: string;
};

/**
 * Ensure every project has a sibling row in the other language (same order).
 * Media/status are shared; text is copied until Studio translates it.
 */
export async function ensureProjectLanguageMirrors(): Promise<void> {
  const projects = (await prisma.project.findMany({
    orderBy: [{ lang: "asc" }, { order: "asc" }],
  })) as ProjectRow[];

  if (projects.length === 0) return;

  const byLang = {
    en: projects.filter((p) => p.lang === "en"),
    ru: projects.filter((p) => p.lang === "ru"),
  };

  for (const sourceLang of ["en", "ru"] as const) {
    const targetLang = otherLang(sourceLang);
    const sources = byLang[sourceLang];
    const targets = byLang[targetLang];
    const targetByOrder = new Map(targets.map((p) => [p.order, p]));

    for (const source of sources) {
      const sibling = targetByOrder.get(source.order);
      if (!sibling) {
        await prisma.project.create({
          data: {
            lang: targetLang,
            title: source.title,
            category: source.category,
            year: source.year,
            description: source.description,
            detail: source.detail ?? "",
            image: source.image,
            images: source.images || "[]",
            imageFrame: source.imageFrame || '{"zoom":1,"x":50,"y":50}',
            video: source.video || "",
            videos: source.videos || "[]",
            links: source.links || "[]",
            featured: source.featured,
            completed: source.completed !== false,
            order: source.order,
          },
        });
        continue;
      }

      // Keep shared media/status in sync if sibling is missing media.
      const needsMedia =
        (!sibling.image?.trim() && source.image?.trim()) ||
        (sibling.images === "[]" && source.images && source.images !== "[]") ||
        (!sibling.video?.trim() && source.video?.trim()) ||
        (sibling.videos === "[]" && source.videos && source.videos !== "[]");

      // Only fill missing media/status on existing siblings.
      // Title/category are synced on Studio save (upsertProjectSibling), not here —
      // bidirectional title copy would fight EN↔RU edits.
      if (needsMedia || sibling.completed !== source.completed || sibling.featured !== source.featured) {
        await prisma.project.update({
          where: { id: sibling.id },
          data: {
            image: source.image?.trim() ? source.image : sibling.image,
            images:
              source.images && source.images !== "[]" ? source.images : sibling.images,
            imageFrame: source.imageFrame || sibling.imageFrame,
            video: source.video?.trim() ? source.video : sibling.video,
            videos:
              source.videos && source.videos !== "[]" ? source.videos : sibling.videos,
            featured: source.featured,
            completed: source.completed !== false,
            year: source.year || sibling.year,
          },
        });
      }
    }
  }
}

/** After creating/updating a project, upsert its other-language sibling. */
export async function upsertProjectSibling(sourceId: number): Promise<void> {
  const source = await prisma.project.findUnique({ where: { id: sourceId } });
  if (!source) return;

  const sourceLang = (source.lang === "ru" ? "ru" : "en") as LangCode;
  const targetLang = otherLang(sourceLang);

  const existing = await prisma.project.findFirst({
    where: { lang: targetLang, order: source.order },
  });

  const shared = {
    image: source.image,
    images: source.images || "[]",
    imageFrame: source.imageFrame || '{"zoom":1,"x":50,"y":50}',
    video: source.video || "",
    videos: source.videos || "[]",
    featured: source.featured,
    completed: source.completed !== false,
    year: source.year,
    order: source.order,
  };

  if (existing) {
    await prisma.project.update({
      where: { id: existing.id },
      data: {
        ...shared,
        // Title and category are shared brand labels — always keep in sync.
        title: source.title,
        category: source.category,
        ...(!existing.description?.trim()
          ? {
              description: source.description,
              detail: source.detail ?? "",
              links: source.links || "[]",
            }
          : {}),
      },
    });
    return;
  }

  await prisma.project.create({
    data: {
      lang: targetLang,
      title: source.title,
      category: source.category,
      description: source.description,
      detail: source.detail ?? "",
      links: source.links || "[]",
      ...shared,
    },
  });
}
