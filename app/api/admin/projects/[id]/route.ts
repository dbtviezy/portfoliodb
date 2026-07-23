import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUnauthorized, requireAdminSession } from "@/lib/api-auth";
import { serializeProjectLinks } from "@/lib/project-links";
import {
  serializeProjectImages,
  syncCoverFromGallery,
  resolveProjectGallery,
} from "@/lib/project-images";
import { parseImageFrame, serializeImageFrame } from "@/lib/image-frame";
import { ephemeralWriteError, isEphemeralDatabase } from "@/lib/db-mode";

type RouteContext = {
  params: Promise<{ id: string }>;
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
      error: "Проект не найден в базе. Обнови страницу Studio и открой проект снова.",
      code: "not_found" as const,
      status: 404,
    };
  }
  console.error(fallback, error);
  return { error: fallback, code: "write_failed" as const, status: 500 };
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const blocked = rejectEphemeralWrites();
  if (blocked) return blocked;

  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Некорректный id проекта" }, { status: 400 });
  }

  try {
    const body = await request.json();

    const hasMedia =
      typeof body.image === "string" || Array.isArray(body.images);
    const media = hasMedia
      ? syncCoverFromGallery(resolveProjectGallery(body.image ?? "", body.images ?? []))
      : null;

    const hasFrame = body.imageFrame !== undefined;
    const frameJson = hasFrame ? serializeImageFrame(body.imageFrame) : undefined;

    const data = {
      title: body.title,
      category: body.category,
      year: body.year,
      description: body.description,
      detail: body.detail ?? "",
      ...(media
        ? {
            image: media.image,
            images: serializeProjectImages(media.images),
          }
        : {}),
      ...(frameJson ? { imageFrame: frameJson } : {}),
      video: body.video,
      links: body.links !== undefined ? serializeProjectLinks(body.links) : undefined,
      featured: body.featured,
      completed: typeof body.completed === "boolean" ? body.completed : undefined,
      order: body.order,
    };

    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    const project = await prisma.project.update({
      where: { id: projectId },
      data: cleaned,
    });

    // Keep matching-order project on the other language in sync for media + status.
    const mediaPatch: {
      image?: string;
      images?: string;
      imageFrame?: string;
      video?: string;
      completed?: boolean;
    } = {};
    if (media) {
      mediaPatch.image = media.image;
      mediaPatch.images = serializeProjectImages(media.images);
    }
    if (frameJson) mediaPatch.imageFrame = frameJson;
    if (typeof body.video === "string") mediaPatch.video = body.video;
    if (typeof body.completed === "boolean") mediaPatch.completed = body.completed;
    if (Object.keys(mediaPatch).length > 0) {
      const otherLang = project.lang === "en" ? "ru" : "en";
      await prisma.project.updateMany({
        where: { lang: otherLang, order: project.order },
        data: mediaPatch,
      });
    }

    const gallery = resolveProjectGallery(project.image, project.images);
    return NextResponse.json({
      ...project,
      image: gallery[0] || project.image,
      images: gallery,
      imageFrame: parseImageFrame(project.imageFrame),
    });
  } catch (error) {
    const mapped = mapWriteError(error, "Не удалось обновить проект");
    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (isUnauthorized(session)) return session;

  const blocked = rejectEphemeralWrites();
  if (blocked) return blocked;

  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Некорректный id проекта" }, { status: 400 });
  }

  try {
    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mapped = mapWriteError(error, "Не удалось удалить проект");
    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
