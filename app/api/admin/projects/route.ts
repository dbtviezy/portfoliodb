import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toLangCode, type LangCode } from "@/lib/content";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { serializeProjectLinks, type ProjectLink } from "@/lib/project-links";
import {
  serializeProjectImages,
  syncCoverFromGallery,
  resolveProjectGallery,
} from "@/lib/project-images";
import {
  serializeProjectVideos,
  syncPrimaryFromVideos,
  resolveProjectVideos,
} from "@/lib/project-videos";
import { parseImageFrame, serializeImageFrame } from "@/lib/image-frame";
import { ephemeralWriteError, isEphemeralDatabase } from "@/lib/db-mode";

type ProjectPayload = {
  lang?: LangCode;
  title?: string;
  category?: string;
  year?: string;
  description?: string;
  detail?: string;
  image?: string;
  images?: string[];
  imageFrame?: { zoom?: number; x?: number; y?: number };
  video?: string;
  videos?: string[];
  links?: ProjectLink[];
  featured?: boolean;
  completed?: boolean;
  order?: number;
};

function rejectEphemeralWrites() {
  if (!isEphemeralDatabase()) return null;
  return NextResponse.json(
    { error: ephemeralWriteError(), code: "ephemeral_db" },
    { status: 503 }
  );
}

function mapWriteError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes("readonly") ||
    lower.includes("read-only") ||
    lower.includes("attempt to write")
  ) {
    return {
      error: ephemeralWriteError(),
      code: "ephemeral_db" as const,
      status: 503,
    };
  }
  if (lower.includes("record to update not found") || lower.includes("p2025")) {
    return {
      error: "Проект не найден в базе (возможно, временная БД пересоздалась). Обнови Studio и попробуй снова.",
      code: "not_found" as const,
      status: 404,
    };
  }
  console.error(fallback, error);
  return { error: fallback, code: "write_failed" as const, status: 500 };
}

function mediaFromPayload(body: ProjectPayload) {
  const gallery = resolveProjectGallery(body.image ?? "", body.images ?? []);
  return syncCoverFromGallery(gallery);
}

function videosFromPayload(body: ProjectPayload) {
  return syncPrimaryFromVideos(resolveProjectVideos(body.video ?? "", body.videos ?? []));
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const { ensureSchemaUpgrades } = await import("@/lib/ensure-schema");
  await ensureSchemaUpgrades();

  const { searchParams } = new URL(request.url);
  const lang = toLangCode(searchParams.get("lang") ?? "en");

  const projects = await prisma.project.findMany({
    where: { lang },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(
    projects.map((project) => {
      const gallery = resolveProjectGallery(project.image, project.images);
      const videoList = resolveProjectVideos(project.video, project.videos);
      return {
        ...project,
        image: gallery[0] || project.image,
        images: gallery,
        imageFrame: parseImageFrame(project.imageFrame),
        video: videoList[0] || "",
        videos: videoList,
      };
    })
  );
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const blocked = rejectEphemeralWrites();
  if (blocked) return blocked;

  try {
    const body = (await request.json()) as ProjectPayload;
    const lang = toLangCode(body.lang ?? "en");
    const media = mediaFromPayload(body);
    const videoMedia = videosFromPayload(body);

    if (!body.title || !body.category || !body.year || !body.description || !media.image) {
      return NextResponse.json(
        { error: "Заполни title, category, year, description и хотя бы одно фото" },
        { status: 400 }
      );
    }

    const count = await prisma.project.count({ where: { lang } });

    const frameJson = serializeImageFrame(body.imageFrame);

    const project = await prisma.project.create({
      data: {
        lang,
        title: body.title,
        category: body.category,
        year: body.year,
        description: body.description,
        detail: body.detail ?? "",
        image: media.image,
        images: serializeProjectImages(media.images),
        imageFrame: frameJson,
        video: videoMedia.video,
        videos: serializeProjectVideos(videoMedia.videos),
        links: serializeProjectLinks(body.links),
        featured: body.featured ?? false,
        completed: body.completed !== false,
        order: body.order ?? count,
      },
    });

    const { upsertProjectSibling } = await import("@/lib/project-sync");
    await upsertProjectSibling(project.id);

    return NextResponse.json(
      {
        ...project,
        images: media.images,
        imageFrame: parseImageFrame(frameJson),
        video: videoMedia.video,
        videos: videoMedia.videos,
      },
      { status: 201 }
    );
  } catch (error) {
    const mapped = mapWriteError(error, "Не удалось создать проект");
    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
